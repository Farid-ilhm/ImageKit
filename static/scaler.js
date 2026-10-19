// ==========================================
// STUDIO LOKAL - HD IMAGE SCALER MODULE
// ==========================================

const scalerDropZone = document.querySelector('#scalerDropZone');
const scalerFileInput = document.querySelector('#scalerFileInput');
const scalerUploadPrompt = document.querySelector('#scalerUploadPrompt');
const scalerBrowseButton = document.querySelector('#scalerBrowseButton');
const scalerSelectedCard = document.querySelector('#scalerSelectedCard');
const scalerThumbImg = document.querySelector('#scalerThumbImg');
const scalerSelectedName = document.querySelector('#scalerSelectedName');
const scalerOrigDims = document.querySelector('#scalerOrigDims');
const scalerTargetDims = document.querySelector('#scalerTargetDims');
const scalerReplaceBtn = document.querySelector('#scalerReplaceBtn');

const scaleOpt2x = document.querySelector('#scaleOpt2x');
const scaleOpt4x = document.querySelector('#scaleOpt4x');
const scalerProfileBtn = document.querySelector('#scalerProfileBtn');
const scalerProfileMenu = document.querySelector('#scalerProfileMenu');
const scalerProfileWrap = document.querySelector('#scalerProfileWrap');
const scalerSelectedProfileTag = document.querySelector('#scalerSelectedProfileTag');
const scalerSelectedProfileText = document.querySelector('#scalerSelectedProfileText');
const scalerProfileItems = document.querySelectorAll('#scalerProfileMenu .comic-dropdown-item');

const scalerDenoiseToggle = document.querySelector('#scalerDenoiseToggle');
const scalerClaheToggle = document.querySelector('#scalerClaheToggle');
const scalerSharpenSlider = document.querySelector('#scalerSharpenSlider');
const scalerSharpenVal = document.querySelector('#scalerSharpenVal');
const scalerProcessBtn = document.querySelector('#scalerProcessBtn');

const scalerEmptyState = document.querySelector('#scalerEmptyState');
const scalerLoadingState = document.querySelector('#scalerLoadingState');
const scalerResultStage = document.querySelector('#scalerResultStage');
const scalerCompareBadge = document.querySelector('#scalerCompareBadge');
const dimPillOrig = document.querySelector('#dimPillOrig');
const dimPillHd = document.querySelector('#dimPillHd');
const compareContainer = document.querySelector('#compareContainer');
const compareStage = document.querySelector('#compareStage');
const compareBeforeImg = document.querySelector('#compareBeforeImg');
const compareAfterImg = document.querySelector('#compareAfterImg');
const compareHandle = document.querySelector('#compareHandle');
const compareSideContainer = document.querySelector('#compareSideContainer');
const sideBeforeImg = document.querySelector('#sideBeforeImg');
const sideAfterImg = document.querySelector('#sideAfterImg');
const sideOrigDim = document.querySelector('#sideOrigDim');
const sideHdDim = document.querySelector('#sideHdDim');
const btnModeSplit = document.querySelector('#btnModeSplit');
const btnModeSide = document.querySelector('#btnModeSide');
const btnBridgeRemoveBg = document.querySelector('#btnBridgeRemoveBg');
const scalerDownloadBtn = document.querySelector('#scalerDownloadBtn');

let currentScalerFile = null;
let currentScalerBlob = null;
let currentScalerScale = 2;
let currentScalerMode = 'photo';
let currentScalerOrigWidth = 0;
let currentScalerOrigHeight = 0;
let currentScalerResultBlob = null;
let currentScalerResultUrl = null;
let isScalerProcessing = false;

function updateScalerTargetDimensions() {
  if (!currentScalerOrigWidth || !currentScalerOrigHeight) return;
  const targetW = currentScalerOrigWidth * currentScalerScale;
  const targetH = currentScalerOrigHeight * currentScalerScale;
  if (scalerTargetDims) {
    scalerTargetDims.textContent = `Target: ${targetW} × ${targetH} px`;
  }
}

