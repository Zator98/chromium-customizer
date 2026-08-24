import browser from 'webextension-polyfill';

let active = false;
let overlay: HTMLDivElement | null = null;
let toolbar: HTMLDivElement | null = null;
let hoveredEl: Element | null = null;
let selectedEl: HTMLElement | null = null;
let pickerStyleEl: HTMLStyleElement | null = null;
let resizing = false;
let moving = false;
let dragStartX = 0;
let dragStartY = 0;
let elStartRect: DOMRect | null = null;

function getHostname(): string {
  return location.hostname.replace(/^www\./, '');
}

function ensurePickerStyle() {
  if (!pickerStyleEl) {
    pickerStyleEl = document.createElement('style');
    pickerStyleEl.id = '__customizer_picker_generated_css';
    document.documentElement.appendChild(pickerStyleEl);
  }
  return pickerStyleEl;
}

function cssEscape(value: string): string {
  return value.replace(/([^\w-])/g, '\\$1');
}

function generateSelector(el: Element): string {
  if (el.id) return `#${cssEscape(el.id)}`;

  const path: string[] = [];
  let current: Element | null = el;
  let depth = 0;

  while (current && current !== document.documentElement && depth < 6) {
    let segment = current.tagName.toLowerCase();

    const classList = Array.from(current.classList).filter(
      (c) => !c.startsWith('__customizer') && c.length > 0 && !/^\d/.test(c)
    );
    if (classList.length > 0) {
      segment += '.' + classList.slice(0, 2).map(cssEscape).join('.');
    }

    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter((c) => c.tagName === current!.tagName);
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        segment += `:nth-of-type(${index})`;
      }
    }

    path.unshift(segment);

    if (current.id || classList.length > 0) break;

    current = current.parentElement;
    depth++;
  }

  return path.join(' > ');
}

function highlightElement(el: Element) {
  if (!overlay) return;
  const rect = el.getBoundingClientRect();
  overlay.style.display = 'block';
  overlay.style.top = `${rect.top + window.scrollY}px`;
  overlay.style.left = `${rect.left + window.scrollX}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;
}

function hideOverlay() {
  if (overlay) overlay.style.display = 'none';
}

function onMouseMove(e: MouseEvent) {
  if (!active || selectedEl) return;
  const el = document.elementFromPoint(e.clientX, e.clientY);
  if (!el || el === hoveredEl || isPickerUI(el)) return;
  hoveredEl = el;
  highlightElement(el);
}

function isPickerUI(el: Element | null): boolean {
  if (!el) return false;
  return !!el.closest('#__customizer_picker_overlay, #__customizer_picker_toolbar');
}

function onClick(e: MouseEvent) {
  if (!active) return;
  const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
  if (!el || isPickerUI(el)) return;

  e.preventDefault();
  e.stopPropagation();

  selectElement(el);
}

function selectElement(el: HTMLElement) {
  selectedEl = el;
  highlightElement(el);
  showToolbar(el);
}

function showToolbar(el: HTMLElement) {
  removeToolbar();

  const rect = el.getBoundingClientRect();
  const selector = generateSelector(el);

  toolbar = document.createElement('div');
  toolbar.id = '__customizer_picker_toolbar';
  toolbar.style.cssText = `
    position: fixed; z-index: 2147483647; background: #1e1e1e; color: #d4d4d4;
    border: 1px solid #444; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    font-family: 'JetBrains Mono', Menlo, monospace; font-size: 11px; padding: 10px;
    display: flex; flex-direction: column; gap: 8px; min-width: 260px;
  `;

  const top = Math.min(window.innerHeight - 220, Math.max(8, rect.top + window.scrollY - 8));
  const left = Math.min(window.innerWidth - 280, Math.max(8, rect.left + window.scrollX));
  toolbar.style.top = `${rect.bottom + window.scrollY + 8 > window.innerHeight + window.scrollY - 220 ? rect.top + window.scrollY - 228 : rect.bottom + window.scrollY + 8}px`;
  toolbar.style.left = `${left}px`;

  const label = document.createElement('div');
  label.style.cssText = 'font-weight:600; color:#58a6ff; word-break:break-all; max-height:40px; overflow:auto;';
  label.textContent = selector;
  toolbar.appendChild(label);

  const row1 = document.createElement('div');
  row1.style.cssText = 'display:flex; gap:6px;';

  const hideBtn = makeBtn('Hide (display:none)', '#8957e5');
  hideBtn.onclick = () => applyStyle(selector, 'display', 'none !important');

  const removeBtn = makeBtn('Remove from DOM', '#da3633');
  removeBtn.onclick = () => { el.remove(); removeToolbar(); hideOverlay(); selectedEl = null; };

  row1.appendChild(hideBtn);
  row1.appendChild(removeBtn);
  toolbar.appendChild(row1);

  const sizeRow = document.createElement('div');
  sizeRow.style.cssText = 'display:flex; gap:6px; align-items:center;';
  const widthInput = makeNumberInput('W', Math.round(rect.width));
  const heightInput = makeNumberInput('H', Math.round(rect.height));
  sizeRow.appendChild(widthInput.wrapper);
  sizeRow.appendChild(heightInput.wrapper);
  const applySizeBtn = makeBtn('Apply Size', '#238636');
  applySizeBtn.onclick = () => {
    applyStyle(selector, 'width', `${widthInput.input.value}px !important`);
    applyStyle(selector, 'height', `${heightInput.input.value}px !important`);
  };
  sizeRow.appendChild(applySizeBtn);
  toolbar.appendChild(sizeRow);

  const posRow = document.createElement('div');
  posRow.style.cssText = 'display:flex; gap:6px; align-items:center;';
  const xInput = makeNumberInput('X', 0);
  const yInput = makeNumberInput('Y', 0);
  posRow.appendChild(xInput.wrapper);
  posRow.appendChild(yInput.wrapper);
  const applyPosBtn = makeBtn('Nudge (relative)', '#0e639c');
  applyPosBtn.onclick = () => {
    applyStyle(selector, 'position', 'relative !important');
    applyStyle(selector, 'left', `${xInput.input.value}px !important`);
    applyStyle(selector, 'top', `${yInput.input.value}px !important`);
  };
  posRow.appendChild(applyPosBtn);
  toolbar.appendChild(posRow);

  const footer = document.createElement('div');
  footer.style.cssText = 'display:flex; gap:6px; justify-content:space-between; margin-top:2px;';

  const saveBtn = makeBtn('\u{1F4BE} Save to domain rule', '#3fb950');
  saveBtn.style.flex = '1';
  saveBtn.onclick = () => saveGeneratedCss();

  const closeBtn = makeBtn('Deselect', '#30363d');
  closeBtn.onclick = () => { removeToolbar(); hideOverlay(); selectedEl = null; };

  footer.appendChild(saveBtn);
  footer.appendChild(closeBtn);
  toolbar.appendChild(footer);

  document.documentElement.appendChild(toolbar);
}

function makeBtn(text: string, bg: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.textContent = text;
  btn.style.cssText = `padding:5px 8px; background:${bg}; color:#fff; border:none; border-radius:4px; cursor:pointer; font-family:inherit; font-size:10px; flex:1;`;
  return btn;
}

