# SSS Studio Website: Tiến độ & Lộ trình

> Cập nhật: 15/10/2026. Đọc file này trước khi làm tiếp.
> Code nằm trên nhánh `redesign-explorer` (chưa merge vào `main`, chưa push).

---

## 1. Concept đã chốt

- **SSS = Super Startup Simulator.** Ý nghĩa: "mô phỏng được mọi thể loại game". Tên chính thức giữ nguyên, không đặt tên mới cho 3 chữ S.
- **3 founder = 3 tính cách**, thể hiện trong thiết kế (không phải tên gọi):
  - **Hải**: đa dạng, mô phỏng/copy được mọi thứ → lớp **nội dung** (thế giới voxel biến hình)
  - **Nam**: tối giản → lớp **bộ khung** (bố cục, chữ, khoảng trắng)
  - **Hoàng**: màu mè → lớp **điểm nhấn** (màu, hiệu ứng, achievement)
- **Cảm giác chủ đạo:** vào web như đang **chơi game khám phá** (overworld), không phải xem portfolio.

---

## 2. Đã làm ✅

### Sửa lỗi & tối ưu
- [x] **Form liên hệ** chạy lại: khôi phục `emailjs.init(...)` (bị xoá ở commit `1c8c9ca`) và sửa ID dịch vụ thành `service_profileUnNull`. *(Chưa gửi thử email thật.)*
- [x] Sửa link GitHub (`DevUnNull`), `og:url`, tiêu đề "DevSSS Studio" ở `design-patterns.html` và `knowledge.html`.
- [x] Bỏ ảnh `in707_1` (đã bị xoá khỏi repo) khỏi `707TheReunion.html`.
- [x] **Ảnh chuyển sang WebP:** từ khoảng 18MB còn khoảng 3MB. File PNG/JPG gốc vẫn còn trong `assets/`.
- [x] Bỏ Three.js r128, Matter.js và khoảng 270 dòng code chết.
- [x] Nút "Home" và mọi link `#` cuộn qua Lenis (trước đó bị lỗi khi Hero đang được ghim).

### Chuyển động & trải nghiệm
- [x] GSAP 3.13 (SplitText miễn phí) + **Lenis** cuộn mượt + tiêu đề hiện ra từng chữ.
- [x] **View Transitions** khi chuyển trang: tiêu đề game bay sang `<h1>` của trang chi tiết (`detail_page.css`).
- [x] **Projects cuộn ngang** có ghim trên desktop (trên 1024px), ảnh parallax, thanh tiến trình. Mobile giữ bento grid.
- [x] Hỗ trợ `prefers-reduced-motion`.

### Bộ khung tối giản (lớp của Nam)
- [x] Font gom còn **VT323 + Space Grotesk + Inter** (bỏ Cormorant, Lora), áp dụng cả trang con.
- [x] Bỏ lưới chấm nhấp nháy, hạt bay toàn trang, viền xoay quanh thẻ, "tai thỏ" trên thẻ, glow neon trên chữ, hiệu ứng nảy elastic.
- [x] Khoảng cách giữa các section rộng hơn (từ 6rem lên 8rem).

### Hero = bản đồ khám phá (lớp của Hải)
- [x] Nền **bầu trời hoàng hôn** + mây voxel + đảo nhỏ ở xa (đã bỏ thung lũng wireframe và mặt trăng sọc).
- [x] **8 đảo nổi = 8 game.** Cuộn 1 nấc / phím ← → / chấm tròn để nhảy đảo. Hero được ghim trong lúc du hành.
- [x] Đảo chưa khám phá hiện dấu **"?"**. Khi tới nơi, khối voxel rơi xuống ghép thành cảnh và hiện thông báo "🏝 Đã khám phá…" (tiếng Anh/Việt).
- [x] HUD "ĐẢO ĐÃ KHÁM PHÁ x/8" + nhân vật voxel nhảy giữa các đảo.
- [x] Cảnh từng đảo:

| Đảo | Cảnh voxel |
|---|---|
| 707: The Reunion | Chung cư, tầng 7 sáng đỏ |
| Last Train | Toa tàu đêm + cột đèn + bóng người |
| Chiến Binh Xanh Nhí | **Thùng rác xanh** có bánh xe + biểu tượng tái chế |
| Behind the Mask | Mặt nạ trắng mắt đỏ + nến |
| Brainrot Runner | **Cóc tiến sĩ** (mũ cử nhân, vest, cầm bằng) + cổng tím |
| Heroic Defense | Lâu đài, đường đi, slime |
| Jungle Survivor | **Con ruồi tròn đen** lông xù, mắt lồi, có cánh |
| Mixie Empire | **Mặt anh Độ**: trọc, râu quai nón, **nốt ruồi giữa trán** |

### File chính
| File | Vai trò |
|---|---|
| `index.html` | Trang chính (CSS + HTML + script carousel/Lenis/Projects) |
| `hero3d.js` | Engine bản đồ khám phá (Three.js r170 qua importmap) |
| `founder-mode.js` | Nút chuyển chế độ founder + confetti |
| `boot.js` | Màn khởi động 3 chữ S |
| `achievements.js` | Toast thành tựu toàn trang |
| `voxelScenes.js` | Dữ liệu 8 cảnh voxel. **Thêm hoặc sửa đảo ở đây**, key là `href` của slide |
| `detail_page.css` | Style chung cho 18 trang chi tiết + View Transitions |

---

## 3. Lộ trình tiếp theo 🗺️

### Bước 0: Dọn dẹp trước khi làm (khoảng 10 phút)
- [x] **Commit** toàn bộ thay đổi (nhánh `redesign-explorer`).
- [ ] Quyết định có xoá ảnh PNG/JPG gốc trong `assets/` không (web đã dùng `.webp`). Giữ lại thì repo vẫn nặng khoảng 30MB.
- [ ] Gửi thử 1 tin qua form liên hệ để xác nhận EmailJS chạy.

