// ==========================================
// STUDIO LOKAL - REMOVE BACKGROUND MODULE
// ==========================================

const fileInput = document.querySelector('#fileInput');
const dropZone = document.querySelector('#dropZone');
const uploadPrompt = document.querySelector('#uploadPrompt');
const queueHeader = document.querySelector('#queueHeader');
const queueTitle = document.querySelector('#queueTitle');
const imageList = document.querySelector('#imageList');
const processButton = document.querySelector('#processButton');

const resultsSection = document.querySelector('#resultsSection');
const resultsGrid = document.querySelector('#resultsGrid');
const resultCount = document.querySelector('#resultCount');
const galleryEmptyState = document.querySelector('#galleryEmptyState');
const galleryLoadingState = document.querySelector('#galleryLoadingState');
const loadingStateTitle = document.querySelector('#loadingStateTitle');
const loadingStateSubtitle = document.querySelector('#loadingStateSubtitle');
const loadingProgressBar = document.querySelector('#loadingProgressBar');
const loadingProgressBadge = document.querySelector('#loadingProgressBadge');
const loadingProgressPercent = document.querySelector('#loadingProgressPercent');

const mattingToggle = document.querySelector('#mattingToggle');
const modelSelect = document.querySelector('#modelSelect');

// Editor Modal Elements
const editorModal = document.querySelector('#editorModal');
const editorCloseBtn = document.querySelector('#editorCloseBtn');
const editorCancelBtn = document.querySelector('#editorCancelBtn');
const editorSaveBtn = document.querySelector('#editorSaveBtn');
const editorFileName = document.querySelector('#editorFileName');
const editorFileDims = document.querySelector('#editorFileDims');

const toolRestoreBtn = document.querySelector('#toolRestoreBtn');
const toolEraseBtn = document.querySelector('#toolEraseBtn');
const brushSizeInput = document.querySelector('#brushSizeInput');
const brushSizeVal = document.querySelector('#brushSizeVal');

const undoBtn = document.querySelector('#undoBtn');
const redoBtn = document.querySelector('#redoBtn');
const resetEditorBtn = document.querySelector('#resetEditorBtn');

const editorViewport = document.querySelector('#editorViewport');
const paintCanvas = document.querySelector('#paintCanvas');
const ghostGuideImg = document.querySelector('#ghostGuideImg');
const brushCursorRing = document.querySelector('#brushCursorRing');

const maxFiles = 10;
const maxBytes = 25 * 1024 * 1024;
const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/bmp', 'image/tiff']);
let selectedFiles = [];
let isProcessing = false;

// ==========================================
// EDITOR STATE
// ==========================================
let activeEditCard = null;
let currentTool = 'restore'; // 'restore' | 'erase'
let brushSize = 30;
let isDrawing = false;
let lastPoint = null;
let origImgElement = null;
let initialCutoutImgElement = null;
let origPattern = null;
let historyStack = [];
let redoStack = [];
const maxHistory = 20;

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function addFiles(fileCollection) {
  for (const file of fileCollection) {
    if (selectedFiles.length >= maxFiles) {
      alert(`Maksimal ${maxFiles} gambar dalam satu antrean.`);
      break;
    }
    if (!allowedTypes.has(file.type)) {
      alert(`${file.name}: format gambar tidak didukung.`);
      continue;
    }
    if (file.size > maxBytes) {
      alert(`${file.name}: ukuran melebihi 25 MB.`);
      continue;
    }
    if (selectedFiles.some((item) => item.file.name === file.name && item.file.size === file.size)) continue;
    selectedFiles.push({ file, url: URL.createObjectURL(file) });
  }
  renderQueue();
}

