let deferredPrompt = null;
let installed = false;
const listeners = new Set();

function checkStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function checkIsIos() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function notify() {
  const state = getPwaState();
  listeners.forEach((cb) => cb(state));
}

export function initPwaInstallListener() {
  if (typeof window === 'undefined' || window.__alsyifaPwaInit) return;
  window.__alsyifaPwaInit = true;
  installed = checkStandalone();

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    notify();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installed = true;
    notify();
  });
}

export function getPwaState() {
  return {
    canPrompt: !!deferredPrompt,
    isInstalled: installed || checkStandalone(),
    isIos: checkIsIos(),
  };
}

export function subscribePwaState(cb) {
  listeners.add(cb);
  cb(getPwaState());
  return () => listeners.delete(cb);
}

export async function triggerPwaInstall() {
  if (!deferredPrompt) return { outcome: 'unavailable' };
  try {
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult?.outcome === 'accepted') {
      deferredPrompt = null;
      installed = true;
    }
    notify();
    return choiceResult || { outcome: 'dismissed' };
  } catch (err) {
    return { outcome: 'error', error: err };
  }
}