function loadScalerFile(file) {
  if (!file) return;
  currentScalerFile = file;
  currentScalerBlob = file;

  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    currentScalerOrigWidth = img.naturalWidth;
    currentScalerOrigHeight = img.naturalHeight;

    if (scalerThumbImg) scalerThumbImg.src = url;
    if (scalerSelectedName) scalerSelectedName.textContent = file.name;
    if (scalerOrigDims) scalerOrigDims.textContent = `${img.naturalWidth} × ${img.naturalHeight} px`;
    updateScalerTargetDimensions();

    if (scalerUploadPrompt) scalerUploadPrompt.classList.add('hidden');
    if (scalerSelectedCard) scalerSelectedCard.classList.remove('hidden');
    if (scalerProcessBtn) scalerProcessBtn.disabled = false;
  };
  img.src = url;
}

function loadScalerFileFromBlob(blob, name = 'gambar-potongan.png') {
  const file = new File([blob], name, { type: blob.type || 'image/png' });
  if (window.switchStudioTab) window.switchStudioTab('scaler');
  loadScalerFile(file);
  if (window.showToast) {
    window.showToast('Foto Dimuat', 'Foto hasil potongan siap ditingkatkan kualitasnya ke HD.', 'info', 3000);
  }
}

// Expose globally for remover.js
window.loadScalerFileFromBlob = loadScalerFileFromBlob;

// Upload event bindings
if (scalerBrowseButton) scalerBrowseButton.addEventListener('click', () => scalerFileInput && scalerFileInput.click());
if (scalerReplaceBtn) scalerReplaceBtn.addEventListener('click', () => scalerFileInput && scalerFileInput.click());

if (scalerFileInput) {
  scalerFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      loadScalerFile(e.target.files[0]);
    }
    scalerFileInput.value = '';
  });
}

if (scalerDropZone) {
  scalerDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    scalerDropZone.classList.add('dragging');
  });
  scalerDropZone.addEventListener('dragleave', (e) => {
    if (!scalerDropZone.contains(e.relatedTarget)) {
      scalerDropZone.classList.remove('dragging');
    }
  });
  scalerDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    scalerDropZone.classList.remove('dragging');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      loadScalerFile(e.dataTransfer.files[0]);
    }
  });
}

// Scale Factor buttons
if (scaleOpt2x) {
  scaleOpt2x.addEventListener('click', () => {
    currentScalerScale = 2;
    scaleOpt2x.classList.add('active');
    if (scaleOpt4x) scaleOpt4x.classList.remove('active');
    updateScalerTargetDimensions();
  });
}
if (scaleOpt4x) {
  scaleOpt4x.addEventListener('click', () => {
    currentScalerScale = 4;
    scaleOpt4x.classList.add('active');
    if (scaleOpt2x) scaleOpt2x.classList.remove('active');
    updateScalerTargetDimensions();
  });
}

// Scaler Profile Dropdown
if (scalerProfileBtn && scalerProfileMenu) {
  function toggleScalerProfileDropdown(open) {
    const shouldOpen = open !== undefined ? open : scalerProfileMenu.classList.contains('hidden');
    if (shouldOpen) {
      scalerProfileMenu.classList.remove('hidden');
      scalerProfileBtn.setAttribute('aria-expanded', 'true');
    } else {
      scalerProfileMenu.classList.add('hidden');
      scalerProfileBtn.setAttribute('aria-expanded', 'false');
    }
  }

  scalerProfileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleScalerProfileDropdown();
  });

  scalerProfileItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      currentScalerMode = item.dataset.value;
      if (scalerSelectedProfileTag) {
        scalerSelectedProfileTag.textContent = item.dataset.tag;
        scalerSelectedProfileTag.className = `dropdown-tag-badge ${item.dataset.tagClass}`;
      }
      if (scalerSelectedProfileText) {
        scalerSelectedProfileText.textContent = item.dataset.label;
      }
      scalerProfileItems.forEach((it) => {
        const isCurrent = it === item;
        it.classList.toggle('active', isCurrent);
        it.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
      });
      toggleScalerProfileDropdown(false);
      scalerProfileBtn.focus();
    });
  });

  document.addEventListener('click', (e) => {
    if (scalerProfileWrap && !scalerProfileWrap.contains(e.target)) {
      toggleScalerProfileDropdown(false);
    }
  });
}

// Sharpness Slider Value Sync
if (scalerSharpenSlider && scalerSharpenVal) {
  scalerSharpenSlider.addEventListener('input', () => {
    scalerSharpenVal.textContent = `${scalerSharpenSlider.value}%`;
  });
}

