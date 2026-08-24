import browser from 'webextension-polyfill';
import { togglePicker } from './elementPicker';

interface SiteRule {
  css?: string;
  js?: string;
  enabled: boolean;
}

function getHostname(): string {
  return location.hostname.replace(/^www\./, '');
}

function runJs(code: string) {
  try {
    const script = document.createElement('script');
    script.textContent = `(function(){ ${code} })();`;
    document.documentElement.appendChild(script);
    script.remove();
  } catch (e) {
    console.error('[Customizer] JS injection error:', e);
  }
}

function applyStoredRule() {
  browser.runtime.sendMessage({ type: 'GET_RULE', url: location.href }).then((rule: SiteRule | null) => {
    if (rule?.js && rule.enabled) runJs(rule.js);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyStoredRule, { once: true });
} else {
  applyStoredRule();
}

// ==== Live DevTools-style CSS/JS editor, injected on demand ====
let livePanel: HTMLDivElement | null = null;
let liveStyleEl: HTMLStyleElement | null = null;

function toggleLiveEditor() {
  if (livePanel) {
    livePanel.remove();
    livePanel = null;
    return;
  }
  createLiveEditor();
}

function createLiveEditor() {
  const hostname = getHostname();

  livePanel = document.createElement('div');
  livePanel.id = '__customizer_live_panel';
  livePanel.style.cssText = `
    position: fixed; bottom: 0; right: 0; width: 440px; height: 46vh; min-width: 320px; min-height: 220px;
    background: #1e1e1e; color: #d4d4d4; border: 1px solid #333;
    border-radius: 8px 8px 0 0; box-shadow: 0 -4px 24px rgba(0,0,0,0.5);
    z-index: 2147483647; font-family: 'JetBrains Mono', 'Fira Code', Menlo, monospace;
    font-size: 12px; display: flex; flex-direction: column; resize: both; overflow: hidden;
  `;

  const header = document.createElement('div');
  header.id = '__customizer_live_header';
  header.style.cssText = `
    display:flex; justify-content:space-between; align-items:center;
    padding:8px 12px; background:#252526; border-bottom:1px solid #333;
    cursor:move; user-select:none;
  `;
  header.innerHTML = `<strong style="font-size:12px;">\u{1F3A8} Live Editor \u2014 ${hostname}</strong>`;

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '\u2715';
  closeBtn.style.cssText = 'background:none;border:none;color:#aaa;cursor:pointer;font-size:15px;line-height:1;';
  closeBtn.onclick = () => { livePanel?.remove(); livePanel = null; };
  header.appendChild(closeBtn);

  const tabs = document.createElement('div');
  tabs.style.cssText = 'display:flex; border-bottom:1px solid #333; background:#252526;';
  const cssTabBtn = document.createElement('button');
  cssTabBtn.textContent = 'CSS';
  const jsTabBtn = document.createElement('button');
  jsTabBtn.textContent = 'JS';
  [cssTabBtn, jsTabBtn].forEach((b) => {
    b.style.cssText = 'flex:1; padding:6px; background:#1e1e1e; color:#ccc; border:none; cursor:pointer; font-family:inherit; font-size:11px;';
  });
  cssTabBtn.style.background = '#0e639c';
  cssTabBtn.style.color = '#fff';
  tabs.appendChild(cssTabBtn);
  tabs.appendChild(jsTabBtn);

  const cssTa = document.createElement('textarea');
  const jsTa = document.createElement('textarea');
  [cssTa, jsTa].forEach((ta) => {
    ta.style.cssText = 'flex:1; background:#1e1e1e; color:#d4d4d4; border:none; outline:none; padding:12px; resize:none; font:inherit; line-height:1.5; width:100%;';
  });
  cssTa.placeholder = '/* Write CSS here, applies live. Use the Element Picker (Ctrl+Shift+X) to auto-generate rules. */';
  jsTa.placeholder = '// Write JS here, click Run to execute';
  jsTa.style.display = 'none';

  cssTabBtn.onclick = () => {
    cssTa.style.display = 'block';
    jsTa.style.display = 'none';
    cssTabBtn.style.background = '#0e639c';
    cssTabBtn.style.color = '#fff';
    jsTabBtn.style.background = '#1e1e1e';
    jsTabBtn.style.color = '#ccc';
  };
  jsTabBtn.onclick = () => {
    jsTa.style.display = 'block';
    cssTa.style.display = 'none';
    jsTabBtn.style.background = '#0e639c';
    jsTabBtn.style.color = '#fff';
    cssTabBtn.style.background = '#1e1e1e';
    cssTabBtn.style.color = '#ccc';
  };

  const body = document.createElement('div');
  body.style.cssText = 'flex:1; display:flex; overflow:hidden;';
  body.appendChild(cssTa);
  body.appendChild(jsTa);

  const footer = document.createElement('div');
  footer.style.cssText = 'padding:8px; border-top:1px solid #333; display:flex; gap:8px; justify-content:flex-end; background:#252526;';

  const pickerBtn = document.createElement('button');
  pickerBtn.textContent = '\u{1F3AF} Element Picker';
  pickerBtn.style.cssText = 'padding:6px 12px; background:#8957e5; color:#fff; border:none; border-radius:4px; cursor:pointer; font-family:inherit;';
  pickerBtn.onclick = () => togglePicker();

  const runBtn = document.createElement('button');
  runBtn.textContent = 'Run JS';
  runBtn.style.cssText = 'padding:6px 12px; background:#f78166; color:#161b22; border:none; border-radius:4px; cursor:pointer; font-family:inherit;';
  runBtn.onclick = () => runJs(jsTa.value);

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save for this domain';
  saveBtn.style.cssText = 'padding:6px 12px; background:#238636; color:#fff; border:none; border-radius:4px; cursor:pointer; font-family:inherit;';
  saveBtn.onclick = () => {
    browser.runtime.sendMessage({ type: 'SAVE_LIVE_CSS', hostname, css: cssTa.value }).then(() => {
      saveBtn.textContent = 'Saved \u2713';
      setTimeout(() => (saveBtn.textContent = 'Save for this domain'), 1500);
    });
  };

  const clearBtn = document.createElement('button');
  clearBtn.textContent = 'Clear';
  clearBtn.style.cssText = 'padding:6px 12px; background:#333; color:#ccc; border:none; border-radius:4px; cursor:pointer; font-family:inherit;';
  clearBtn.onclick = () => {
    cssTa.value = '';
    if (liveStyleEl) liveStyleEl.textContent = '';
  };

  footer.appendChild(clearBtn);
  footer.appendChild(pickerBtn);
  footer.appendChild(runBtn);
  footer.appendChild(saveBtn);

  livePanel.appendChild(header);
  livePanel.appendChild(tabs);
  livePanel.appendChild(body);
  livePanel.appendChild(footer);
  document.documentElement.appendChild(livePanel);

  if (!liveStyleEl) {
    liveStyleEl = document.createElement('style');
    liveStyleEl.id = '__customizer_live_style';
    document.documentElement.appendChild(liveStyleEl);
  }

  let debounceTimer: ReturnType<typeof setTimeout>;
  cssTa.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (liveStyleEl) liveStyleEl.textContent = cssTa.value;
    }, 150);
  });

  browser.runtime.sendMessage({ type: 'GET_RULE', url: location.href }).then((rule: SiteRule | null) => {
    if (rule?.css) {
      cssTa.value = rule.css;
      if (liveStyleEl) liveStyleEl.textContent = rule.css;
    }
  });

  browser.runtime.onMessage.addListener((message: { type?: string; css?: string }) => {
    if (message?.type === 'CSS_APPENDED' && livePanel) {
      cssTa.value = (cssTa.value ? cssTa.value + '\n' : '') + (message.css || '');
      if (liveStyleEl) liveStyleEl.textContent = cssTa.value;
    }
  });

  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;
  header.addEventListener('mousedown', (e) => {
    dragging = true;
    offsetX = e.clientX - (livePanel?.offsetLeft ?? 0);
    offsetY = e.clientY - (livePanel?.offsetTop ?? 0);
  });
  document.addEventListener('mousemove', (e) => {
    if (dragging && livePanel) {
      livePanel.style.left = `${e.clientX - offsetX}px`;
      livePanel.style.top = `${e.clientY - offsetY}px`;
      livePanel.style.right = 'auto';
      livePanel.style.bottom = 'auto';
    }
  });
  document.addEventListener('mouseup', () => { dragging = false; });
}

browser.runtime.onMessage.addListener((message: { type?: string }) => {
  if (message?.type === 'OPEN_LIVE_EDITOR') {
    toggleLiveEditor();
  }
  if (message?.type === 'OPEN_ELEMENT_PICKER') {
    togglePicker();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === 'E') {
    toggleLiveEditor();
  }
  if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === 'X') {
    togglePicker();
  }
});
