import { useState, useEffect } from 'react';
import { RuleList } from './components/RuleList';
import { RuleEditor } from './components/RuleEditor';
import { Header } from './components/Header';
import { ToastContainer } from './components/Toast';
import { useRules } from './hooks/useRules';
import { useToast } from './hooks/useToast';
import { SiteRule } from '@shared/types';
import './styles/global.css';

export function App() {
  const { rules, loading, updateRule, deleteRule } = useRules();
  const { toasts, show, dismiss } = useToast();
  const [activeHostname, setActiveHostname] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !activeHostname) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const url = tabs[0]?.url;
        if (url) {
          try {
            const hostname = new URL(url).hostname.replace(/^www\./, '');
            setActiveHostname(rules[hostname] ? hostname : '*');
          } catch {
            setActiveHostname('*');
          }
        } else {
          setActiveHostname('*');
        }
      });
    }
  }, [loading, rules, activeHostname]);

  const handleSelect = (hostname: string) => setActiveHostname(hostname);

  const handleUpdate = (hostname: string, rule: Partial<SiteRule>) => {
    updateRule(hostname, rule);
    show('Saved', 'success');
  };

  const handleDelete = (hostname: string) => {
    if (confirm(`Delete rule for ${hostname}?`)) {
      deleteRule(hostname);
      if (activeHostname === hostname) setActiveHostname('*');
      show('Rule deleted', 'success');
    }
  };

  const handleNewRule = () => {
    const hostname = prompt('Enter hostname (e.g., example.com):')?.toLowerCase().replace(/^www\./, '');
    if (hostname && !rules[hostname]) {
      updateRule(hostname, { css: '', js: '', enabled: true, updatedAt: Date.now() });
      setActiveHostname(hostname);
    }
  };

  const activeRule = activeHostname ? rules[activeHostname] : null;

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#8b949e', background: '#0d1117' }}>Loading\u2026</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0d1117', color: '#e6edf3' }}>
      <Header onNewRule={handleNewRule} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <RuleList
          rules={rules}
          activeHostname={activeHostname}
          onSelect={handleSelect}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
        <div style={{ flex: 2, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          {activeRule && activeHostname ? (
            <RuleEditor
              hostname={activeHostname}
              rule={activeRule}
              onSave={handleUpdate}
              onDelete={() => handleDelete(activeHostname)}
              isDefault={activeHostname === '*'}
            />
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b949e' }}>
              Select a rule to edit
            </div>
          )}
        </div>
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
