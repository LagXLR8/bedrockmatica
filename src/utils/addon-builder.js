import JSZip from 'jszip';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const DEFAULT_PACK_ICON_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

function base64ToUint8Array(base64) {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Builds a ready-to-import Bedrock .mcaddon file.
 * Uses two build modes:
 *  - TP Mode: teleports player to each structure zone, waits for chunk load, then places.
 *  - Safe Mode: no teleport, places structures near the player only (for small builds).
 */
export async function buildBedrockAddon(schematicsName, subStructures, lang = 'vi') {
  const isVi = lang === 'vi';
  const zip = new JSZip();

  const safeName = schematicsName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const packFolder = zip.folder(`bedrockmatica_${safeName}_bp`);

  const headerUUID = generateUUID();
  const moduleUUID = generateUUID();

  const manifest = {
    format_version: 2,
    header: {
      name: `Bedrockmatica - ${schematicsName}`,
      description: isVi 
        ? `Gói Behavior Pack tự động xây công trình cho ${schematicsName}`
        : `Auto-generated Bedrockmatica structure builder pack for ${schematicsName}`,
      uuid: headerUUID,
      version: [1, 0, 0],
      min_engine_version: [1, 20, 0]
    },
    modules: [
      {
        type: "data",
        uuid: generateUUID(),
        version: [1, 0, 0]
      },
      {
        type: "script",
        language: "javascript",
        uuid: moduleUUID,
        entry: "scripts/main.js",
        version: [1, 0, 0]
      }
    ],
    dependencies: [
      { module_name: "@minecraft/server", version: "1.1.0" },
      { module_name: "@minecraft/server-ui", version: "1.1.0" }
    ]
  };

  packFolder.file("manifest.json", JSON.stringify(manifest, null, 2));
  packFolder.file("pack_icon.png", base64ToUint8Array(DEFAULT_PACK_ICON_BASE64));

  const structFolder = packFolder.folder("structures");
  const metaList = [];

  for (const s of subStructures) {
    const rawName = s.fileName.replace('.mcstructure', '');
    structFolder.file(s.fileName, s.buffer);
    metaList.push({
      identifier: `mystructure:${rawName}`,
      rawName,
      offset: s.offset,
      size: s.size,
      nonAirCount: s.nonAirCount
    });
  }

  const structuresDataJS = `
export const structuresData = ${JSON.stringify({
    name: schematicsName,
    totalStructures: metaList.length,
    structures: metaList
  }, null, 2)};
`;

  const scriptsFolder = packFolder.folder("scripts");
  scriptsFolder.file("structures-data.js", structuresDataJS);

  const scriptContent = `
import { world, system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { structuresData } from "./structures-data.js";

const LANG_VI = ${isVi};

// Welcome message
try {
  world.afterEvents.playerSpawn.subscribe((event) => {
    if (event.initialSpawn) {
      event.player.sendMessage(
        LANG_VI
          ? "§a[Bedrockmatica] Đã tải pack! Cầm Stick, Feather hoặc Compass và bấm chuột phải (hoặc chạm giữ màn hình) để mở menu."
          : "§a[Bedrockmatica] Pack Loaded! Right-click holding a Stick, Feather, or Compass to open GUI."
      );
    }
  });
} catch (e) {}

// Item Right-Click / Tap-Hold Trigger
try {
  world.afterEvents.itemUse.subscribe((event) => {
    const item = event.itemStack;
    if (item && (
      item.typeId === "minecraft:stick" ||
      item.typeId === "minecraft:feather" ||
      item.typeId === "minecraft:compass"
    )) {
      openBuildUI(event.source);
    }
  });
} catch (e) {}

function openBuildUI(player) {
  const title = LANG_VI ? "Bedrockmatica - Tự Động Xây Dựng" : "Bedrockmatica - Auto-Builder";
  const body = LANG_VI
    ? "Schematic: " + structuresData.name +
      "\\nSố phần nhỏ: " + structuresData.totalStructures +
      "\\n\\n⚡ TP Mode: Dịch chuyển bạn đến từng khu vực để load chunk (Khuyên dùng cho công trình lớn).\\n🛡️ Safe Mode: Không dịch chuyển, chỉ xây khu vực xung quanh bạn.\\n\\n§e⚠️ Lưu ý: Hãy đứng im cho đến khi load xong, đừng di chuyển. Tốc độ xử lý tùy thuộc vào cấu hình máy."
    : "Schematic: " + structuresData.name +
      "\\nSub-Structures: " + structuresData.totalStructures +
      "\\n\\n⚡ TP Mode: Teleports you to each section for guaranteed chunk loading (Recommended for large builds).\\n🛡️ Safe Mode: No teleport, only builds in your immediate area.\\n\\n§e⚠️ Note: Please stand completely still until loading is finished. Processing speed depends on device performance.";

  const btnTP = LANG_VI ? "⚡ TP Mode (Khuyên dùng)" : "⚡ TP Mode (Recommended)";
  const btnSafe = LANG_VI ? "🛡️ Safe Mode (Công trình nhỏ / test)" : "🛡️ Safe Mode (Small builds / testing)";
  const btnCancel = LANG_VI ? "Đóng / Hủy" : "Cancel";

  new ActionFormData()
    .title(title)
    .body(body)
    .button(btnTP)
    .button(btnSafe)
    .button(btnCancel)
    .show(player)
    .then((res) => {
      if (!res || res.canceled) return;
      if (res.selection === 0) startTP(player);
      else if (res.selection === 1) startSafe(player);
    })
    .catch((err) => {
      player.sendMessage("§c[Bedrockmatica] UI Error: " + err);
    });
}

// ── TP MODE ────────────────────────────────────────────────────────────────
function startTP(player) {
  const dim = player.dimension;
  const orig = player.location;
  const ox = Math.floor(orig.x);
  const oy = Math.floor(orig.y);
  const oz = Math.floor(orig.z);
  const LOAD_WAIT = 20; // 1 second wait after TP

  player.sendMessage(
    LANG_VI
      ? "§a[Bedrockmatica] Chế độ TP đã bắt đầu tại (" + ox + "," + oy + "," + oz + ")"
      : "§a[Bedrockmatica] TP Mode started at (" + ox + "," + oy + "," + oz + ")"
  );
  player.sendMessage(
    LANG_VI
      ? "§e[Bedrockmatica] Bạn sẽ được dịch chuyển qua các khu vực. Hãy đứng im cho đến khi load xong, không di chuyển."
      : "§e[Bedrockmatica] You will be teleported around. Please stand still until finished, do not move."
  );

  const structs = structuresData.structures;
  const total = structs.length;
  let idx = 0;
  let waitTick = 0;
  let phase = "tp"; // "tp" → "wait" → "place" → "tp" ...

  const id = system.runInterval(() => {
    // All done
    if (idx >= total) {
      system.clearRun(id);
      try { dim.runCommand("tp @a " + ox + " " + oy + " " + oz); } catch(e) {}
      player.sendMessage(
        LANG_VI
          ? "§a[Bedrockmatica] Hoàn tất! Đã đặt toàn bộ " + total + " phần cấu trúc. Đã dịch chuyển về vị trí ban đầu."
          : "§a[Bedrockmatica] Done! All " + total + " structures placed. Teleported back to origin."
      );
      return;
    }

    const struct = structs[idx];
    const cx = ox + struct.offset.x + Math.floor(struct.size.x / 2);
    const cy = oy + struct.offset.y;
    const cz = oz + struct.offset.z + Math.floor(struct.size.z / 2);

    if (phase === "tp") {
      try { dim.runCommand("tp @a " + cx + " " + (cy + 10) + " " + cz); } catch(e) {}
      waitTick = 0;
      phase = "wait";

    } else if (phase === "wait") {
      waitTick++;
      if (waitTick >= LOAD_WAIT) phase = "place";

    } else { // place
      const sx = ox + struct.offset.x;
      const sy = oy + struct.offset.y;
      const sz = oz + struct.offset.z;
      try {
        dim.runCommand('structure load "' + struct.identifier + '" ' + sx + ' ' + sy + ' ' + sz);
      } catch(e1) {
        try {
          dim.runCommand('structure load "' + struct.rawName + '" ' + sx + ' ' + sy + ' ' + sz);
        } catch(e2) {
          player.sendMessage("§c[Bedrockmatica] Warning: could not place " + struct.rawName);
        }
      }
      idx++;
      phase = "tp";
      try {
        const text = LANG_VI
          ? "§e[Bedrockmatica] Đang đặt: " + idx + " / " + total + " phần"
          : "§e[Bedrockmatica] Placed: " + idx + " / " + total + " structures";
        player.onScreenDisplay.setActionBar(text);
      } catch(e) {}
    }
  }, 1);
}

// ── SAFE MODE ───────────────────────────────────────────────────────────────
function startSafe(player) {
  const dim = player.dimension;
  const orig = player.location;
  const ox = Math.floor(orig.x);
  const oy = Math.floor(orig.y);
  const oz = Math.floor(orig.z);
  const total = structuresData.structures.length;
  let idx = 0;

  player.sendMessage(
    LANG_VI
      ? "§a[Bedrockmatica] Safe Mode đã bắt đầu tại (" + ox + "," + oy + "," + oz + ")"
      : "§a[Bedrockmatica] Safe Mode started at (" + ox + "," + oy + "," + oz + ")"
  );

  const id = system.runInterval(() => {
    if (idx >= total) {
      system.clearRun(id);
      player.sendMessage(
        LANG_VI
          ? "§a[Bedrockmatica] Hoàn tất! Đã đặt toàn bộ " + total + " phần cấu trúc."
          : "§a[Bedrockmatica] Done! All " + total + " structures placed."
      );
      return;
    }
    for (let b = 0; b < 3 && idx < total; b++) {
      const s = structuresData.structures[idx++];
      const sx = ox + s.offset.x;
      const sy = oy + s.offset.y;
      const sz = oz + s.offset.z;
      try {
        dim.runCommand('structure load "' + s.identifier + '" ' + sx + ' ' + sy + ' ' + sz);
      } catch(e1) {
        try {
          dim.runCommand('structure load "' + s.rawName + '" ' + sx + ' ' + sy + ' ' + sz);
        } catch(e2) {}
      }
    }
    try {
      const text = LANG_VI
        ? "§e[Bedrockmatica] Đang đặt: " + idx + " / " + total + " phần"
        : "§e[Bedrockmatica] Placed: " + idx + " / " + total + " structures";
      player.onScreenDisplay.setActionBar(text);
    } catch(e) {}
  }, 1);
}
`;

  scriptsFolder.file("main.js", scriptContent);
  return await zip.generateAsync({
    type: "blob",
    mimeType: "application/octet-stream"
  });
}

