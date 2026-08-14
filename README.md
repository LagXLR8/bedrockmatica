# 🚀 Bedrockmatica Web

> **Công cụ chuyển đổi file `.litematic` (Minecraft Java) sang Behavior Pack `.mcaddon` (Minecraft Bedrock / MCPE 1.20.1+) trực tiếp trên trình duyệt.**

🌐 **Truy cập trang web chính thức:** [https://lagxlr8.github.io/bedrockmatica/](https://lagxlr8.github.io/bedrockmatica/)

---

## ✨ Tính năng nổi bật

- 🔒 **100% Client-Side:** Toàn bộ quá trình đọc file NBT, dịch Block State, cắt lát cấu trúc và đóng gói file `.mcaddon` đều diễn ra trực tiếp trên trình duyệt của bạn bằng Web Worker. Không có bất kỳ dữ liệu nào được tải lên server.
- ⚡ **Tự động chia nhỏ cấu trúc ($\le 64 \times 64 \times 64$):** Tự động cắt các công trình Litematica khổng lồ thành các mảnh `.mcstructure` chuẩn giới hạn của Minecraft Bedrock.
- 🪵 **Hỗ trợ đầy đủ Block States 1.20.1+ & 1.21.1+:** Ánh xạ chuẩn xác cho các khối phức tạp:
  - **Hanging Signs:** Biển treo trần (xích song song / xích chụm chữ V) & Biển gắn tường có thanh đỡ cho tất cả 12 loại gỗ.
  - Cầu thang (Stairs), Phiến đá (Slabs), Cửa (Doors), Cửa sập (Trapdoors), Tường (Walls), Gỗ xoay trục (Pillars/Logs), v.v.
- 🤖 **Kèm Script Tự Động Xây (Auto-Builder GUI):** Tích hợp sẵn Script trong Behavior Pack, kích hoạt dễ dàng bằng cách cầm **Stick**, **Feather** hoặc **Compass** trong game.
- 🌐 **Đa ngôn ngữ (Multilingual):** Hỗ trợ **Tiếng Việt 🇻🇳** và **English 🇬🇧**. Tùy vào ngôn ngữ bạn chọn trên web, toàn bộ thông báo trong game khi tải Addon về cũng sẽ hiển thị theo đúng ngôn ngữ đó!

---

## 📖 Hướng dẫn sử dụng

### Bước 1: Chuyển đổi và Tải Addon
1. Truy cập [https://lagxlr8.github.io/bedrockmatica/](https://lagxlr8.github.io/bedrockmatica/).
2. Chọn ngôn ngữ mong muốn (Tiếng Việt hoặc English).
3. Kéo thả file `.litematic` của bạn vào ô tải lên.
4. Chỉnh sửa tên Addon theo ý muốn tại ô **Tên addon sẽ hiển thị**.
5. Bấm **Tải xuống .mcaddon**.

### Bước 2: Thêm vào Minecraft Bedrock (MCPE / Win10)
- **Cách 1 (Mở trực tiếp):** Mở file `.mcaddon` vừa tải, Minecraft sẽ tự động import Behavior Pack.
- **Cách 2 (Thủ công / Giải nén):** Đổi đuôi `.mcaddon` thành `.zip`, giải nén thư mục `bedrockmatica_(tên)_bp` và dán vào:
  - **Android:** `Bộ nhớ trong/Android/data/com.mojang.minecraftpe/files/games/com.mojang/behavior_packs/`
  - **iOS:** `Tệp > Trên iPhone > Minecraft > games > com.mojang > behavior_packs`
  - **Windows:** `%localappdata%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang\behavior_packs`

### Bước 3: Kích hoạt trong Thế giới (World)
1. Vào **Cài đặt Thế giới (World Settings)** $\rightarrow$ chọn mục **Behavior Packs** $\rightarrow$ Kích hoạt (Activate) gói vừa thêm.
2. Vào mục **Thử nghiệm (Experiments)** $\rightarrow$ Bật **Beta APIs**.

### Bước 4: Xây dựng trong game
1. Đứng tại vị trí bạn muốn đặt góc công trình.
2. Cầm trên tay **Stick** (Gậy), **Feather** (Lông gà) hoặc **Compass** (La bàn) và **nhấp chuột phải** (hoặc đè/giữ màn hình trên điện thoại) để mở Menu.
3. Chọn **⚡ TP Mode** để bắt đầu xây tự động.

---

## ⚠️ Lưu ý quan trọng

> [!WARNING]
> - **Hãy đứng im và không di chuyển** cho đến khi hệ thống dịch chuyển và đặt xong toàn bộ các khối cấu trúc.
> - **Tốc độ xử lý và load schematic** phụ thuộc vào dung lượng công trình và cấu hình máy/thiết bị của bạn.
> - Bắt buộc phải bật **Beta APIs** trong phần Experiments để script tự động xây dựng có thể hoạt động.

---

## 🛠️ Hướng dẫn cài đặt cho lập trình viên (Dev)

Yêu cầu: [Node.js](https://nodejs.org/) (khuyến nghị phiên bản 20 hoặc 22+).

```bash
# 1. Cài đặt các thư viện phụ thuộc
npm install

# 2. Khởi chạy dev server tại localhost:5173
npm run dev

# 3. Đóng gói bản phát hành production
npm run build
```

---

## 📄 Bản quyền (License)

Dự án được phân phối miễn phí cho cộng đồng người chơi Minecraft.
Được xây dựng và duy trì bởi [LagXLR8](https://github.com/LagXLR8).