### Bước 3: Nút chuyển 3 chế độ founder ✅
- [x] Nút `Hải / Nam / Hoàng` trên navbar (`founder-mode.js`). Câu dẫn để ở tooltip.
- [x] `html[data-mode="hai|nam|hoang"]` ghi đè biến màu. Màu HUD của Hero gom vào biến `--hud` / `--hud-rgb`.
  - **Nam**: đen trắng, voxel chỉ vẽ cạnh (shader trong `hero3d.js`), tắt bloom, camera trôi chậm, bỏ glow/bóng, ảnh xám.
  - **Hoàng**: màu kẹo, bloom 1.2, tiêu đề nhiều màu đổi hue, gradient chạy trên nút active, **confetti** khi chuyển chế độ và khi khám phá đảo (sự kiện `island-discovered`).
- [x] Lưu vào `localStorage` key `mode`. Sự kiện `founder-mode` cho code khác nghe.
- [ ] Trang con chưa có chế độ (mới chỉ `index.html`). Nút EN/VI vẫn giữ màu xanh.

### Bước 3b: Phần Team thành màn "Chọn nhân vật" ✅
- [x] 3 thẻ `.char-pick` (tên, chức vụ, thanh chỉ số 10 ô Đa dạng / Tối giản / Màu mè, nút Chọn, huy hiệu "P1" nhấp nháy trên thẻ đang chọn).
- [x] Mỗi thẻ mang phong cách riêng: Hải = pixel, bóng lệch cứng · Nam = viền 1 nét, đen trắng · Hoàng = khung gradient kẹo, glow.
- [x] Hover/focus thì xem trước chế độ cho cả trang, click thì giữ (`founder-mode.js`). Chỉ số đặt tạm, sửa trong `style="--v: N"`.

### Bước 4: Lớp "Startup Simulator" + điểm nhấn của Hoàng
- [x] **Màn khởi động** (`boot.js`, trước đó không có preloader): S voxel → S một nét → S bùng màu → "SUPER STARTUP SIMULATOR" + `Loading world... %` (theo ảnh không-lazy đã tải). Tối thiểu 1.9s, tối đa 4s, 1 lần mỗi phiên (`sessionStorage`), bấm phím/click để bỏ qua, tắt khi reduced-motion. Intro chữ Hero chờ sự kiện `boot-done`.
- [x] **Achievement toast** (`achievements.js`, lưu `localStorage` key `achievements`): Explorer (8/8 đảo), Shape Shifter (thử đủ 3 chế độ founder), Talent Scout (tới phần Liên hệ). Thêm thành tựu: thêm vào `LIST` rồi gọi `unlock(id)`.
- [ ] (Tuỳ chọn) Thanh chỉ số kiểu game sim: `Games Shipped: 8 · Team: 30+ · Genres: 6`.
- [ ] (Tuỳ chọn) Form liên hệ đổi giọng: nút `[ START SIMULATION ]`.

### Bước 5: Đồng bộ nội dung & trang con
- [ ] Viết lại giọng **studio** cho phần Journey ("Challenging myself"…) và footer ("NGỌC HẢI").
- [ ] Quyết định về **các section SEO đang ẩn** (`#about-sss`, `#vietnam-game-ecosystem`, có bảng so sánh với Hiker Games/Topebox). Giữ, bỏ, hay cho hiện ra? Google có thể coi là cloaking.
- [ ] Đưa phong cách mới (bản đồ khám phá, HUD) sang 18 trang chi tiết. Hiện mới đồng bộ font và chuyển trang.
- [ ] (Tuỳ chọn) Section Projects đổi thành "Simulation Modes" có thanh chỉ số cho từng game.

### Bước 6: Kiểm thử thật
- [ ] Thử trên **điện thoại thật** (vuốt cảm ứng qua 8 đảo, hiệu năng).
- [ ] Đo FPS trên máy yếu. Nếu giật: giảm `UnrealBloomPass` hoặc tắt bloom trên mobile trong `hero3d.js`.
- [ ] Thử Safari (View Transitions cần Safari 18.2+, các bản cũ hơn vẫn chuyển trang bình thường).

---

## 4. Lưu ý kỹ thuật ⚠️

- **Đi qua Hero tốn 7 bước cuộn** (khoảng 5.700px). Đây là chủ ý. Muốn ngắn hơn thì giảm hệ số `0.9` trong `end:` của `travelTrigger` (`hero3d.js`).
- Trên mobile, Hero ẩn đoạn mô tả và các nhãn công nghệ để đủ chỗ cho đảo.
- `lenis` là biến `let` toàn cục trong `index.html`. `hero3d.js` truy cập qua `smoothScroller()`.
- Hai section được ghim (Hero, Projects) dùng `refreshPriority` để vị trí các section phía dưới tính đúng. Nếu thêm section ghim mới, nhớ đặt tương tự.
- Carousel Hero **không còn tự chạy**. Chú thích đi theo đảo (sự kiện `hero-slide`), còn chấm tròn yêu cầu bay tới đảo (sự kiện `hero-goto`).
- Thêm game mới: thêm slide vào `#heroCarousel` trong `index.html` và thêm cảnh cùng key `href` vào `voxelScenes.js`. Lưới đảo: x, z từ -6 đến 5, y = 1 trở lên. Ô góc (5, 5) dành cho nhân vật nên để trống.

## 5. Cách chạy thử

```bash
npx http-server . -p 8765     # rồi mở http://localhost:8765
```
Phải chạy qua server (ES module + importmap không chạy khi mở file trực tiếp).