function renderQueue() {
  const hasFiles = selectedFiles.length > 0;
  if (uploadPrompt) uploadPrompt.classList.toggle('hidden', hasFiles);
  if (queueHeader) queueHeader.classList.toggle('hidden', !hasFiles);
  if (queueTitle) queueTitle.textContent = `${selectedFiles.length} gambar dipilih`;
  if (processButton) processButton.disabled = !hasFiles || isProcessing;
  if (imageList) imageList.replaceChildren();

  selectedFiles.forEach(({ file, url }, index) => {
    const row = document.createElement('div');
    row.className = 'file-row';

    const thumb = document.createElement('img');
    thumb.className = 'file-thumb';
    thumb.src = url;
    thumb.alt = '';

    const details = document.createElement('div');
    details.className = 'file-details';

    const name = document.createElement('div');
    name.className = 'file-name';
    name.textContent = file.name;
    name.title = file.name;

    const meta = document.createElement('div');
    meta.className = 'file-meta';
    meta.textContent = formatBytes(file.size);

    details.append(name, meta);

    const remove = document.createElement('button');
    remove.className = 'remove-file';
    remove.type = 'button';
    remove.setAttribute('aria-label', `Hapus ${file.name} dari antrean`);
    remove.textContent = '×';
    remove.disabled = isProcessing;
    remove.addEventListener('click', () => {
      URL.revokeObjectURL(selectedFiles[index].url);
      selectedFiles.splice(index, 1);
      renderQueue();
    });

    row.append(thumb, details, remove);
    if (imageList) imageList.append(row);
  });
}

