let monacoLoaded = false;
let loadPromise: Promise<void> | null = null;

declare global {
  interface Window {
    monaco: any;
    require: any;
  }
}

export async function loadMonaco(): Promise<void> {
  if (monacoLoaded) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const vsLoaderUrl = chrome.runtime.getURL('monaco/min/vs/loader.js');
    await loadScript(vsLoaderUrl);

    return new Promise<void>((resolve, reject) => {
      window.require.config({ paths: { vs: chrome.runtime.getURL('monaco/min/vs') } });
      window.require(['vs/editor/editor.main'], () => {
        monacoLoaded = true;
        resolve();
      }, reject);
    });
  })();

  return loadPromise;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export function isMonacoLoaded(): boolean {
  return monacoLoaded;
}