// Interactive Comparison Slider Drag Handler
let isSliderDragging = false;
let currentSplitPercent = 50;

function setComparisonPosition(percent) {
  const clamped = Math.max(0, Math.min(100, percent));
  currentSplitPercent = clamped;
  if (compareStage) {
    compareStage.style.setProperty('--split-pos', `${clamped}%`);
  }
  if (compareHandle) {
    compareHandle.setAttribute('aria-valuenow', Math.round(clamped));
  }
}

function handleComparisonPointer(e) {
  const target = compareStage || compareContainer;
  if (!target) return;
  const rect = target.getBoundingClientRect();
  if (rect.width <= 0) return;
  const clientX = e.touches && e.touches.length ? e.touches[0].clientX : e.clientX;
  const offsetX = clientX - rect.left;
  const pct = (offsetX / rect.width) * 100;
  setComparisonPosition(pct);
}

if (compareContainer) {
  const startDrag = (e) => {
    isSliderDragging = true;
    if (compareStage) compareStage.classList.add('dragging');
    handleComparisonPointer(e);
  };

  const stopDrag = () => {
    if (isSliderDragging) {
      isSliderDragging = false;
      if (compareStage) compareStage.classList.remove('dragging');
    }
  };

  compareContainer.addEventListener('mousedown', startDrag);
  window.addEventListener('mousemove', (e) => {
    if (isSliderDragging) handleComparisonPointer(e);
  });
  window.addEventListener('mouseup', stopDrag);

  compareContainer.addEventListener('touchstart', startDrag, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (isSliderDragging) handleComparisonPointer(e);
  }, { passive: true });
  window.addEventListener('touchend', stopDrag);
}

if (compareHandle) {
  compareHandle.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      setComparisonPosition(currentSplitPercent - 2);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      setComparisonPosition(currentSplitPercent + 2);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setComparisonPosition(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setComparisonPosition(100);
    }
  });
}

// View Mode Tabs (Split vs Side-by-Side)
if (btnModeSplit && btnModeSide) {
  btnModeSplit.addEventListener('click', () => {
    btnModeSplit.classList.add('active');
    btnModeSide.classList.remove('active');
    if (compareContainer) compareContainer.classList.remove('hidden');
    if (compareSideContainer) compareSideContainer.classList.add('hidden');
  });

  btnModeSide.addEventListener('click', () => {
    btnModeSide.classList.add('active');
    btnModeSplit.classList.remove('active');
    if (compareContainer) compareContainer.classList.add('hidden');
    if (compareSideContainer) compareSideContainer.classList.remove('hidden');
  });
}

