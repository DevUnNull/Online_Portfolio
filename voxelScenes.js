// Voxel dioramas for the hero island, one per game (keyed by the hero slide's href).
// Grid: x, z in [-6, 5]; y = 0 is the island's top layer (coloured by `ground`), objects start at y = 1.
// Each voxel: [x, y, z, hexColor, glow]; glow > 1 pushes the colour past 1.0 so the bloom pass picks it up.

const rng = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

function build(fn) {
    const vox = [];
    const put = (x, y, z, c, glow = 1) => vox.push([x, y, z, c, glow]);
    // filled or hollow box; colour can be a function (x, y, z, onShell) => hex | [hex, glow] | null (skip)
    const box = (x0, y0, z0, w, h, d, c, hollow = false) => {
        for (let x = x0; x < x0 + w; x++) for (let y = y0; y < y0 + h; y++) for (let z = z0; z < z0 + d; z++) {
            const shell = x === x0 || x === x0 + w - 1 || y === y0 || y === y0 + h - 1 || z === z0 || z === z0 + d - 1;
            if (hollow && !shell) continue;
            const v = typeof c === 'function' ? c(x, y, z) : c;
            if (v == null) continue;
            Array.isArray(v) ? put(x, y, z, v[0], v[1]) : put(x, y, z, v);
        }
    };
    // ellipsoid shell; colour(x, y, z, n) gets the outward unit normal n = [nx, ny, nz]
    const blob = (cx, cy, cz, a, b, c, colour) => {
        const inside = (x, y, z) => ((x - cx) / a) ** 2 + ((y - cy) / b) ** 2 + ((z - cz) / c) ** 2 <= 1;
        for (let x = Math.floor(cx - a); x <= Math.ceil(cx + a); x++)
            for (let y = Math.floor(cy - b); y <= Math.ceil(cy + b); y++)
                for (let z = Math.floor(cz - c); z <= Math.ceil(cz + c); z++) {
                    if (!inside(x, y, z)) continue;
                    if (inside(x + 1, y, z) && inside(x - 1, y, z) && inside(x, y + 1, z) && inside(x, y - 1, z) && inside(x, y, z + 1) && inside(x, y, z - 1)) continue;
                    const nx = (x - cx) / (a * a), ny = (y - cy) / (b * b), nz = (z - cz) / (c * c), len = Math.hypot(nx, ny, nz) || 1;
                    const v = colour(x, y, z, [nx / len, ny / len, nz / len]);
                    if (v == null) continue;
                    Array.isArray(v) ? put(x, y, z, v[0], v[1]) : put(x, y, z, v);
                }
    };
    fn(put, box, blob);
    return vox;
}

const tree = (put, box, x, z, trunkH, leaf = 0x16a34a) => {
    box(x, 1, z, 1, trunkH, 1, 0x92400e);
    box(x - 1, trunkH + 1, z - 1, 3, 2, 3, leaf);
    put(x, trunkH + 3, z, leaf);
};

