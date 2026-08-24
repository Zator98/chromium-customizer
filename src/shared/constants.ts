import { RulesMap } from './types';

export const STORAGE_KEY = 'site_customizer_rules';

export const DEFAULT_RULES: RulesMap = {
  '*': {
    css: `@media (prefers-color-scheme: dark) {
  html:not([data-theme="dark"]):not(.dark):not([theme="dark"]) {
    filter: invert(1) hue-rotate(180deg);
    background: #0d1117 !important;
  }
  img, video, iframe, picture, canvas, svg, [style*="background-image"] {
    filter: invert(1) hue-rotate(180deg) !important;
  }
}`,
    enabled: true,
    updatedAt: Date.now(),
  },
  'github.com': {
    css: `header { backdrop-filter: saturate(180%) blur(12px); background: rgba(13,17,23,0.85) !important; position: sticky; top: 0; z-index: 100; }
.Box { border-radius: 8px !important; }
.file-tree-entry { padding: 2px 8px !important; }`,
    enabled: true,
    updatedAt: Date.now(),
  },
  'youtube.com': {
    css: `ytd-rich-section-renderer:has(ytd-reel-shelf-renderer),
ytd-reel-shelf-renderer,
ytd-guide-entry-renderer[title="Shorts"],
ytd-mini-guide-entry-renderer[title="Shorts"] { display: none !important; }
ytd-app[theater] #primary { max-width: 100% !important; }`,
    enabled: true,
    updatedAt: Date.now(),
  },
};

export const MONACO_THEME = 'vs-dark';
export const DEBOUNCE_MS = 300;