async function processFile(item, index, total) {
  const form = new FormData();
  form.append('image', item.file);
  form.append('alpha_matting', String(mattingToggle ? mattingToggle.checked : false));
  if (modelSelect) {
    form.append('model', modelSelect.value);
  }

  const response = await fetch('/api/remove', { method: 'POST', body: form });
  if (!response.ok) {
    let message = 'Gagal memproses gambar.';
    try {
      const problem = await response.json();
      if (problem && problem.error) {
        message = problem.error;
      }
    } catch {
      message = `Gagal memproses gambar (Status ${response.status}).`;
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  let currentBlob = blob;
  let currentUrl = URL.createObjectURL(blob);
  const width = response.headers.get('X-Image-Width');
  const height = response.headers.get('X-Image-Height');

  const card = document.createElement('article');
  card.className = 'result-card';

  const head = document.createElement('div');
  head.className = 'result-card-head';

  const titleGroup = document.createElement('div');
  titleGroup.className = 'result-head-title';

  const name = document.createElement('span');
  name.className = 'result-name';
  name.textContent = item.file.name;
  name.title = item.file.name;

  const statusPill = document.createElement('span');
  statusPill.className = 'result-status-pill';
  statusPill.innerHTML = '<span class="status-dot-mini"></span> Selesai';

  titleGroup.append(name, statusPill);

  const size = document.createElement('span');
  size.className = 'result-size';
  size.textContent = width && height ? `${width} × ${height} px` : 'PNG';

  head.append(titleGroup, size);

  const preview = document.createElement('div');
  preview.className = 'result-preview';

  const image = document.createElement('img');
  image.src = currentUrl;
  image.alt = `Hasil tanpa background: ${item.file.name}`;
  preview.append(image);

  const footer = document.createElement('div');
  footer.className = 'result-footer';

  // Restore / Edit Brush button
  const editBtn = document.createElement('button');
  editBtn.className = 'btn-card-edit';
  editBtn.type = 'button';
  editBtn.title = 'Buka kuas untuk memulihkan detail objek yang terhapus atau merapikan tepi';
  editBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-.93-2.15l-.07-.07Z"/></svg><span>Edit / Pulihkan</span>';

  const download = document.createElement('a');
  download.className = 'btn-card-download';
  download.href = currentUrl;
  download.download = `${item.file.name.replace(/\.[^.]+$/, '')}-tanpa-background.png`;
  download.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><span>Unduh PNG</span>';

  const cardData = {
    file: item.file,
    origUrl: item.url,
    resultUrl: currentUrl,
    resultBlob: currentBlob,
    width: width ? parseInt(width, 10) : null,
    height: height ? parseInt(height, 10) : null,
    updateResult: (newBlob, newUrl) => {
      currentBlob = newBlob;
      currentUrl = newUrl;
      image.src = newUrl;
      download.href = newUrl;
      cardData.resultBlob = newBlob;
      cardData.resultUrl = newUrl;
    }
  };

  editBtn.addEventListener('click', () => {
    openBrushEditor(cardData);
  });

  const scaleBtn = document.createElement('button');
  scaleBtn.className = 'btn-card-scale';
  scaleBtn.type = 'button';
  scaleBtn.title = 'Tingkatkan resolusi hasil potongan ini menjadi 2x atau 4x HD';
  scaleBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#18181b" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="#ffd23f"/></svg><span>Perbesar HD</span>';
  scaleBtn.addEventListener('click', () => {
    const fileName = `${item.file.name.replace(/\.[^.]+$/, '')}-tanpa-background.png`;
    if (typeof window.loadScalerFileFromBlob === 'function') {
      window.loadScalerFileFromBlob(cardData.resultBlob, fileName);
    }
  });

  const burikBtn = document.createElement('button');
  burikBtn.className = 'btn-card-scale';
  burikBtn.type = 'button';
  burikBtn.title = 'Memburikan hasil potongan ini untuk meme';
  burikBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#18181b" stroke-width="2.5"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" fill="#ff5722"/></svg><span>Burikin</span>';
  burikBtn.addEventListener('click', () => {
    const fileName = `${item.file.name.replace(/\.[^.]+$/, '')}-tanpa-background.png`;
    if (typeof window.loadBurikFileFromBlob === 'function') {
      window.loadBurikFileFromBlob(cardData.resultBlob, fileName);
    }
  });

  footer.append(editBtn, scaleBtn, burikBtn, download);
  card.append(head, preview, footer);
  if (resultsGrid) resultsGrid.append(card);

  if (resultCount) resultCount.textContent = `· ${index + 1} dari ${total}`;
}

async function processAll() {
  if (isProcessing || selectedFiles.length === 0) return;
  isProcessing = true;
  if (processButton) processButton.disabled = true;

  if (galleryEmptyState) galleryEmptyState.classList.add('hidden');
  if (galleryLoadingState) galleryLoadingState.classList.remove('hidden');
  if (resultsSection) resultsSection.classList.remove('hidden');
  if (resultsGrid) resultsGrid.replaceChildren();

  const files = [...selectedFiles];
  let completed = 0;
  let failed = 0;
  const labelSpan = processButton ? processButton.querySelector('span:first-child') : null;
  if (labelSpan) labelSpan.textContent = 'Menyiapkan AI...';

  if (loadingStateTitle) loadingStateTitle.textContent = 'Menyiapkan Model AI...';
  if (loadingStateSubtitle) loadingStateSubtitle.textContent = `Memuat model untuk memproses ${files.length} gambar.`;
  if (loadingProgressBar) loadingProgressBar.style.width = '10%';
  if (loadingProgressBadge) loadingProgressBadge.textContent = `0 dari ${files.length} selesai`;
  if (loadingProgressPercent) loadingProgressPercent.textContent = '10%';

  if (window.showToast) {
    window.showToast('Memulai Proses', `Sedang memproses ${files.length} foto dengan model AI...`, 'info', 3000);
  }

  try {
    for (let index = 0; index < files.length; index += 1) {
      const currentPct = Math.max(12, Math.round((index / files.length) * 100));
      if (labelSpan) labelSpan.textContent = `Memproses ${index + 1}/${files.length}...`;
      if (loadingStateTitle) loadingStateTitle.textContent = `Memotong Foto: ${files[index].file.name}`;
      if (loadingStateSubtitle) loadingStateSubtitle.textContent = `Sedang memisahkan objek foto (${index + 1} dari ${files.length})...`;
      if (loadingProgressBar) loadingProgressBar.style.width = `${currentPct}%`;
      if (loadingProgressBadge) loadingProgressBadge.textContent = `Foto ${index + 1} dari ${files.length}`;
      if (loadingProgressPercent) loadingProgressPercent.textContent = `${currentPct}%`;

      try {
        await processFile(files[index], index, files.length);
        completed += 1;
      } catch (error) {
        failed += 1;
        const card = document.createElement('div');
        card.className = 'result-card';
        card.style.padding = '18px';
        card.style.color = '#ef4444';
        card.textContent = `${files[index].file.name}: ${error.message}`;
        if (resultsGrid) resultsGrid.append(card);
        if (window.showToast) {
          window.showToast('Gagal Memproses Foto', `${files[index].file.name}: ${error.message}`, 'error', 4500);
        }
      }
    }

    if (loadingProgressBar) loadingProgressBar.style.width = '100%';
    if (loadingProgressPercent) loadingProgressPercent.textContent = '100%';
    if (resultCount) resultCount.textContent = `· ${completed} berhasil dari ${files.length}`;

    if (window.showToast) {
      if (failed === 0) {
        window.showToast('Selesai!', `Semua ${completed} foto berhasil dihapus backgroundnya dan siap diunduh!`, 'success', 5000);
      } else {
        window.showToast('Pemrosesan Selesai', `${completed} foto berhasil, ${failed} gagal diproses.`, 'info', 5000);
      }
    }
  } finally {
    if (galleryLoadingState) galleryLoadingState.classList.add('hidden');
    isProcessing = false;
    if (labelSpan) labelSpan.textContent = 'Hapus Background';
    renderQueue();
  }
}

// ==========================================
// RESTORE BRUSH EDITOR CONTROLLER
// ==========================================
function openBrushEditor(cardData) {
  activeEditCard = cardData;
  if (editorFileName) editorFileName.textContent = cardData.file.name;
  if (editorFileDims) {
    editorFileDims.textContent = cardData.width && cardData.height ? `${cardData.width} × ${cardData.height} px` : 'Resolusi Asli';
  }

  if (editorModal) editorModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  origImgElement = new Image();
  initialCutoutImgElement = new Image();

  origImgElement.src = cardData.origUrl;
  initialCutoutImgElement.src = cardData.resultUrl;

  if (ghostGuideImg) ghostGuideImg.src = cardData.origUrl;

  Promise.all([
    new Promise((resolve) => (origImgElement.onload = resolve)),
    new Promise((resolve) => (initialCutoutImgElement.onload = resolve))
  ]).then(() => {
    initCanvas();
  });
}

function closeBrushEditor() {
  if (editorModal) editorModal.classList.add('hidden');
  document.body.style.overflow = '';
  activeEditCard = null;
  historyStack = [];
  redoStack = [];
  isDrawing = false;
}

function initCanvas() {
  const w = origImgElement.naturalWidth || initialCutoutImgElement.naturalWidth;
  const h = origImgElement.naturalHeight || initialCutoutImgElement.naturalHeight;

  paintCanvas.width = w;
  paintCanvas.height = h;

  const ctx = paintCanvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(initialCutoutImgElement, 0, 0);

  origPattern = ctx.createPattern(origImgElement, 'no-repeat');

  historyStack = [ctx.getImageData(0, 0, w, h)];
  redoStack = [];
  updateHistoryButtons();

  setTool('restore');
  setBackdrop('checker');
}

function updateHistoryButtons() {
  if (undoBtn) undoBtn.disabled = historyStack.length <= 1;
  if (redoBtn) redoBtn.disabled = redoStack.length === 0;
}

function saveCanvasState() {
  const ctx = paintCanvas.getContext('2d');
  if (historyStack.length >= maxHistory) {
    historyStack.shift();
  }
  historyStack.push(ctx.getImageData(0, 0, paintCanvas.width, paintCanvas.height));
  redoStack = [];
  updateHistoryButtons();
}

function undo() {
  if (historyStack.length <= 1) return;
  const ctx = paintCanvas.getContext('2d');
  const current = historyStack.pop();
  redoStack.push(current);
  const previous = historyStack[historyStack.length - 1];
  ctx.putImageData(previous, 0, 0);
  updateHistoryButtons();
}

function redo() {
  if (redoStack.length === 0) return;
  const ctx = paintCanvas.getContext('2d');
  const next = redoStack.pop();
  historyStack.push(next);
  ctx.putImageData(next, 0, 0);
  updateHistoryButtons();
}

function resetToInitial() {
  if (!confirm('Kembalikan kanvas ke hasil potongan AI awal?')) return;
  saveCanvasState();
  const ctx = paintCanvas.getContext('2d');
  ctx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
  ctx.drawImage(initialCutoutImgElement, 0, 0);
}

function setTool(tool) {
  currentTool = tool;
  if (toolRestoreBtn) toolRestoreBtn.classList.toggle('active', tool === 'restore');
  if (toolEraseBtn) toolEraseBtn.classList.toggle('active', tool === 'erase');
}

function setBackdrop(type) {
  if (editorViewport) editorViewport.className = `editor-viewport bg-${type === 'ghost' ? 'checker' : type}`;
  if (ghostGuideImg) ghostGuideImg.classList.toggle('hidden', type !== 'ghost');
  document.querySelectorAll('.btn-bd').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.bd === type);
  });
}

