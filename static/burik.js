// ==========================================
// STUDIO LOKAL - MEME BURIK GENERATOR MODULE
// ==========================================

const burikDropZone = document.querySelector('#burikDropZone');
const burikFileInput = document.querySelector('#burikFileInput');
const burikUploadPrompt = document.querySelector('#burikUploadPrompt');
const burikBrowseButton = document.querySelector('#burikBrowseButton');
const burikSelectedCard = document.querySelector('#burikSelectedCard');
const burikThumbImg = document.querySelector('#burikThumbImg');
const burikSelectedName = document.querySelector('#burikSelectedName');
const burikOrigDims = document.querySelector('#burikOrigDims');
const burikTargetBadge = document.querySelector('#burikTargetBadge');
const burikReplaceBtn = document.querySelector('#burikReplaceBtn');

const presetButtons = document.querySelectorAll('.btn-burik-preset');
const burikCustomToggle = document.querySelector('#burikCustomToggle');
const burikCustomBody = document.querySelector('#burikCustomBody');
const customBadgeText = document.querySelector('#customBadgeText');

const burikLevelSlider = document.querySelector('#burikLevelSlider');
const burikLevelVal = document.querySelector('#burikLevelVal');
const burikJpegSlider = document.querySelector('#burikJpegSlider');
const burikJpegVal = document.querySelector('#burikJpegVal');
const burikFrySlider = document.querySelector('#burikFrySlider');
const burikFryVal = document.querySelector('#burikFryVal');
const burikNoiseSlider = document.querySelector('#burikNoiseSlider');
const burikNoiseVal = document.querySelector('#burikNoiseVal');
const burikPixelToggle = document.querySelector('#burikPixelToggle');
const burikProcessBtn = document.querySelector('#burikProcessBtn');

const burikEmptyState = document.querySelector('#burikEmptyState');
const burikLoadingState = document.querySelector('#burikLoadingState');
const burikResultStage = document.querySelector('#burikResultStage');
const burikCompareBadge = document.querySelector('#burikCompareBadge');
const burikDimPillOrig = document.querySelector('#burikDimPillOrig');
const burikDimPillResult = document.querySelector('#burikDimPillResult');

const burikCompareContainer = document.querySelector('#burikCompareContainer');
const burikCompareStage = document.querySelector('#burikCompareStage');
const burikCompareBeforeImg = document.querySelector('#burikCompareBeforeImg');
const burikCompareAfterImg = document.querySelector('#burikCompareAfterImg');
const burikCompareHandle = document.querySelector('#burikCompareHandle');

const burikCompareSideContainer = document.querySelector('#burikCompareSideContainer');
const burikSideBeforeImg = document.querySelector('#burikSideBeforeImg');
const burikSideAfterImg = document.querySelector('#burikSideAfterImg');
const burikSideOrigDim = document.querySelector('#burikSideOrigDim');
const burikSideDegDim = document.querySelector('#burikSideDegDim');

const burikBtnModeSplit = document.querySelector('#burikBtnModeSplit');
const burikBtnModeSide = document.querySelector('#burikBtnModeSide');
const btnBridgeBurikToHd = document.querySelector('#btnBridgeBurikToHd');
const btnBridgeBurikToRemoveBg = document.querySelector('#btnBridgeBurikToRemoveBg');
const burikDownloadBtn = document.querySelector('#burikDownloadBtn');

let currentBurikFile = null;
let currentBurikBlob = null;
let currentBurikPreset = 'kentang';
let currentBurikOrigWidth = 0;
let currentBurikOrigHeight = 0;
let currentBurikResultBlob = null;
let currentBurikResultUrl = null;
let isBurikProcessing = false;

const BURIK_PRESET_CONFIGS = {
  kentang: {
    level: 5,
    jpeg: 8,
    fry: 12,
    noise: 15,
    pixel: false,
    label: 'Target: 144p Kentang',
  },
  deepfry: {
    level: 4,
    jpeg: 6,
    fry: 28,
    noise: 25,
    pixel: true,
    label: 'Target: Deep Fried',
  },
  nokia: {
    level: 7,
    jpeg: 4,
    fry: 15,
    noise: 40,
    pixel: true,
    label: 'Target: Nokia 3GP',
  },
  nuklir: {
    level: 9,
    jpeg: 2,
    fry: 34,
    noise: 55,
    pixel: true,
    label: 'Target: Kutukan Nuklir',
  },
};

