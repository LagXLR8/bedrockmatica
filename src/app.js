import { buildBedrockAddon } from './utils/addon-builder.js';
import { translations } from './utils/i18n.js';

// DOM Elements - App Views
const fileInput      = document.getElementById('file-input');
const browseBtn      = document.getElementById('browse-btn');
const dropzone       = document.getElementById('dropzone');

const idleCard       = document.getElementById('idle-card');
const progressCard   = document.getElementById('progress-card');
const doneCard       = document.getElementById('done-card');

const progressStatus = document.getElementById('progress-status');
const progressFill   = document.getElementById('progress-fill');
const progressPct    = document.getElementById('progress-pct');

const packNameInput  = document.getElementById('pack-name-input');
const statDimensions = document.getElementById('stat-dimensions');
const statPalette    = document.getElementById('stat-palette');

const downloadBtn    = document.getElementById('download-btn');
const resetBtn       = document.getElementById('reset-btn');

// Language Elements
const langModal       = document.getElementById('lang-modal');
const selectLangVi    = document.getElementById('select-lang-vi');
const selectLangEn    = document.getElementById('select-lang-en');
const langSwitchBtn   = document.getElementById('lang-switch-btn');
const headerLangFlag  = document.getElementById('header-lang-flag');
const headerLangCode  = document.getElementById('header-lang-code');

// Translatable DOM Elements
const statusClientText    = document.getElementById('status-client-text');
const dropTitle           = document.getElementById('drop-title');
const dropSub             = document.getElementById('drop-sub');
const progressSubDesc     = document.getElementById('progress-sub-desc');
const resultTitle         = document.getElementById('result-title');
const resultSubtitle      = document.getElementById('result-subtitle');
const labelPackName       = document.getElementById('label-pack-name');
const hintPackName        = document.getElementById('hint-pack-name');
const labelStatDimensions = document.getElementById('label-stat-dimensions');
const labelStatVersion    = document.getElementById('label-stat-version');
const downloadBtnText     = document.getElementById('download-btn-text');
const resetBtnText        = document.getElementById('reset-btn-text');
const guideMainTitle      = document.getElementById('guide-main-title');
const step1Title          = document.getElementById('step1-title');
const step1Desc           = document.getElementById('step1-desc');
const step2Title          = document.getElementById('step2-title');
const step2Desc           = document.getElementById('step2-desc');
const step3Title          = document.getElementById('step3-title');
const step3Desc           = document.getElementById('step3-desc');
const step4Title          = document.getElementById('step4-title');
const step4Desc           = document.getElementById('step4-desc');
const step4Note           = document.getElementById('step4-note');

// State Variables
let currentLang         = localStorage.getItem('bedrockmatica_lang') || null;
let currentBlob         = null;
let currentBuiltName    = 'schematic';
let cachedSubStructures = null;
let worker              = null;

