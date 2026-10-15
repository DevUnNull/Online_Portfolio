// Hero overworld: one floating voxel island per game, laid out as a journey through a twilight sky.
// Scrolling (pinned hero), arrow keys or the caption dots travel between islands. An undiscovered island
// only shows a glowing "?"; arriving there re-assembles it into the game's diorama and pops a toast.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { scenes } from './voxelScenes.js';

const canvas = document.getElementById('hero-animated-bg');
const hero = document.getElementById('home');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// `lenis` is a global `let` from index.html's classic script (not a window property)
const smoothScroller = () => (typeof lenis !== 'undefined' ? lenis : null);

let renderer;
try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
    console.warn('WebGL unavailable, hero 3D disabled', e);
}

if (renderer) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x1e3a5f, 30, 120);
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500);

    // --- Twilight sky dome with twinkling stars near the top ---
    const skyMat = new THREE.ShaderMaterial({
        side: THREE.BackSide, depthWrite: false, fog: false,
        uniforms: { uTime: { value: 0 } },
        vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: `
            varying vec3 vDir; uniform float uTime;
            float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
            void main(){
                float h = vDir.y;
                vec3 col = mix(vec3(0.95, 0.55, 0.45), vec3(0.12, 0.25, 0.45), smoothstep(-0.05, 0.12, h)); // warm horizon band
                col = mix(col, vec3(0.03, 0.05, 0.14), smoothstep(0.12, 0.7, h));                           // deep night overhead
                col = mix(col, vec3(0.08, 0.16, 0.30), smoothstep(0.0, -0.4, h));                           // below: sea of dusk
                vec3 cell = floor(vDir * 180.0);
                float star = step(0.997, hash(cell)) * smoothstep(0.15, 0.5, h);
                col += star * (0.6 + 0.4 * sin(uTime * 2.0 + hash(cell) * 40.0));
                gl_FragColor = vec4(col, 1.0);
            }`
    });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), skyMat));

    // --- Shared voxel building blocks ---
    const VOXEL = 0.3;
    const boxGeo = new THREE.BoxGeometry(VOXEL * 0.94, VOXEL * 0.94, VOXEL * 0.94);
    const voxMat = new THREE.MeshStandardMaterial({ roughness: 0.75, metalness: 0.05 });
    // Nam mode draws voxels as outlines only: keep the face border, discard the rest
    const edgesOnly = { value: 0 };
    voxMat.defines = { USE_UV: '' };
    voxMat.onBeforeCompile = shader => {
        shader.uniforms.uEdges = edgesOnly;
        shader.fragmentShader = 'uniform float uEdges;\n' + shader.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
            if (uEdges > 0.5) {
                float d = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
                if (d > 0.07) discard;
                gl_FragColor.rgb = vec3(0.9);
            }`);
    };
    const tmpColor = new THREE.Color();
    const dummy = new THREE.Object3D();

    const basePositions = [];
    [[0, 6], [-1, 5], [-2, 4], [-3, 3], [-4, 2]].forEach(([y, half]) => {
        for (let x = -half; x < half; x++) for (let z = -half; z < half; z++) basePositions.push([x, y, z]);
    });
    const withBase = (ground, dirt, objects) => [
        ...basePositions.map(([x, y, z]) => [x, y, z, y === 0 ? ground(x, z) : (dirt ?? ((x + z) % 2 ? 0x4a3728 : 0x3d2d20)), 1]),
        ...[...objects].sort((a, b) => a[1] - b[1]) // objects build bottom-up (lower voxels get earlier delays)
    ];

    // glowing "?" shown on islands not yet discovered
    const questionVoxels = [];
    ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'].forEach((row, i) =>
        [...row].forEach((ch, j) => { if (ch === '#') questionVoxels.push([j - 3, 9 - i, 0, 0xfacc15, 2.6]); }));

    // One island = one InstancedMesh that can morph between voxel lists
    function makeIsland(lists) {
        const max = Math.max(...lists.map(l => l.length));
        const mesh = new THREE.InstancedMesh(boxGeo, voxMat, max);
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        const from = new Float32Array(max * 7), to = new Float32Array(max * 7), cur = new Float32Array(max * 7);
        const arc = new Float32Array(max), delay = new Float32Array(max);
        let t = 1;

        const write = (i, lift = 0) => {
            const o = i * 7;
            dummy.position.set(cur[o], cur[o + 1] + lift, cur[o + 2]);
            dummy.scale.setScalar(cur[o + 6]);
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
            mesh.setColorAt(i, tmpColor.setRGB(cur[o + 3], cur[o + 4], cur[o + 5]));
        };
        const encode = (list, i, out) => {
            const v = list[i], o = i * 7;
            if (!v) { out[o + 6] = 0; return false; }
            tmpColor.set(v[3]).multiplyScalar(v[4]);
            out.set([(v[0] + 0.5) * VOXEL, v[1] * VOXEL, (v[2] + 0.5) * VOXEL, tmpColor.r, tmpColor.g, tmpColor.b, 1], o);
            return true;
        };
        const flush = () => { mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; };

        const island = {
            group: new THREE.Group(),
            snap(list) {
                for (let i = 0; i < max; i++) { encode(list, i, cur); write(i); }
                t = 1;
                flush();
            },
            morph(list) {
                from.set(cur);
                for (let i = 0; i < max; i++) {
                    const o = i * 7;
                    if (encode(list, i, to)) {
                        if (from[o + 6] === 0) { // appearing: rain down from above
                            from[o] = to[o] + (Math.random() - 0.5) * 2; from[o + 1] = to[o + 1] + 5 + Math.random() * 4; from[o + 2] = to[o + 2] + (Math.random() - 0.5) * 2;
                            from[o + 3] = to[o + 3]; from[o + 4] = to[o + 4]; from[o + 5] = to[o + 5];
                        }
                        delay[i] = Math.min(0.5, list[i][1] * 0.03 + 0.12) + Math.random() * 0.1; // max 0.6 + 0.4 travel = every voxel lands by t = 1
                    } else { // vanishing: float up and shrink
                        to.set([cur[o] + (Math.random() - 0.5) * 3, cur[o + 1] + 4, cur[o + 2] + (Math.random() - 0.5) * 3, cur[o + 3], cur[o + 4], cur[o + 5], 0], o);
                        delay[i] = Math.random() * 0.25;
                    }
                    const moved = Math.abs(from[o] - to[o]) + Math.abs(from[o + 1] - to[o + 1]) + Math.abs(from[o + 2] - to[o + 2]) > 0.01;
                    arc[i] = moved ? 0.5 + Math.random() * 1.5 : 0;
                }
                t = 0;
            },
            update(dt) {
                if (t >= 1) return;
                t = reduceMotion ? 1 : Math.min(1, t + dt / 1.8);
                for (let i = 0; i < max; i++) {
                    const o = i * 7;
                    const k = Math.min(1, Math.max(0, (t - delay[i]) / 0.4));
                    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
                    for (let c = 0; c < 7; c++) cur[o + c] = from[o + c] + (to[o + c] - from[o + c]) * e;
                    write(i, Math.sin(Math.PI * e) * arc[i]);
                }
                flush();
            }
        };
        island.group.add(mesh);
        return island;
    }

    // --- The journey: one island per hero slide, zig-zagging away from the camera ---
    const slides = [...document.querySelectorAll('.scifi-slide')];
    const islands = slides.map((slide, i) => {
        const def = scenes[slide.getAttribute('href')];
        const hidden = withBase(def.ground, def.dirt, questionVoxels);
        const found = withBase(def.ground, def.dirt, def.voxels);
        const island = makeIsland([hidden, found]);
        Object.assign(island, {
            found, discovered: false,
            home: new THREE.Vector3(Math.sin(i * 2.1) * 6, Math.sin(i * 1.3) * 1.5, -i * 15),
            title: slide.querySelector('.scifi-slide-title')?.textContent.trim() ?? ''
        });
        island.group.position.copy(island.home);
        island.group.rotation.y = -0.3;
        island.snap(hidden);
        scene.add(island.group);
        return island;
    });

    // Scenery: grassy islets far away for depth
    const islet = withBase(() => 0x4d7c0f, null, []);
    for (let i = 0; i < 14; i++) {
        const deco = makeIsland([islet]);
        deco.snap(islet);
        deco.group.position.set((i % 2 ? 1 : -1) * (18 + Math.random() * 25), -4 + Math.random() * 10, 10 - Math.random() * 130);
        deco.group.scale.setScalar(0.4 + Math.random() * 0.8);
        deco.group.rotation.y = Math.random() * Math.PI;
        scene.add(deco.group);
    }

    // Voxel clouds drifting between the islands
    const CLOUDS = 36, PUFFS = 9;
    const cloudMesh = new THREE.InstancedMesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0xe0f2fe, roughness: 1, transparent: true, opacity: 0.85 }),
        CLOUDS * PUFFS
    );
    // keep clouds out of the camera corridor: either a low layer under the islands, or drifting along the far sides
    const clouds = Array.from({ length: CLOUDS }, (_, i) => {
        const low = i % 2 === 0, side = i % 4 === 1 ? 1 : -1;
        const minX = low ? -50 : (side > 0 ? 14 : -50), maxX = low ? 50 : (side > 0 ? 50 : -14);
        return {
            minX, maxX, x: minX + Math.random() * (maxX - minX),
            y: low ? -12 + Math.random() * 5 : -5 + Math.random() * 12, z: 15 - Math.random() * 140,
            speed: 0.3 + Math.random() * 0.6,
            puffs: Array.from({ length: PUFFS }, () => [(Math.random() - 0.5) * 4, Math.random() * 0.8, (Math.random() - 0.5) * 2, 0.8 + Math.random() * 1.4])
        };
    });
    scene.add(cloudMesh);
    const updateClouds = dt => {
        clouds.forEach((c, ci) => {
            c.x += c.speed * dt;
            if (c.x > c.maxX) c.x = c.minX;
            c.puffs.forEach(([px, py, pz, s], pi) => {
                dummy.position.set(c.x + px, c.y + py, c.z + pz);
                dummy.scale.set(s * 1.4, s * 0.7, s);
                dummy.updateMatrix();
                cloudMesh.setMatrixAt(ci * PUFFS + pi, dummy.matrix);
            });
        });
        cloudMesh.instanceMatrix.needsUpdate = true;
    };
    updateClouds(0);

    // --- The explorer: a tiny voxel character hopping from island to island ---
    const explorer = new THREE.Group();
    [[0, 0x1e293b], [1, 0x0ea5e9], [2, 0xfcd34d]].forEach(([y, c]) => {
        const m = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 }));
        m.position.y = y * VOXEL;
        explorer.add(m);
    });
    const scarf = new THREE.Mesh(boxGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(0x10b981).multiplyScalar(2.2) }));
    scarf.position.set(0, 1.5 * VOXEL, -VOXEL * 0.6);
    scarf.scale.set(0.6, 0.3, 1);
    explorer.add(scarf);
    scene.add(explorer);
    const ANCHOR = new THREE.Vector3(5.5 * VOXEL, VOXEL, 5.5 * VOXEL); // front-right corner tile, free on every island
    const anchorWorld = (island, out) => out.copy(ANCHOR).applyMatrix4(island.group.matrixWorld);

    // --- Lights + post-processing ---
    scene.add(new THREE.HemisphereLight(0xbae6fd, 0x312e81, 1.8));
    const sun = new THREE.DirectionalLight(0xffedd5, 2.6);
    sun.position.set(-6, 10, 8);
    scene.add(sun);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.8, 0.4, 0.95); // high threshold: only glow voxels bloom
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    // founder modes (founder-mode.js): Nam = outlines, no bloom, slow camera; Hoàng = heavy bloom
    let camEase = 0.001;
    const applyMode = mode => {
        edgesOnly.value = mode === 'nam' ? 1 : 0;
        bloom.enabled = mode !== 'nam';
        bloom.strength = mode === 'hoang' ? 1.2 : 0.8;
        bloom.threshold = mode === 'hoang' ? 0.8 : 0.95;
        camEase = mode === 'nam' ? 0.08 : 0.001;
        if (reduceMotion) frame();
    };
    window.addEventListener('founder-mode', e => applyMode(e.detail));

    // desktop: island framed right of the text; portrait: island centred between title and caption
    const camOffset = new THREE.Vector3(), lookOffset = new THREE.Vector3();
    function resize() {
        const w = canvas.clientWidth, h = canvas.clientHeight;
        if (!w || !h) return;
        camera.aspect = w / h;
        camera.fov = w / h > 1 ? 50 : 70;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
        composer.setSize(w, h);
        if (w / h > 1) { camOffset.set(-5.5, 4.2, 14); lookOffset.set(-3.8, 2, 0); }
        else { camOffset.set(0, 5.5, 18); lookOffset.set(0, 2.4, 0); }
    }
    window.addEventListener('resize', resize);
    resize();

    // --- Travel: scroll progress through the pinned hero = position along the journey ---
    const last = islands.length - 1;
    let journey = 0, current = -1, travelTrigger = null, toastTimer, direction = 1;
    const toast = document.getElementById('exploreToast');
    const counter = document.getElementById('exploreCount');
    const heroLeft = document.querySelector('.hero-left');

    const arrive = i => {
        current = i;
        window.dispatchEvent(new CustomEvent('hero-slide', { detail: i }));
        const island = islands[i];
        if (island.discovered) return;
        island.discovered = true;
        island.morph(island.found);
        if (i > 0) window.dispatchEvent(new CustomEvent('island-discovered', { detail: i }));
        const found = islands.filter(s => s.discovered).length;
        if (counter) counter.textContent = `${found}/${islands.length}`;
        if (toast && i > 0) {
            const label = document.documentElement.lang === 'vi' ? 'Đã khám phá' : 'Island discovered';
            toast.textContent = `🏝 ${label}: ${island.title} (${found}/${islands.length})`;
            toast.classList.add('show');
            clearTimeout(toastTimer);
            toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
        }
    };

    const goTo = i => {
        i = THREE.MathUtils.clamp(i, 0, last);
        if (!travelTrigger) { journey = i; return; }
        const y = travelTrigger.start + (travelTrigger.end - travelTrigger.start) * (i / last);
        const scroller = smoothScroller();
        scroller ? scroller.scrollTo(y) : window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
    };
    window.addEventListener('hero-goto', e => goTo(e.detail));
    window.addEventListener('keydown', e => {
        if (!travelTrigger || window.scrollY > travelTrigger.end + 10 || e.target.closest('input, textarea')) return;
        if (e.key === 'ArrowRight') { e.preventDefault(); goTo(Math.round(journey) + 1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(Math.round(journey) - 1); }
    });

    if (window.ScrollTrigger) {
        travelTrigger = window.ScrollTrigger.create({
            trigger: hero,
            start: 'top top',
            end: () => '+=' + window.innerHeight * 0.9 * last,
            pin: true,
            refreshPriority: 2, // created after triggers further down the page; refresh first so they include this pin
            onUpdate: self => { journey = self.progress * last; if (self.direction) direction = self.direction; }
        });
        // when scrolling stops between islands, step on to the next island in the scroll direction (one wheel notch = one hop).
        // Done here rather than with ScrollTrigger's snap so it cooperates with Lenis.
        window.ScrollTrigger.addEventListener('scrollEnd', () => {
            if (!travelTrigger.isActive || smoothScroller()?.isScrolling) return; // never cut into a scroll that is still running
            const frac = journey - Math.floor(journey);
            if (frac > 0.02 && frac < 0.98) goTo(direction > 0 ? Math.ceil(journey) : Math.floor(journey));
        });
        window.ScrollTrigger.refresh();
    }

    let visible = true;
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(hero);

    const clock = new THREE.Clock();
    const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), lookNow = new THREE.Vector3();
    const a = new THREE.Vector3(), b = new THREE.Vector3();
    const pointer = { x: 0, y: 0 };
    window.addEventListener('pointermove', e => {
        pointer.x = e.clientX / window.innerWidth * 2 - 1;
        pointer.y = e.clientY / window.innerHeight * 2 - 1;
    });
    let firstFrame = true;

    function frame() {
        const dt = Math.min(clock.getDelta(), 0.1);
        const t = clock.elapsedTime;
        skyMat.uniforms.uTime.value = t;

        const nearest = Math.round(journey);
        if (nearest !== current && Math.abs(journey - nearest) < 0.25) arrive(nearest);

        islands.forEach((island, i) => {
            island.group.position.y = island.home.y + Math.sin(t * 0.8 + i) * 0.15;
            island.group.updateMatrixWorld();
            island.update(dt);
        });
        updateClouds(dt);

        // camera glides between islands (smoothed so jumps never feel abrupt)
        const i0 = Math.min(Math.floor(journey), last), i1 = Math.min(i0 + 1, last), k = journey - i0;
        a.copy(islands[i0].home).lerp(islands[i1].home, k);
        camPos.copy(a).add(camOffset).add(b.set(pointer.x * 0.8, -pointer.y * 0.4, 0));
        camLook.copy(a).add(lookOffset);
        const smooth = firstFrame || reduceMotion ? 1 : 1 - Math.pow(camEase, dt);
        camera.position.lerp(camPos, smooth);
        lookNow.lerp(camLook, smooth);
        camera.lookAt(lookNow);
        firstFrame = false;

        // explorer hops in an arc from one island's corner tile to the next
        anchorWorld(islands[i0], a); anchorWorld(islands[i1], b);
        explorer.position.lerpVectors(a, b, k);
        explorer.position.y += Math.sin(Math.PI * k) * 3 + Math.abs(Math.sin(t * 4)) * 0.05;
        const facing = k > 0.02 && k < 0.98 ? Math.atan2(b.x - a.x, b.z - a.z) : -0.3;
        explorer.rotation.y += (facing - explorer.rotation.y) * 0.1;

        // the intro text steps back once the journey starts
        if (heroLeft) heroLeft.style.opacity = String(1 - Math.min(journey, 1) * 0.8);

        composer.render();
    }

    function loop() {
        requestAnimationFrame(loop);
        if (visible && !document.hidden) frame();
    }

    applyMode(document.documentElement.dataset.mode);
    if (reduceMotion) {
        frame();
        window.addEventListener('resize', frame);
        window.addEventListener('scroll', frame, { passive: true });
    } else {
        loop();
    }
    canvas.classList.add('ready');
}