export const scenes = {
    // Psychological horror: Vietnamese apartment block, floor 7 glowing red
    '707TheReunion.html': {
        ground: (x, z) => (x === -6 || x === 5 || z === -6 || z === 5) ? 0x52525b : 0x3f3f46,
        dirt: 0x3f3f46,
        voxels: build((put, box) => {
            const r = rng(707);
            box(-3, 1, -3, 6, 10, 6, (x, y, z) => {
                const corner = (x === -3 || x === 2) && (z === -3 || z === 2);
                if (corner) return 0xa1a1aa;
                if (z === 2 && y <= 2 && (x === -1 || x === 0)) return 0x292524; // door
                const face = z === 2 ? x : x === 2 ? z : null;
                if (face !== null && y % 2 === 0 && face % 2 === 0) {
                    if (y === 8) return [0xef4444, 3];
                    return r() > 0.5 ? [0xfde68a, 2.2] : 0x1e293b;
                }
                return 0xd6d3d1;
            }, true);
            box(-3, 11, -3, 6, 1, 6, 0x57534e);
            box(1, 12, 0, 1, 2, 1, 0x71717a); // antenna
        })
    },

    // Horror / mystery: the last night train under one lamp
    'LastTrain.html': {
        ground: (x, z) => (z === -2 || z === 3) ? 0x9ca3af : (x % 2 === 0 && z > -2 && z < 3) ? 0x57534e : 0x292524,
        voxels: build((put, box) => {
            box(-5, 1, -1, 10, 4, 4, (x, y, z) =>
                y === 3 && (z === -1 || z === 2) && x % 2 === 0 && x > -5 && x < 4 ? [0xd9f99d, 2.5]
                    : y === 2 ? 0xfbbf24 : 0x991b1b, true);
            box(-5, 5, -1, 10, 1, 4, 0x450a0a);
            box(-6, 1, -4, 1, 4, 1, 0x52525b);
            put(-6, 5, -4, 0xfef3c7, 3);
            put(3, 1, -4, 0xe5e7eb, 1.4); // someone waiting on the platform...
            put(3, 2, -4, 0xe5e7eb, 1.4);
        })
    },

    // Casual / educational: one big green recycling bin
    'ChienBinhXanhNhi.html': {
        ground: (x, z) => z >= 4 ? 0xfde68a : 0x86efac,
        voxels: build((put, box) => {
            const BIN = 0x16a34a, DARK = 0x166534;
            // recycling mark on the front: three arrows as a small white triangle
            const mark = ['..#..', '.#.#.', '#####'];
            box(-3, 2, -2, 6, 7, 5, (x, y, z) => {
                const row = 7 - y, col = x + 3;
                if (z === 2 && row >= 0 && row < 3 && col < 5 && mark[row][col] === '#') return 0xf8fafc;
                if (z === 2 && y === 3) return DARK;             // kick band
                return BIN;
            }, true);
            box(-3, 9, -3, 6, 1, 6, DARK);                        // lid (overhangs the front and back)
            box(-1, 10, -3, 2, 1, 1, 0x14532d);                   // lid handle
            box(-3, 6, -3, 6, 1, 1, 0x14532d);                    // push bar on the back
            [[-3, -2], [2, -2]].forEach(([x, z]) => box(x, 1, z, 1, 1, 2, 0x111827)); // wheels
            box(-2, 1, 1, 4, 1, 1, 0x14532d);                     // front foot
            put(4, 1, 3, 0xe5e7eb); put(-5, 1, 2, 0x60a5fa); put(4, 1, -3, 0xf87171); // litter waiting to be sorted
        })
    },

    // Game jam: a giant white mask with glowing red eyes
    'BehindTheMask.html': {
        ground: (x, z) => (x + z) % 2 === 0 ? 0x18181b : 0x27272a,
        dirt: 0x27272a,
        voxels: build((put, box) => {
            const rows = [
                '..WWWWW..',
                '.WWWWWWW.',
                'WWWWWWWWW',
                'WW..W..WW',
                'WR..W..RW',
                'WWWWWWWWW',
                'WWWW.WWWW',
                '.WRWWWRW.',
                '..WRRRW..',
                '...WWW...'
            ];
            rows.forEach((row, i) => [...row].forEach((ch, j) => {
                const x = j - 5, y = 12 - i;
                if (ch === 'W') { put(x, y, 0, 0xf5f5f4); put(x, y, -1, 0xd6d3d1); }
                if (ch === 'R') { put(x, y, 0, 0xdc2626); put(x, y, -1, 0xd6d3d1); }
                if (ch === '.' && (i === 3 || i === 4)) put(x, y, -1, 0xef4444, 3); // glowing eyes behind the holes
            }));
            box(-1, 1, -1, 1, 2, 1, 0x3f3f46); // stand
            [[-5, 3], [4, 3]].forEach(([x, z]) => { box(x, 1, z, 1, 2, 1, 0xf5f5f4); put(x, 3, z, 0xfb923c, 3); }); // candles
        })
    },

    // Procedural runner: the FPT "doctor frog" (cap, suit, diploma) racing toward a purple portal
    'BrainrotRunner.html': {
        ground: (x, z) => (x === -6 || x === 5) ? 0xf59e0b : ((x === -4 || x === 3) && z % 2 === 0) ? 0xe5e7eb : 0x64748b,
        voxels: build((put, box) => {
            for (let x = -5; x <= 4; x++) for (let y = 1; y <= 10; y++) {
                const d = Math.hypot(x + 0.5, y - 5.5);
                if (Math.abs(d - 4.5) < 0.55) put(x, y, -5, 0xc084fc, 2.6);
            }
            const GREEN = 0x65a30d, SUIT = 0x6b7280, CAP = 0x111827;
            box(-2, 1, -1, 2, 1, 2, 0x2563eb); box(1, 1, -1, 2, 1, 2, 0x2563eb); // blue sneakers
            box(-2, 2, -1, 2, 1, 2, SUIT); box(1, 2, -1, 2, 1, 2, SUIT);           // trousers
            box(-2, 3, -1, 5, 4, 3, (x, y, z) => {                                 // jacket, shirt + tie on the front
                if (z === 1 && x === 0) return y === 6 ? 0xf8fafc : 0x1f2937;
                if (z === 1 && (x === -1 || x === 1) && y >= 5) return 0xf8fafc;
                return SUIT;
            });
            box(-3, 4, -1, 1, 3, 2, SUIT); box(3, 4, -1, 1, 3, 2, SUIT);           // sleeves
            put(-3, 3, 0, GREEN); put(3, 3, 0, GREEN);                              // hands
            box(3, 3, 1, 1, 1, 2, 0xfef3c7);                                        // rolled diploma
            box(-3, 7, -2, 7, 3, 5, (x, y, z) => {                                  // big frog head
                if (z === 2 && y === 7) return 0x3f6212;                            // wide flat mouth
                if (z === 2 && y === 9 && (x === -2 || x === 2)) return 0xfef9c3;   // eyes
                if (z === 2 && y === 9 && (x === -1 || x === 1)) return 0x111827;
                return GREEN;
            });
            box(-2, 10, 0, 2, 1, 2, GREEN); box(1, 10, 0, 2, 1, 2, GREEN);           // heavy eyelids
            box(-2, 10, -2, 5, 1, 2, CAP);                                          // mortarboard skull cap
            box(-3, 11, -3, 7, 1, 5, CAP);                                          // board
            put(3, 10, -3, 0xfacc15, 2.2); put(3, 9, -3, 0xfacc15, 2.2);            // tassel
            [[-5, -1], [-5, -3], [4, -2], [4, 0]].forEach(([x, z]) => put(x, 2, z, 0xfacc15, 2.5)); // coins
            box(-5, 1, 3, 1, 2, 1, 0xef4444);                                       // obstacle
        })
    },

    // Tower defense: castle, path and incoming slimes
    'HeroicDefense.html': {
        ground: (x, z) => (z === 0 || z === -1) ? 0xa16207 : 0x65a30d,
        voxels: build((put, box) => {
            box(2, 1, -5, 3, 5, 3, 0x9ca3af);
            box(2, 6, -5, 3, 1, 3, (x, y, z) => (x + z) % 2 === 0 ? 0x6b7280 : null); // battlements
            box(3, 7, -4, 1, 2, 1, 0x78350f);
            put(4, 8, -4, 0xef4444, 1.6); // flag
            box(-5, 1, 2, 2, 3, 2, 0x9ca3af);
            put(-5, 4, 2, 0x6b7280); put(-4, 4, 3, 0x6b7280);
            [-5, -2, 1].forEach(x => { put(x, 1, 0, 0x22c55e); put(x, 2, 0, 0x4ade80, 1.3); }); // slimes
            put(0, 4, -2, 0xf97316, 3); // fireball
            tree(put, box, -4, -4, 2);
        })
    },

    // Action platformer: the round black fuzzy fly hovering over the jungle
    'JungleSurvivor.html': {
        ground: (x, z) => (x === 0 || x === 1) ? 0x0284c7 : 0x3f6212,
        voxels: build((put, box, blob) => {
            const r = rng(42);
            const [cx, cy, cz] = [-0.5, 6.5, -0.5];
            blob(cx, cy, cz, 3.6, 3.6, 3.6, (x, y, z, n) => {
                if (r() > 0.72) put(x + Math.round(n[0] * 1.3), y + Math.round(n[1] * 1.3), z + Math.round(n[2] * 1.3), 0x0b0f19); // fuzz
                return (x + y + z) % 3 === 0 ? 0x1f2937 : 0x111827;
            });
            // googly eyes popping out of the front
            [[-3, -2], [1, 2]].forEach(([x0, x1]) => {
                for (let x = x0; x <= x1; x++) for (let y = 6; y <= 7; y++) put(x, y, 3, 0xf8fafc);
                put(x0 === -3 ? -2 : 1, 6, 4, 0x020617);
            });
            // wings
            box(-6, 8, -3, 1, 2, 3, [0xcbd5e1, 1.1]); box(5, 8, -3, 1, 2, 3, [0xcbd5e1, 1.1]);
            box(-5, 9, -2, 1, 1, 2, [0xe2e8f0, 1.1]); box(4, 9, -2, 1, 1, 2, [0xe2e8f0, 1.1]);
            // a bit of jungle below
            box(-6, 1, -6, 2, 2, 2, 0x15803d); box(3, 1, 3, 2, 1, 2, 0x166534); put(-5, 1, 3, 0x78350f); put(-5, 2, 3, 0x22c55e);
        })
    },

    // Simulation / management: a giant voxel bust of anh Độ — bald, thick brows, full beard, mole in the middle of the forehead
    'MixieEmpire.html': {
        ground: (x, z) => (x === -1 || x === 0 || z === -1 || z === 0) ? 0x4b5563 : 0x4ade80,
        voxels: build((put, box, blob) => {
            const SKIN = 0xe0ac69, SHADE = 0xc68642, HAIR = 0x1c1917;
            blob(-0.5, 6, -0.5, 4.6, 5.2, 4.2, (x, y, z, n) => {
                const dx = Math.abs(x + 0.5), front = n[2] > 0.55;
                if (y <= 3 && n[2] > -0.3) return front && y === 3 && dx <= 0.5 ? 0x9f1239 : HAIR; // beard + lips
                if (y === 10 && x === 0 && n[2] > 0.3) return HAIR;            // the mole, centre of the forehead
                if (front) {
                    if (y === 9 && (dx === 1.5 || dx === 2.5)) return HAIR;    // eyebrows (row 8 stays skin so they don't merge with the eyes)
                    if (y === 7 && dx === 1.5) return 0x0c0a09;                // pupils
                    if (y === 7 && dx === 2.5) return 0xf8fafc;                // eye whites
                    if ((y === 5 || y === 6) && dx === 0.5) return SHADE;      // nose
                    if (y === 4 && dx <= 2.5) return HAIR;                     // moustache
                }
                if (dx >= 3.5 && y >= 4 && y <= 6) return HAIR;                // sideburns into the beard
                if (y >= 10) return 0xf1c48f;                                  // shiny bald top
                return SKIN;
            });
            [[-5, -5], [3, -5], [-5, 3], [3, 3]].forEach(([x, z], i) =>        // tiny shops on the corners of the empire
                box(x, 1, z, 2, 2 + (i % 2), 2, (bx, by) => by === 1 ? [0xfef9c3, 1] : [0xf472b6, 0x60a5fa, 0xfbbf24, 0xa78bfa][i]));
            box(-1, 12, -1, 2, 1, 1, [0xfacc15, 2.5]);                        // coin floating above
        })
    }

};