// ── Language Management ───────────────────────────────────────────────────
function setLanguage(lang) {
  currentLang = lang === 'en' ? 'en' : 'vi';
  localStorage.setItem('bedrockmatica_lang', currentLang);

  // Update header flag and label
  if (currentLang === 'vi') {
    headerLangFlag.textContent = '🇻🇳';
    headerLangCode.textContent = 'VI';
    document.documentElement.lang = 'vi';
  } else {
    headerLangFlag.textContent = '🇬🇧';
    headerLangCode.textContent = 'EN';
    document.documentElement.lang = 'en';
  }

  // Apply translations
  const t = translations[currentLang];
  if (statusClientText) statusClientText.textContent = t.statusClient;
  if (dropTitle) dropTitle.innerHTML = t.dropTitle;
  if (dropSub) {
    dropSub.innerHTML = t.dropSub;
    // Rebind browseBtn event after innerHTML change
    const newBrowseBtn = document.getElementById('browse-btn');
    if (newBrowseBtn) {
      newBrowseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileInput.click();
      });
    }
  }
  if (progressSubDesc) progressSubDesc.textContent = t.progressSub;
  if (resultTitle) resultTitle.textContent = t.resultTitle;
  if (resultSubtitle) resultSubtitle.textContent = t.resultSubtitle;
  if (labelPackName) labelPackName.textContent = t.packNameLabel;
  if (hintPackName) hintPackName.textContent = t.packNameHint;
  if (packNameInput) packNameInput.placeholder = t.packNamePlaceholder;
  if (labelStatDimensions) labelStatDimensions.textContent = t.statDimensions;
  if (labelStatVersion) labelStatVersion.textContent = t.statVersion;
  if (downloadBtnText) downloadBtnText.textContent = t.downloadBtn;
  if (resetBtnText) resetBtnText.textContent = t.resetBtn;
  if (guideMainTitle) guideMainTitle.textContent = t.guideTitle;

  if (step1Title) step1Title.textContent = t.step1Title;
  if (step1Desc) step1Desc.innerHTML = t.step1Desc;
  if (step2Title) step2Title.textContent = t.step2Title;
  if (step2Desc) step2Desc.innerHTML = t.step2Desc;
  if (step3Title) step3Title.textContent = t.step3Title;
  if (step3Desc) step3Desc.innerHTML = t.step3Desc;
  if (step4Title) step4Title.textContent = t.step4Title;
  if (step4Desc) step4Desc.innerHTML = t.step4Desc;
  if (step4Note) step4Note.innerHTML = t.step4Note;

  langModal.classList.add('hidden');
}

// Initial language check
if (!currentLang) {
  langModal.classList.remove('hidden');
} else {
  setLanguage(currentLang);
}

selectLangVi.addEventListener('click', () => setLanguage('vi'));
selectLangEn.addEventListener('click', () => setLanguage('en'));
langSwitchBtn.addEventListener('click', () => {
  langModal.classList.remove('hidden');
});

// ── Dropzone & Upload Event Listeners ─────────────────────────────────────
if (browseBtn) {
  browseBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fileInput.click();
  });
}

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

  const t = translations[currentLang || 'vi'];
  const inputName = packNameInput.value.trim();
  const finalName = inputName || currentBuiltName || 'Schematic';
  const safeFileName = finalName.replace(/[^a-zA-Z0-9_\-\s]/g, '_').trim() || 'schematic';

  // Rebuild addon with chosen language & custom name
  let blobToDownload = currentBlob;
  if (cachedSubStructures) {
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = `
      <svg class="neon-ring" style="width:16px;height:16px;position:static;display:inline-block;margin-right:6px;" viewBox="0 0 24 24"></svg>
      <span>${t.rebuildingBtn}</span>
    `;
    try {
      blobToDownload = await buildBedrockAddon(finalName, cachedSubStructures, currentLang || 'vi');
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
        <span id="download-btn-text">${t.downloadBtn}</span>
      `;
    }
  }

  if (!blobToDownload) return;

  // Trigger browser download with .mcaddon extension
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
  const t = translations[currentLang || 'vi'];
  if (!file.name.toLowerCase().endsWith('.litematic')) {
    alert(currentLang === 'vi' ? 'Vui lòng chọn file có định dạng .litematic' : 'Please select a .litematic file');
    return;
  }

  const baseFileName = file.name.replace(/\.litematic$/i, '').trim();

  showProgress(t.progressReading, 5);

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
        alert((currentLang === 'vi' ? 'Lỗi chuyển đổi: ' : 'Conversion error: ') + data.error);
        reset();
      }
    };

    worker.onerror = (err) => {
      alert((currentLang === 'vi' ? 'Lỗi Worker: ' : 'Worker error: ') + err.message);
      reset();
    };

    worker.postMessage({
      fileBuffer: e.target.result,
      maxChunkSize: 64,
      fileName: baseFileName,
      lang: currentLang || 'vi'
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
    statPalette.textContent = '1.20.1+';
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
