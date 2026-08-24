# Chromium Customizer

A Manifest V3 Chromium extension for per-site CSS/JS injection, with a Monaco-powered options UI and a DevTools-style live editor injected directly into any page.

## Features

- **Per-hostname rules** with wildcard fallback (`*`) applied to every site without a specific rule
- **Monaco Editor** (the VS Code editor) in the options page for CSS/JS with syntax highlighting and bracket matching
- **Live DevTools-style editor** injected into any page via `Ctrl+Shift+E` (or the popup button) \u2014 write CSS live, run JS on demand, save straight to that domain's rule
- **Debounced auto-save** to `chrome.storage.sync`, synced across your signed-in Chrome profiles
- **Import/export** all rules as JSON
- **Background service worker** injects CSS at `document_start` to avoid flash-of-unstyled-content
- **Content script** injects saved JS at `DOMContentLoaded`
- **Popup** shows the active rule status for the current tab with a one-click enable/disable toggle
- **CI + automated releases** via GitHub Actions \u2014 push a `vX.Y.Z` tag and get a packaged `.zip` attached to a GitHub Release

## Quick Start

```bash
git clone https://github.com/Zator98/chromium-customizer.git
cd chromium-customizer
npm install

# Monaco editor assets must be copied locally (not committed to git)
mkdir -p public/monaco/min
cp -r node_modules/monaco-editor/min/vs public/monaco/min/vs

# Development (HMR for options page, popup, background)
npm run dev
# in a second terminal:
npm run web-ext:dev
```

## Production Build

```bash
npm run build
# output in dist/ -- load as an unpacked extension, or:
npm run web-ext:build
# produces a .zip in web-ext-artifacts/
```

## Load Unpacked in Chrome

1. `npm run build`
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** \u2192 select the `dist/` folder

## Project Structure

```
src/
├── background/     # Service worker — injects CSS per active tab, handles messaging
├── content/        # Content script — runs saved JS, hosts the live DevTools-style editor
├── options/        # React + Monaco options page
│   ├── components/
│   ├── hooks/
│   └── utils/
├── popup/          # React popup — quick per-site toggle + live editor launcher
└── shared/         # Types and default rules shared across all entry points
```

## Usage

### Options Page (full editor)
1. Right-click the extension icon \u2192 **Options**
2. Click **+ New Rule** or select an existing hostname from the list
3. Write CSS/JS in the Monaco editors \u2014 changes auto-save after a short debounce
4. Visit the site: CSS is injected at `document_start`, JS at `DOMContentLoaded`

### Live Editor (in-page, DevTools-style)
1. Press **`Ctrl+Shift+E`** (or **`Cmd+Ctrl+Shift+E`** on Mac) on any page, or click **Open Live Editor on Page** in the popup
2. A draggable, resizable panel appears in the bottom-right with CSS/JS tabs
3. CSS applies live as you type; click **Run JS** to execute JavaScript immediately
4. Click **Save for this domain** to persist the CSS into that domain's rule

### Popup
- Shows whether the current site has an active rule, and whether it includes CSS/JS
- One click to enable/disable the rule for the current site (triggers a reload)

## CI/CD

Two GitHub Actions workflows are included:

- **`.github/workflows/ci.yml`** \u2014 runs on every push/PR to `main`: type-checks and builds the extension
- **`.github/workflows/release.yml`** \u2014 runs on any `vX.Y.Z` tag push: builds, packages with `web-ext`, and publishes a GitHub Release with the `.zip` attached

To cut a release:
```bash
npm version patch   # or minor / major
git push --follow-tags
```

## Notes on Monaco Editor Assets

Monaco's `vs` loader files are large binary/JS assets and are intentionally **not committed** to this repository. Both the CI and release workflows copy them from `node_modules/monaco-editor` during the build step, and local development requires the same manual copy (see Quick Start above).

## License

MIT