function applyPresetValues(presetKey) {
  const cfg = BURIK_PRESET_CONFIGS[presetKey];
  if (!cfg) return;
  currentBurikPreset = presetKey;

  presetButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.preset === presetKey);
  });

  if (burikLevelSlider) {
    burikLevelSlider.value = cfg.level;
    if (burikLevelVal) burikLevelVal.textContent = `Level ${cfg.level}`;
  }
  if (burikJpegSlider) {
    burikJpegSlider.value = cfg.jpeg;
    if (burikJpegVal) burikJpegVal.textContent = `Q: ${cfg.jpeg}`;
  }
  if (burikFrySlider) {
    burikFrySlider.value = cfg.fry;
    if (burikFryVal) burikFryVal.textContent = `${(cfg.fry / 10).toFixed(1)}×`;
  }
  if (burikNoiseSlider) {
    burikNoiseSlider.value = cfg.noise;
    if (burikNoiseVal) burikNoiseVal.textContent = `${cfg.noise}%`;
  }
  if (burikPixelToggle) {
    burikPixelToggle.checked = cfg.pixel;
  }
  if (customBadgeText) {
    customBadgeText.textContent = `Preset: ${presetKey.toUpperCase()}`;
  }
  if (burikTargetBadge) {
    burikTargetBadge.textContent = cfg.label;
  }
}

presetButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    applyPresetValues(btn.dataset.preset);
  });
});

// Custom Sliders value tracking
function setCustomMode() {
  currentBurikPreset = 'custom';
  presetButtons.forEach((btn) => btn.classList.remove('active'));
  if (customBadgeText) customBadgeText.textContent = 'Kustom (Manual)';
  if (burikTargetBadge) burikTargetBadge.textContent = 'Target: Kustom Meme';
}

if (burikLevelSlider && burikLevelVal) {
  burikLevelSlider.addEventListener('input', () => {
    burikLevelVal.textContent = `Level ${burikLevelSlider.value}`;
    setCustomMode();
  });
}
if (burikJpegSlider && burikJpegVal) {
  burikJpegSlider.addEventListener('input', () => {
    burikJpegVal.textContent = `Q: ${burikJpegSlider.value}`;
    setCustomMode();
  });
}
if (burikFrySlider && burikFryVal) {
  burikFrySlider.addEventListener('input', () => {
    burikFryVal.textContent = `${(Number(burikFrySlider.value) / 10).toFixed(1)}×`;
    setCustomMode();
  });
}
if (burikNoiseSlider && burikNoiseVal) {
  burikNoiseSlider.addEventListener('input', () => {
    burikNoiseVal.textContent = `${burikNoiseSlider.value}%`;
    setCustomMode();
  });
}
if (burikPixelToggle) {
  burikPixelToggle.addEventListener('change', () => {
    setCustomMode();
  });
}

// Load Burik File
function loadBurikFile(file) {
  if (!file) return;
  currentBurikFile = file;
  currentBurikBlob = file;

  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    currentBurikOrigWidth = img.naturalWidth;
    currentBurikOrigHeight = img.naturalHeight;

    if (burikThumbImg) burikThumbImg.src = url;
    if (burikSelectedName) burikSelectedName.textContent = file.name;
    if (burikOrigDims) burikOrigDims.textContent = `${img.naturalWidth} × ${img.naturalHeight} px`;

    if (burikUploadPrompt) burikUploadPrompt.classList.add('hidden');
    if (burikSelectedCard) burikSelectedCard.classList.remove('hidden');
    if (burikProcessBtn) burikProcessBtn.disabled = false;
  };
  img.src = url;
}

function loadBurikFileFromBlob(blob, name = 'gambar-meme.jpg') {
  const file = new File([blob], name, { type: blob.type || 'image/jpeg' });
  if (window.switchStudioTab) window.switchStudioTab('burik');
  loadBurikFile(file);
  if (window.showToast) {
    window.showToast('Foto Dimuat', 'Foto siap diburikin seburik-buriknya!', 'info', 3000);
  }
}

// Expose globally for cross-studio bridges
window.loadBurikFileFromBlob = loadBurikFileFromBlob;

// File input and drag & drop bindings
if (burikBrowseButton) burikBrowseButton.addEventListener('click', () => burikFileInput && burikFileInput.click());
if (burikReplaceBtn) burikReplaceBtn.addEventListener('click', () => burikFileInput && burikFileInput.click());

if (burikFileInput) {
  burikFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      loadBurikFile(e.target.files[0]);
    }
    burikFileInput.value = '';
  });
}

if (burikDropZone) {
  burikDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    burikDropZone.classList.add('dragging');
  });
  burikDropZone.addEventListener('dragleave', (e) => {
    if (!burikDropZone.contains(e.relatedTarget)) {
      burikDropZone.classList.remove('dragging');
    }
  });
  burikDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    burikDropZone.classList.remove('dragging');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      loadBurikFile(e.dataTransfer.files[0]);
    }
  });
}