// Scaler Process Execution
async function processScaler() {
  if (!currentScalerFile || isScalerProcessing) return;
  isScalerProcessing = true;
  if (scalerProcessBtn) scalerProcessBtn.disabled = true;

  if (scalerEmptyState) scalerEmptyState.classList.add('hidden');
  if (scalerResultStage) scalerResultStage.classList.add('hidden');
  if (scalerLoadingState) scalerLoadingState.classList.remove('hidden');

  if (window.showToast) {
    window.showToast('Memproses HD', `Meningkatkan foto ke skala ${currentScalerScale}× HD...`, 'info', 3000);
  }

  const form = new FormData();
  form.append('image', currentScalerFile);
  form.append('scale', String(currentScalerScale));
  form.append('mode', currentScalerMode);
  form.append('denoise', String(scalerDenoiseToggle ? scalerDenoiseToggle.checked : true));
  form.append('enhance_contrast', String(scalerClaheToggle ? scalerClaheToggle.checked : true));
  form.append('sharpen', String(scalerSharpenSlider ? scalerSharpenSlider.value : 15));

  try {
    const response = await fetch('/api/scale', { method: 'POST', body: form });
    if (!response.ok) {
      let err = 'Gagal meningkatkan resolusi gambar.';
      try {
        const body = await response.json();
        if (body && body.error) err = body.error;
      } catch {
        err = `Error status ${response.status}`;
      }
      throw new Error(err);
    }

    const origW = response.headers.get('X-Original-Width') || currentScalerOrigWidth;
    const origH = response.headers.get('X-Original-Height') || currentScalerOrigHeight;
    const scaledW = response.headers.get('X-Scaled-Width') || (currentScalerOrigWidth * currentScalerScale);
    const scaledH = response.headers.get('X-Scaled-Height') || (currentScalerOrigHeight * currentScalerScale);

    const blob = await response.blob();
    currentScalerResultBlob = blob;
    if (currentScalerResultUrl) URL.revokeObjectURL(currentScalerResultUrl);
    currentScalerResultUrl = URL.createObjectURL(blob);

    const origUrl = URL.createObjectURL(currentScalerFile);

    // Setup Split Images
    if (compareBeforeImg) compareBeforeImg.src = origUrl;
    if (compareAfterImg) compareAfterImg.src = currentScalerResultUrl;

    // Setup Side-by-Side Images
    if (sideBeforeImg) sideBeforeImg.src = origUrl;
    if (sideAfterImg) sideAfterImg.src = currentScalerResultUrl;
    if (sideOrigDim) sideOrigDim.textContent = `${origW} × ${origH} px`;
    if (sideHdDim) sideHdDim.textContent = `${scaledW} × ${scaledH} px (${currentScalerScale}× HD)`;

    // Badges & Download
    if (dimPillOrig) dimPillOrig.textContent = `Sebelum: ${origW} × ${origH} px`;
    if (dimPillHd) dimPillHd.textContent = `Sesudah: ${scaledW} × ${scaledH} px (${currentScalerScale}× HD)`;
    if (scalerCompareBadge) scalerCompareBadge.textContent = `${scaledW} × ${scaledH} px`;

    if (scalerDownloadBtn) {
      scalerDownloadBtn.href = currentScalerResultUrl;
      const baseName = currentScalerFile.name.replace(/\.[^.]+$/, '');
      scalerDownloadBtn.download = `${baseName}-hd-${currentScalerScale}x.png`;
    }

    setComparisonPosition(50);
    if (scalerResultStage) scalerResultStage.classList.remove('hidden');
    if (window.showToast) {
      window.showToast('Selesai!', `Foto berhasil ditingkatkan ke ${scaledW} × ${scaledH} px!`, 'success', 4500);
    }

  } catch (error) {
    if (window.showToast) {
      window.showToast('Gagal MemperHD', error.message, 'error', 5000);
    }
    if (scalerEmptyState) scalerEmptyState.classList.remove('hidden');
  } finally {
    if (scalerLoadingState) scalerLoadingState.classList.add('hidden');
    isScalerProcessing = false;
    if (scalerProcessBtn) scalerProcessBtn.disabled = false;
  }
}

if (scalerProcessBtn) scalerProcessBtn.addEventListener('click', processScaler);

// Bridge from Scaler Result to Remove BG Studio
if (btnBridgeRemoveBg) {
  btnBridgeRemoveBg.addEventListener('click', () => {
    if (!currentScalerResultBlob) return;
    const baseName = currentScalerFile ? currentScalerFile.name.replace(/\.[^.]+$/, '') : 'gambar';
    if (window.switchStudioTab) window.switchStudioTab('removebg');
    if (typeof window.loadRemoverFileFromBlob === 'function') {
      window.loadRemoverFileFromBlob(currentScalerResultBlob, `${baseName}-hd-${currentScalerScale}x.png`);
    }
    if (window.showToast) {
      window.showToast('Terkirim ke Hapus Background', 'Foto resolusi tinggi siap dipotong backgroundnya!', 'success', 3500);
    }
  });
}

// Bridge from Scaler Result to Meme Burik Studio
const btnBridgeScalerToBurik = document.querySelector('#btnBridgeScalerToBurik');
if (btnBridgeScalerToBurik) {
  btnBridgeScalerToBurik.addEventListener('click', () => {
    if (!currentScalerResultBlob) return;
    const baseName = currentScalerFile ? currentScalerFile.name.replace(/\.[^.]+$/, '') : 'gambar';
    if (window.switchStudioTab) window.switchStudioTab('burik');
    if (typeof window.loadBurikFileFromBlob === 'function') {
      window.loadBurikFileFromBlob(currentScalerResultBlob, `${baseName}-hd-${currentScalerScale}x.png`);
    }
    if (window.showToast) {
      window.showToast('Terkirim ke Meme Burik', 'Foto HD siap dihancurkan seburik-buriknya!', 'success', 3500);
    }
  });
}
