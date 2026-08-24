import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json';

export default defineManifest({
  manifest_version: 3,
  name: 'Chromium Customizer',
  version: pkg.version,
  description: 'Per-site CSS/JS injection with Monaco editor and live DevTools-style editor',
  icons: {
    '16': 'icon16.png',
    '48': 'icon48.png',
    '128': 'icon128.png',
  },
  permissions: ['storage', 'scripting', 'activeTab', 'commands'],
  host_permissions: ['<all_urls>'],
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/index.ts'],
      run_at: 'document_start',
      all_frames: false,
      match_about_blank: false,
    },
  ],
  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'Chromium Customizer',
    default_icon: {
      '16': 'icon16.png',
      '48': 'icon48.png',
      '128': 'icon128.png',
    },
  },
  options_page: 'src/options/index.html',
  commands: {
    'open-live-editor': {
      suggested_key: { default: 'Ctrl+Shift+E', mac: 'MacCtrl+Shift+E' },
      description: 'Open live CSS/JS editor on current page',
    },
  },
  web_accessible_resources: [
    {
      resources: ['monaco/**/*'],
      matches: ['<all_urls>'],
    },
  ],
});