function getCanvasCoordinates(e) {
  const rect = paintCanvas.getBoundingClientRect();
  const scaleX = paintCanvas.width / rect.width;
  const scaleY = paintCanvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

function drawStroke(x1, y1, x2, y2) {
  const ctx = paintCanvas.getContext('2d');
  ctx.save();

  if (currentTool === 'restore') {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = origPattern;
    ctx.fillStyle = origPattern;
  } else {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    ctx.fillStyle = 'rgba(0,0,0,1)';
  }

  ctx.lineWidth = brushSize;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x2, y2, brushSize / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Canvas Pointer Listeners
if (paintCanvas) {
  paintCanvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    isDrawing = true;
    paintCanvas.setPointerCapture(e.pointerId);
    saveCanvasState();
    const pt = getCanvasCoordinates(e);
    lastPoint = pt;
    drawStroke(pt.x, pt.y, pt.x, pt.y);
  });

  paintCanvas.addEventListener('pointermove', (e) => {
    const rect = paintCanvas.getBoundingClientRect();
    const viewportRect = editorViewport ? editorViewport.getBoundingClientRect() : rect;
    const displayScale = rect.width / paintCanvas.width;
    const currentDisplaySize = Math.max(6, brushSize * displayScale);

    if (brushCursorRing) {
      brushCursorRing.style.width = `${currentDisplaySize}px`;
      brushCursorRing.style.height = `${currentDisplaySize}px`;
      brushCursorRing.style.left = `${e.clientX - viewportRect.left}px`;
      brushCursorRing.style.top = `${e.clientY - viewportRect.top}px`;
      brushCursorRing.classList.remove('hidden');
    }

    if (!isDrawing) return;
    const pt = getCanvasCoordinates(e);
    drawStroke(lastPoint.x, lastPoint.y, pt.x, pt.y);
    lastPoint = pt;
  });

  function endDrawing(e) {
    if (isDrawing) {
      isDrawing = false;
      try {
        paintCanvas.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  }

  paintCanvas.addEventListener('pointerup', endDrawing);
  paintCanvas.addEventListener('pointercancel', endDrawing);
}

if (editorViewport && brushCursorRing) {
  editorViewport.addEventListener('pointerleave', () => {
    brushCursorRing.classList.add('hidden');
  });
}

// Brush Controls
if (brushSizeInput && brushSizeVal) {
  brushSizeInput.addEventListener('input', (e) => {
    brushSize = parseInt(e.target.value, 10);
    brushSizeVal.textContent = brushSize;
  });
}

if (toolRestoreBtn) toolRestoreBtn.addEventListener('click', () => setTool('restore'));
if (toolEraseBtn) toolEraseBtn.addEventListener('click', () => setTool('erase'));
if (undoBtn) undoBtn.addEventListener('click', undo);
if (redoBtn) redoBtn.addEventListener('click', redo);
if (resetEditorBtn) resetEditorBtn.addEventListener('click', resetToInitial);

document.querySelectorAll('.btn-bd').forEach((btn) => {
  btn.addEventListener('click', () => setBackdrop(btn.dataset.bd));
});

if (editorCloseBtn) editorCloseBtn.addEventListener('click', closeBrushEditor);
if (editorCancelBtn) editorCancelBtn.addEventListener('click', closeBrushEditor);

if (editorSaveBtn) {
  editorSaveBtn.addEventListener('click', () => {
    if (!activeEditCard) return;
    editorSaveBtn.disabled = true;
    editorSaveBtn.innerHTML = 'Menyimpan...';

    paintCanvas.toBlob((blob) => {
      if (blob) {
        const newUrl = URL.createObjectURL(blob);
        activeEditCard.updateResult(blob, newUrl);
      }
      editorSaveBtn.disabled = false;
      editorSaveBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg><span>Simpan & Terapkan</span>';
      closeBrushEditor();
    }, 'image/png');
  });
}

// Keyboard shortcuts inside editor
window.addEventListener('keydown', (e) => {
  if (!editorModal || editorModal.classList.contains('hidden')) return;
  if (e.key === 'Escape') {
    closeBrushEditor();
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    if (e.shiftKey) redo();
    else undo();
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
    e.preventDefault();
    redo();
  } else if (e.key.toLowerCase() === 'r') {
    setTool('restore');
  } else if (e.key.toLowerCase() === 'e') {
    setTool('erase');
  } else if (e.key === '[') {
    brushSize = Math.max(4, brushSize - 5);
    if (brushSizeInput) brushSizeInput.value = brushSize;
    if (brushSizeVal) brushSizeVal.textContent = brushSize;
  } else if (e.key === ']') {
    brushSize = Math.min(150, brushSize + 5);
    if (brushSizeInput) brushSizeInput.value = brushSize;
    if (brushSizeVal) brushSizeVal.textContent = brushSize;
  }
});

// Dropzone & File Input Listeners
const browseBtn = document.querySelector('#browseButton');
const addMoreBtn = document.querySelector('#addMoreButton');
if (browseBtn) browseBtn.addEventListener('click', () => fileInput && fileInput.click());
if (addMoreBtn) addMoreBtn.addEventListener('click', () => fileInput && fileInput.click());

if (fileInput) {
  fileInput.addEventListener('change', (event) => {
    addFiles(event.target.files);
    fileInput.value = '';
  });
}

if (processButton) processButton.addEventListener('click', processAll);

if (dropZone) {
  dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.classList.add('dragging');
  });
  dropZone.addEventListener('dragleave', (event) => {
    if (!dropZone.contains(event.relatedTarget)) dropZone.classList.remove('dragging');
  });
  dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.classList.remove('dragging');
    addFiles(event.dataTransfer.files);
  });
}