// Interactive Comparison Slider Drag Handler (Split Geser)
let isBurikSliderDragging = false;
let currentBurikSplitPercent = 50;

function setBurikComparisonPosition(percent) {
  const clamped = Math.max(0, Math.min(100, percent));
  currentBurikSplitPercent = clamped;
  if (burikCompareStage) {
    burikCompareStage.style.setProperty('--split-pos', `${clamped}%`);
  }
  if (burikCompareHandle) {
    burikCompareHandle.setAttribute('aria-valuenow', Math.round(clamped));
  }
}

function handleBurikComparisonPointer(e) {
  const target = burikCompareStage || burikCompareContainer;
  if (!target) return;
  const rect = target.getBoundingClientRect();
  if (rect.width <= 0) return;
  const clientX = e.touches && e.touches.length ? e.touches[0].clientX : e.clientX;
  const offsetX = clientX - rect.left;
  const pct = (offsetX / rect.width) * 100;
  setBurikComparisonPosition(pct);
}

if (burikCompareContainer) {
  const startDrag = (e) => {
    isBurikSliderDragging = true;
    if (burikCompareStage) burikCompareStage.classList.add('dragging');
    handleBurikComparisonPointer(e);
  };

  const stopDrag = () => {
    if (isBurikSliderDragging) {
      isBurikSliderDragging = false;
      if (burikCompareStage) burikCompareStage.classList.remove('dragging');
    }
  };

  burikCompareContainer.addEventListener('mousedown', startDrag);
  window.addEventListener('mousemove', (e) => {
    if (isBurikSliderDragging) handleBurikComparisonPointer(e);
  });
  window.addEventListener('mouseup', stopDrag);

  burikCompareContainer.addEventListener('touchstart', startDrag, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (isBurikSliderDragging) handleBurikComparisonPointer(e);
  }, { passive: true });
  window.addEventListener('touchend', stopDrag);
}

if (burikCompareHandle) {
  burikCompareHandle.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      setBurikComparisonPosition(currentBurikSplitPercent - 2);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      setBurikComparisonPosition(currentBurikSplitPercent + 2);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setBurikComparisonPosition(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setBurikComparisonPosition(100);
    }
  });
}

// View Mode Tabs (Split vs Side-by-Side)
if (burikBtnModeSplit && burikBtnModeSide) {
  burikBtnModeSplit.addEventListener('click', () => {
    burikBtnModeSplit.classList.add('active');
    burikBtnModeSide.classList.remove('active');
    if (burikCompareContainer) burikCompareContainer.classList.remove('hidden');
    if (burikCompareSideContainer) burikCompareSideContainer.classList.add('hidden');
  });

  burikBtnModeSide.addEventListener('click', () => {
    burikBtnModeSide.classList.add('active');
    burikBtnModeSplit.classList.remove('active');
    if (burikCompareContainer) burikCompareContainer.classList.add('hidden');
    if (burikCompareSideContainer) burikCompareSideContainer.classList.remove('hidden');
  });
}

