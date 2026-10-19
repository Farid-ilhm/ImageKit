// ==========================================
// STUDIO LOKAL - MAIN APP CONTROLLER & SHELL
// ==========================================

const toastContainer = document.querySelector('#toastContainer');
const tabBtnRemoveBg = document.querySelector('#tabBtnRemoveBg');
const tabBtnScaler = document.querySelector('#tabBtnScaler');
const tabBtnBurik = document.querySelector('#tabBtnBurik');
const removeBgView = document.querySelector('#removeBgView');
const scalerView = document.querySelector('#scalerView');
const burikView = document.querySelector('#burikView');

let activeStudioTab = 'removebg';

// Toast Notification Manager
function showToast(title, message, type = 'info', duration = 4000) {
  if (!toastContainer) return;
  const toast = document.createElement('div');
  toast.className = `comic-toast toast-${type}`;

  let iconSvg = '';
  if (type === 'success') {
    iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#18181b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  } else if (type === 'error') {
    iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#18181b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
  } else {
    iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#18181b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="16" r="10"/><line x1="12" y1="12" x2="12" y2="8"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
  }

  toast.innerHTML = `
    <div class="toast-icon-wrap" aria-hidden="true">${iconSvg}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-msg">${message}</div>
    </div>
    <button type="button" class="toast-close-btn" aria-label="Tutup notifikasi">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;

  const closeBtn = toast.querySelector('.toast-close-btn');
  closeBtn.addEventListener('click', () => {
    toast.classList.add('toast-hide');
    setTimeout(() => toast.remove(), 250);
  });

  toastContainer.append(toast);

  if (duration > 0) {
    setTimeout(() => {
      if (toast.isConnected) {
        toast.classList.add('toast-hide');
        setTimeout(() => toast.remove(), 250);
      }
    }, duration);
  }
}

// Global Tab Switcher
function switchStudioTab(tab) {
  activeStudioTab = tab;

  if (tabBtnRemoveBg) {
    const isCurrent = tab === 'removebg';
    tabBtnRemoveBg.classList.toggle('active', isCurrent);
    tabBtnRemoveBg.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
  }
  if (tabBtnScaler) {
    const isCurrent = tab === 'scaler';
    tabBtnScaler.classList.toggle('active', isCurrent);
    tabBtnScaler.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
  }
  if (tabBtnBurik) {
    const isCurrent = tab === 'burik';
    tabBtnBurik.classList.toggle('active', isCurrent);
    tabBtnBurik.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
  }

  if (removeBgView) removeBgView.classList.toggle('hidden', tab !== 'removebg');
  if (scalerView) scalerView.classList.toggle('hidden', tab !== 'scaler');
  if (burikView) burikView.classList.toggle('hidden', tab !== 'burik');
}

// Expose globally
window.showToast = showToast;
window.switchStudioTab = switchStudioTab;

if (tabBtnRemoveBg) tabBtnRemoveBg.addEventListener('click', () => switchStudioTab('removebg'));
if (tabBtnScaler) tabBtnScaler.addEventListener('click', () => switchStudioTab('scaler'));
if (tabBtnBurik) tabBtnBurik.addEventListener('click', () => switchStudioTab('burik'));

// Global Paste Clipboard (Ctrl+V) routing to active studio
window.addEventListener('paste', (event) => {
  const editorModal = document.querySelector('#editorModal');
  if (editorModal && !editorModal.classList.contains('hidden')) return;

  const items = event.clipboardData ? event.clipboardData.items : [];
  const files = [];
  for (const item of items) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) files.push(file);
    }
  }

  if (files.length > 0) {
    if (activeStudioTab === 'scaler') {
      if (typeof window.loadScalerFileFromBlob === 'function') {
        window.loadScalerFileFromBlob(files[0], files[0].name);
      }
    } else if (activeStudioTab === 'burik') {
      if (typeof window.loadBurikFileFromBlob === 'function') {
        window.loadBurikFileFromBlob(files[0], files[0].name);
      }
    } else {
      if (typeof window.loadRemoverFileFromBlob === 'function') {
        window.loadRemoverFileFromBlob(files[0], files[0].name);
      }
    }
  }
});