// Model Selection Custom Dropdown
const comicDropdownWrap = document.querySelector('#comicDropdownWrap');
const comicDropdownBtn = document.querySelector('#comicDropdownBtn');
const comicDropdownMenu = document.querySelector('#comicDropdownMenu');
const dropdownSelectedTag = document.querySelector('#dropdownSelectedTag');
const dropdownSelectedText = document.querySelector('#dropdownSelectedText');
const dropdownItems = document.querySelectorAll('#comicDropdownMenu .comic-dropdown-item');

if (comicDropdownBtn && comicDropdownMenu) {
  function toggleDropdown(open) {
    const shouldOpen = open !== undefined ? open : comicDropdownMenu.classList.contains('hidden');
    if (shouldOpen) {
      comicDropdownMenu.classList.remove('hidden');
      comicDropdownBtn.setAttribute('aria-expanded', 'true');
      const activeItem = comicDropdownMenu.querySelector('.comic-dropdown-item.active') || dropdownItems[0];
      if (activeItem) activeItem.focus();
    } else {
      comicDropdownMenu.classList.add('hidden');
      comicDropdownBtn.setAttribute('aria-expanded', 'false');
    }
  }

  function selectDropdownItem(item) {
    const val = item.dataset.value;
    const tag = item.dataset.tag;
    const tagClass = item.dataset.tagClass;
    const label = item.dataset.label;

    if (modelSelect) {
      modelSelect.value = val;
      modelSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (dropdownSelectedTag) {
      dropdownSelectedTag.textContent = tag;
      dropdownSelectedTag.className = `dropdown-tag-badge ${tagClass}`;
    }

    if (dropdownSelectedText) {
      dropdownSelectedText.textContent = label;
    }

    dropdownItems.forEach((it) => {
      const isCurrent = it === item;
      it.classList.toggle('active', isCurrent);
      it.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
    });

    toggleDropdown(false);
    comicDropdownBtn.focus();
  }

  comicDropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  dropdownItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      selectDropdownItem(item);
    });

    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectDropdownItem(item);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = item.nextElementSibling;
        if (next && next.classList.contains('comic-dropdown-item')) next.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = item.previousElementSibling;
        if (prev && prev.classList.contains('comic-dropdown-item')) prev.focus();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        toggleDropdown(false);
        comicDropdownBtn.focus();
      }
    });
  });

  document.addEventListener('click', (e) => {
    if (comicDropdownWrap && !comicDropdownWrap.contains(e.target)) {
      toggleDropdown(false);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !comicDropdownMenu.classList.contains('hidden')) {
      toggleDropdown(false);
      comicDropdownBtn.focus();
    }
  });
}

// Global hook for forwarding files from scaler back to remover
window.loadRemoverFileFromBlob = function(blob, fileName = 'gambar-hd.png') {
  const file = new File([blob], fileName, { type: blob.type || 'image/png' });
  addFiles([file]);
};