// Burik Process Execution
async function processBurik() {
  if (!currentBurikFile || isBurikProcessing) return;
  isBurikProcessing = true;
  if (burikProcessBtn) burikProcessBtn.disabled = true;

  if (burikEmptyState) burikEmptyState.classList.add('hidden');
  if (burikResultStage) burikResultStage.classList.add('hidden');
  if (burikLoadingState) burikLoadingState.classList.remove('hidden');

  if (window.showToast) {
    window.showToast('Memproses Meme', 'Memburikan foto seburik-buriknya...', 'info', 2500);
  }

  const form = new FormData();
  form.append('image', currentBurikFile);
  form.append('preset', currentBurikPreset);
  form.append('burik_level', String(burikLevelSlider ? burikLevelSlider.value : 5));
  form.append('jpeg_quality', String(burikJpegSlider ? burikJpegSlider.value : 8));
  form.append('fry_factor', String(burikFrySlider ? (Number(burikFrySlider.value) / 10).toFixed(1) : 1.2));
  form.append('noise_amount', String(burikNoiseSlider ? (Number(burikNoiseSlider.value) / 100).toFixed(2) : 0.15));
  form.append('pixel_mode', burikPixelToggle && burikPixelToggle.checked ? 'nearest' : 'bilinear');

  try {
    const response = await fetch('/api/burik', { method: 'POST', body: form });
    if (!response.ok) {
      let err = 'Gagal memburikan gambar.';
      try {
        const body = await response.json();
        if (body && body.error) err = body.error;
      } catch {
        err = `Error status ${response.status}`;
      }
      throw new Error(err);
    }

    const origW = response.headers.get('X-Original-Width') || currentBurikOrigWidth;
    const origH = response.headers.get('X-Original-Height') || currentBurikOrigHeight;
    const degW = response.headers.get('X-Degraded-Width') || '?';
    const degH = response.headers.get('X-Degraded-Height') || '?';
    const usedPreset = response.headers.get('X-Preset') || currentBurikPreset;

    const blob = await response.blob();
    currentBurikResultBlob = blob;
    if (currentBurikResultUrl) URL.revokeObjectURL(currentBurikResultUrl);
    currentBurikResultUrl = URL.createObjectURL(blob);

    const origUrl = URL.createObjectURL(currentBurikFile);

    // Setup Split Images
    if (burikCompareBeforeImg) burikCompareBeforeImg.src = origUrl;
    if (burikCompareAfterImg) burikCompareAfterImg.src = currentBurikResultUrl;

    // Setup Side-by-Side Images
    if (burikSideBeforeImg) burikSideBeforeImg.src = origUrl;
    if (burikSideAfterImg) burikSideAfterImg.src = currentBurikResultUrl;
    if (burikSideOrigDim) burikSideOrigDim.textContent = `${origW} × ${origH} px`;
    if (burikSideDegDim) burikSideDegDim.textContent = `Resolusi Asli Meme: ${degW} × ${degH} px`;

    // Badges & Download
    if (burikDimPillOrig) burikDimPillOrig.textContent = `Sebelum: ${origW} × ${origH} px`;
    if (burikDimPillResult) burikDimPillResult.textContent = `Sesudah: Burik (${degW} × ${degH} px)`;
    if (burikCompareBadge) burikCompareBadge.textContent = `Meme Burik (${usedPreset.toUpperCase()})`;

    if (burikDownloadBtn) {
      burikDownloadBtn.href = currentBurikResultUrl;
      const baseName = currentBurikFile.name.replace(/\.[^.]+$/, '');
      burikDownloadBtn.download = `${baseName}-burik-${usedPreset}.jpg`;
    }

    setBurikComparisonPosition(50);
    if (burikResultStage) burikResultStage.classList.remove('hidden');
    if (window.showToast) {
      window.showToast('Meme Jadi!', 'Foto berhasil diburikin seburik-buriknya!', 'success', 4000);
    }

  } catch (error) {
    if (window.showToast) {
      window.showToast('Gagal Memburikan', error.message, 'error', 5000);
    }
    if (burikEmptyState) burikEmptyState.classList.remove('hidden');
  } finally {
    if (burikLoadingState) burikLoadingState.classList.add('hidden');
    isBurikProcessing = false;
    if (burikProcessBtn) burikProcessBtn.disabled = false;
  }
}

if (burikProcessBtn) burikProcessBtn.addEventListener('click', processBurik);

// Bridge from Burik Result to HD Scaler Studio (Balikin ke HD)
if (btnBridgeBurikToHd) {
  btnBridgeBurikToHd.addEventListener('click', () => {
    if (!currentBurikResultBlob) return;
    const baseName = currentBurikFile ? currentBurikFile.name.replace(/\.[^.]+$/, '') : 'meme';
    if (window.switchStudioTab) window.switchStudioTab('scaler');
    if (typeof window.loadScalerFileFromBlob === 'function') {
      window.loadScalerFileFromBlob(currentBurikResultBlob, `${baseName}-burik.jpg`);
    }
    if (window.showToast) {
      window.showToast('Terkirim ke HD Scaler', 'Foto burik siap ditingkatkan kualitasnya kembali ke HD!', 'success', 3500);
    }
  });
}

// Bridge from Burik Result to Remove BG Studio
if (btnBridgeBurikToRemoveBg) {
  btnBridgeBurikToRemoveBg.addEventListener('click', () => {
    if (!currentBurikResultBlob) return;
    const baseName = currentBurikFile ? currentBurikFile.name.replace(/\.[^.]+$/, '') : 'meme';
    if (window.switchStudioTab) window.switchStudioTab('removebg');
    if (typeof window.loadRemoverFileFromBlob === 'function') {
      window.loadRemoverFileFromBlob(currentBurikResultBlob, `${baseName}-burik.jpg`);
    }
    if (window.showToast) {
      window.showToast('Terkirim ke Hapus Background', 'Foto meme burik siap dipotong backgroundnya!', 'success', 3500);
    }
  });
}