function makeNumberInput(labelText: string, value: number): { wrapper: HTMLDivElement; input: HTMLInputElement } {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display:flex; align-items:center; gap:4px;';
  const label = document.createElement('span');
  label.textContent = labelText;
  label.style.cssText = 'color:#8b949e; width:12px;';
  const input = document.createElement('input');
  input.type = 'number';
  input.value = String(value);
  input.style.cssText = 'width:56px; background:#0d1117; color:#d4d4d4; border:1px solid #333; border-radius:4px; padding:3px 4px; font-family:inherit; font-size:10px;';
  wrapper.appendChild(label);
  wrapper.appendChild(input);
  return { wrapper, input };
}

const generatedRules: string[] = [];

function applyStyle(selector: string, prop: string, value: string) {
  const rule = `${selector} { ${prop}: ${value}; }`;
  generatedRules.push(rule);
  const styleEl = ensurePickerStyle();
  styleEl.textContent = (styleEl.textContent || '') + '\n' + rule;
}

function saveGeneratedCss() {
  if (generatedRules.length === 0) return;
  const hostname = getHostname();
  const css = generatedRules.join('\n');
  browser.runtime.sendMessage({ type: 'APPEND_LIVE_CSS', hostname, css }).then(() => {
    const btn = toolbar?.querySelector('button');
    if (btn) {
      const original = btn.textContent;
      btn.textContent = 'Saved \u2713';
      setTimeout(() => { if (btn) btn.textContent = original; }, 1200);
    }
  });
}

function removeToolbar() {
  toolbar?.remove();
  toolbar = null;
}

function createOverlay() {
  overlay = document.createElement('div');
  overlay.id = '__customizer_picker_overlay';
  overlay.style.cssText = `
    position: absolute; z-index: 2147483646; pointer-events: none;
    background: rgba(88, 166, 255, 0.15); border: 2px solid #58a6ff;
    display: none; box-sizing: border-box; border-radius: 2px;
  `;
  document.documentElement.appendChild(overlay);
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && active) {
    stopPicker();
  }
}

export function startPicker() {
  if (active) return;
  active = true;
  selectedEl = null;
  generatedRules.length = 0;
  if (!overlay) createOverlay();
  document.addEventListener('mousemove', onMouseMove, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKeyDown, true);
  document.body.style.cursor = 'crosshair';
}

export function stopPicker() {
  active = false;
  hoveredEl = null;
  selectedEl = null;
  hideOverlay();
  removeToolbar();
  document.removeEventListener('mousemove', onMouseMove, true);
  document.removeEventListener('click', onClick, true);
  document.removeEventListener('keydown', onKeyDown, true);
  document.body.style.cursor = '';
}

export function togglePicker() {
  if (active) stopPicker();
  else startPicker();
}

export function isPickerActive(): boolean {
  return active;
}
