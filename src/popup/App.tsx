import { useState, useEffect } from 'react';
import { getRules, matchRule } from '@options/utils/storage';
import { DEFAULT_RULES } from '@shared/constants';
import { RulesMap } from '@shared/types';
import './styles.css';

export function App() {
  const [rules, setRules] = useState<RulesMap>(DEFAULT_RULES);
  const [activeRule, setActiveRule] = useState<{ hostname: string; enabled: boolean; hasCss: boolean; hasJs: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRules().then((r) => {
      setRules(r);
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const url = tabs[0]?.url;
        if (url) {
          try {
            const hostname = new URL(url).hostname.replace(/^www\./, '');
            const key = matchRule(r, hostname);
            if (key) setActiveRule({ hostname: key, enabled: r[key].enabled, hasCss: !!r[key].css, hasJs: !!r[key].js });
          } catch {}
        }
        setLoading(false);
      });
    });
  }, []);

  const toggle = async () => {
    if (!activeRule) return;
    const newRules = { ...rules, [activeRule.hostname]: { ...rules[activeRule.hostname], enabled: !activeRule.enabled } };
    setRules(newRules);
    await chrome.storage.sync.set({ site_customizer_rules: newRules });
    setActiveRule({ ...activeRule, enabled: !activeRule.enabled });
    chrome.tabs.reload();
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  const openLiveEditor = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'OPEN_LIVE_EDITOR' });
        window.close();
      }
    });
  };

  if (loading) return <div className="loading">Loading\u2026</div>;

  return (
    <div className="popup">
      <header>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9M15 21V9"/></svg>
        <span>Chromium Customizer</span>
      </header>
      {activeRule && (
        <div className="status">
          <div className="status-item">
            <span className={`dot ${activeRule.enabled ? 'on' : 'off'}`} />
            <span>{activeRule.enabled ? 'Active' : 'Disabled'}</span>
          </div>
          <div className="status-item">
            <span className="dot" style={{ background: activeRule.hasCss ? '#0e639c' : '#30363d' }} />
            <span>{activeRule.hasCss ? 'CSS \u2713' : 'CSS \u2014'}</span>
          </div>
          <div className="status-item">
            <span className="dot" style={{ background: activeRule.hasJs ? '#f78166' : '#30363d' }} />
            <span>{activeRule.hasJs ? 'JS \u2713' : 'JS \u2014'}</span>
          </div>
        </div>
      )}
      <div className="actions">
        <button onClick={openLiveEditor} className="secondary">Open Live Editor on Page</button>
        <button onClick={toggle} className={activeRule?.enabled ? 'primary' : 'secondary'}>
          {activeRule?.enabled ? 'Disable' : 'Enable'} for this site
        </button>
        <button onClick={openOptions}>Open Options</button>
      </div>
      <footer>
        <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd> to open live editor on page
      </footer>
    </div>
  );
}
