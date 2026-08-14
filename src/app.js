import { buildBedrockAddon } from './utils/addon-builder.js';

// DOM Elements
const fileInput = document.getElementById('file-input');
const browseBtn = document.getElementById('browse-btn');
const dropzone = document.getElementById('dropzone');

const idleCard = document.getElementById('idle-card');
const progressCard = document.getElementById('progress-card');
const doneCard = document.getElementById('done-card');

const progressStatus = document.getElementById('progress-status');
const progressFill = document.getElementById('progress-fill');
const progressPct = document.getElementById('progress-pct');

const packNameInput = document.getElementById('pack-name-input');
const statDimensions = document.getElementById('stat-dimensions');
const statPalette = document.getElementById('stat-palette');

const downloadBtn = document.getElementById('download-btn');
const resetBtn = document.getElementById('reset-btn');

// State Variables
let currentBlob = null;
let currentBuiltName = 'schematic';
let cachedSubStructures = null;
let worker = null;

// ── Dropzone & Upload Event Listeners ─────────────────────────────────────
browseBtn.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  fileInput.click();
});

dropzone.addEventListener('click', (e) => {
  e.preventDefault();
  fileInput.click();
});

dropzone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fileInput.click();
  }
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files[0]) {
    handleFile(e.target.files[0]);
  }
});

// Drag and drop handlers
dropzone.addEventListener('dragenter', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropzone.classList.add('drag-over');
});

dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropzone.classList.add('drag-over');
});

dropzone.addEventListener('dragleave', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropzone.classList.remove('drag-over');
});

dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropzone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

// ── Download & Reset Actions ──────────────────────────────────────────────
downloadBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  e.stopPropagation();

  if (!cachedSubStructures && !currentBlob) return;

  const inputName = packNameInput.value.trim();
  const finalName = inputName || currentBuiltName || 'Schematic';
  const safeFileName = finalName.replace(/[^a-zA-Z0-9_\-\s]/g, '_').trim() || 'schematic';

  // If user edited the name compared to what was initially built, rebuild with the new name
  let blobToDownload = currentBlob;
  if (cachedSubStructures && finalName !== currentBuiltName) {
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = `
      <svg class="neon-ring" style="width:16px;height:16px;position:static;display:inline-block;margin-right:6px;" viewBox="0 0 24 24"></svg>
      <span>Đang đóng gói...</span>
    `;
    try {
      blobToDownload = await buildBedrockAddon(finalName, cachedSubStructures);
      currentBlob = blobToDownload;
      currentBuiltName = finalName;
    } catch (err) {
      console.error('Error rebuilding addon:', err);
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <span>Tải xuống .mcaddon</span>
      `;
    }
  }

  if (!blobToDownload) return;

  // Wrap in application/octet-stream MIME type to prevent mobile browsers (Android/iOS) from forcing .zip extension
  const binaryBlob = new Blob([blobToDownload], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(binaryBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeFileName}.mcaddon`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
});

resetBtn.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  reset();
});

// ── File Processing ───────────────────────────────────────────────────────
function handleFile(file) {
  if (!file.name.toLowerCase().endsWith('.litematic')) {
    alert('Vui lòng chọn file có định dạng .litematic');
    return;
  }

  const baseFileName = file.name.replace(/\.litematic$/i, '').trim();

  showProgress('Đang đọc file schematic…', 5);

  const reader = new FileReader();
  reader.onload = (e) => {
    if (worker) worker.terminate();
    worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });

    worker.onmessage = ({ data }) => {
      if (data.type === 'progress') {
        showProgress(data.status, data.percent);
      } else if (data.type === 'complete') {
        currentBlob = data.result.addonBlob;
        currentBuiltName = data.result.schematicName || baseFileName || 'Schematic';
        cachedSubStructures = data.result.subStructures;
        showDone(data.result, baseFileName);
      } else if (data.type === 'error') {
        alert('Lỗi chuyển đổi: ' + data.error);
        reset();
      }
    };

    worker.onerror = (err) => {
      alert('Lỗi Worker: ' + err.message);
      reset();
    };

    worker.postMessage({
      fileBuffer: e.target.result,
      maxChunkSize: 64,
      fileName: baseFileName
    });
  };

  reader.readAsArrayBuffer(file);
}

// ── UI View Helpers ───────────────────────────────────────────────────────
function showProgress(status, pct) {
  idleCard.classList.add('hidden');
  doneCard.classList.add('hidden');
  progressCard.classList.remove('hidden');

  progressStatus.textContent = status;
  progressFill.style.width = pct + '%';
  progressPct.textContent = pct + '%';
}

function showDone(result, fallbackFileName) {
  progressCard.classList.add('hidden');
  idleCard.classList.add('hidden');
  doneCard.classList.remove('hidden');

  // Set pack name in the input box
  const chosenName = result.schematicName || fallbackFileName || 'Schematic';
  packNameInput.value = chosenName;

  // Update Stats HUD
  const dims = result.dimensions;
  if (statDimensions) {
    statDimensions.textContent = `${dims.width} × ${dims.height} × ${dims.length}`;
  }
  if (statPalette) {
    statPalette.textContent = '1.20.1 đến bản mới nhất';
  }
}

function reset() {
  currentBlob = null;
  currentBuiltName = 'schematic';
  cachedSubStructures = null;
  fileInput.value = '';
  packNameInput.value = '';

  doneCard.classList.add('hidden');
  progressCard.classList.add('hidden');
  idleCard.classList.remove('hidden');
  progressFill.style.width = '0%';
}
