export const translations = {
  vi: {
    badgeVersion: "1.20.1+",
    statusClient: "Chạy trên trình duyệt",
    
    // Dropzone
    dropTitle: "Kéo thả file <code class=\"cyber-code\">.litematic</code> vào đây",
    dropSub: "hoặc <button id=\"browse-btn\" class=\"neon-link-btn\" type=\"button\">chọn file từ máy</button>",
    
    // Progress
    progressReading: "Đang đọc file schematic…",
    progressParsing: "Đang phân tích cấu trúc NBT…",
    progressSlicing: "Đang cắt lát ({dim}) thành các khối ≤ {size}…",
    progressEncoding: "Đang tạo gói Behavior Pack và điều chỉnh block id…",
    progressComplete: "Chuyển đổi hoàn tất!",
    progressSub: "Đang tạo gói Behavior Pack và mã hóa NBT structures...",

    // Result
    resultTitle: "Chuyển đổi thành công",
    resultSubtitle: "Sẵn sàng xuất gói Addon",
    packNameLabel: "Tên addon sẽ hiển thị",
    packNameHint: "Có thể chỉnh sửa tên file .mcaddon",
    packNamePlaceholder: "Nhập tên addon...",
    statDimensions: "KÍCH THƯỚC",
    statVersion: "PHIÊN BẢN",
    downloadBtn: "Tải xuống .mcaddon",
    rebuildingBtn: "Đang đóng gói...",
    resetBtn: "Chọn file litematica khác",

    // Guide
    guideTitle: "HƯỚNG DẪN SỬ DỤNG",
    step1Title: "Kéo thả & Tùy chỉnh tên",
    step1Desc: "Tải file <code>.litematic</code> của bạn lên, sau đó nhập tên mong muốn cho Addon rồi nhấn tải về.",
    step2Title: "Tải & Mở file .mcaddon",
    step2Desc: "Mở file <code>.mcaddon</code> vừa tải, Minecraft Bedrock sẽ tự động import vào game (hoặc giải nén thư mục <code>_bp</code> vào thư mục game).",
    step3Title: "Kích hoạt trong World",
    step3Desc: "Vào cài đặt World rồi vào <em>Behavior Pack</em> sau đó thêm file vừa tải vào. Sau đó bật <em class=\"neon-text-cyan\">Beta APIs</em> trong phần Thử nghiệm (Experiments).",
    step4Title: "Cách sử dụng & Lưu ý quan trọng",
    step4Desc: "Cầm <strong class=\"neon-text-pink\">Stick</strong>, <strong class=\"neon-text-pink\">Feather</strong> hoặc <strong class=\"neon-text-pink\">Compass</strong> nhấp chuột phải (đè/giữ vào màn hình điện thoại) để mở menu, chọn <em>TP Mode</em> để bắt đầu.",
    step4Note: "⚠️ <strong>Lưu ý:</strong> Hãy đứng im cho đến khi load xong, đừng di chuyển. Tốc độ xử lý và load schematic tùy thuộc vào cấu hình máy của bạn.",

    // Language Modal
    langModalTitle: "Chọn ngôn ngữ / Select Language",
    langModalSub: "Vui lòng chọn ngôn ngữ hiển thị và ngôn ngữ thông báo trong game."
  },

  en: {
    badgeVersion: "1.20.1+",
    statusClient: "Client-Side",

    // Dropzone
    dropTitle: "Drag & drop your <code class=\"cyber-code\">.litematic</code> file here",
    dropSub: "or <button id=\"browse-btn\" class=\"neon-link-btn\" type=\"button\">choose file from device</button>",

    // Progress
    progressReading: "Reading schematic file…",
    progressParsing: "Parsing NBT structures…",
    progressSlicing: "Slicing ({dim}) into sub-structures ≤ {size}…",
    progressEncoding: "Building Behavior Pack & mapping block IDs…",
    progressComplete: "Conversion Complete!",
    progressSub: "Generating Behavior Pack and encoding NBT structures...",

    // Result
    resultTitle: "Conversion Successful",
    resultSubtitle: "Bedrock Addon pack is ready to export",
    packNameLabel: "Addon Display Name",
    packNameHint: "You can customize the .mcaddon file name",
    packNamePlaceholder: "Enter addon name...",
    statDimensions: "DIMENSIONS",
    statVersion: "VERSION",
    downloadBtn: "Download .mcaddon",
    rebuildingBtn: "Packaging...",
    resetBtn: "Convert another schematic",

    // Guide
    guideTitle: "USER GUIDE",
    step1Title: "Upload & Customize Name",
    step1Desc: "Upload your <code>.litematic</code> file, adjust the desired Addon pack name, and click download.",
    step2Title: "Download & Open .mcaddon",
    step2Desc: "Open the downloaded <code>.mcaddon</code> file to auto-import into Minecraft Bedrock (or extract the <code>_bp</code> folder to your game directory).",
    step3Title: "Activate in World",
    step3Desc: "Go to World Settings &rarr; <em>Behavior Packs</em> &rarr; activate the pack. Then enable <em class=\"neon-text-cyan\">Beta APIs</em> under Experiments.",
    step4Title: "How to Build & Important Note",
    step4Desc: "Hold a <strong class=\"neon-text-pink\">Stick</strong>, <strong class=\"neon-text-pink\">Feather</strong>, or <strong class=\"neon-text-pink\">Compass</strong> and right-click (or tap and hold on mobile) to open the menu, then select <em>TP Mode</em> to begin building.",
    step4Note: "⚠️ <strong>Note:</strong> Please stand completely still until loading is finished. Processing and schematic loading speed depends on your device's performance.",

    // Language Modal
    langModalTitle: "Select Language / Chọn ngôn ngữ",
    langModalSub: "Please select your preferred UI and in-game message language."
  }
};
