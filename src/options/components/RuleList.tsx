import { useState } from 'react';
import { RulesMap, SiteRule } from '@shared/types';
import { saveRules, resetRules } from '@options/utils/storage';

interface RuleListProps {
  rules: RulesMap;
  activeHostname: string | null;
  onSelect: (hostname: string) => void;
  onUpdate: (hostname: string, rule: Partial<SiteRule>) => void;
  onDelete: (hostname: string) => void;
}

export function RuleList({ rules, activeHostname, onSelect, onUpdate, onDelete }: RuleListProps) {
  const [newHostname, setNewHostname] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState('');

  const hostnames = Object.keys(rules).sort((a, b) => (a === '*' ? -1 : b === '*' ? 1 : a.localeCompare(b)));

  const handleAdd = () => {
    const hn = newHostname.trim().toLowerCase().replace(/^www\./, '');
    if (!hn || rules[hn]) return;
    onUpdate(hn, { css: '', js: '', enabled: true, updatedAt: Date.now() });
    onSelect(hn);
    setNewHostname('');
  };

  const handleImport = async () => {
    try {
      const parsed = JSON.parse(importJson);
      if (typeof parsed === 'object' && parsed !== null) {
        const merged = { ...rules, ...parsed };
        await saveRules(merged);
        setShowImport(false);
        setImportJson('');
      }
    } catch {
      alert('Invalid JSON');
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(rules, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chromium-customizer-rules-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = async () => {
    if (confirm('Reset all rules to defaults?')) {
      await resetRules();
      window.location.reload();
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, borderRight: '1px solid #30363d' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #30363d', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          value={newHostname}
          onChange={(e) => setNewHostname(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add hostname"
          style={{ flex: 1, minWidth: '140px', padding: '6px 10px', background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', color: '#e6edf3', fontSize: '13px' }}
        />
        <button onClick={handleAdd} style={{ padding: '6px 12px', background: '#238636', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Add</button>
      </div>

      <div style={{ padding: '8px 16px', borderBottom: '1px solid #30363d', display: 'flex', gap: '8px' }}>
        <button onClick={() => setShowImport((s) => !s)} style={{ flex: 1, padding: '6px 10px', background: '#30363d', color: '#e6edf3', border: '1px solid #30363d', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Import</button>
        <button onClick={handleExport} style={{ flex: 1, padding: '6px 10px', background: '#30363d', color: '#e6edf3', border: '1px solid #30363d', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Export</button>
        <button onClick={handleReset} style={{ flex: 1, padding: '6px 10px', background: '#da3633', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Reset</button>
      </div>

      {showImport && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #30363d' }}>
          <textarea
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            placeholder="Paste JSON rules here..."
            style={{ width: '100%', height: '90px', padding: '8px', background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', color: '#e6edf3', fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowImport(false)} style={{ padding: '6px 12px', background: '#30363d', color: '#e6edf3', border: '1px solid #30363d', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleImport} style={{ padding: '6px 12px', background: '#238636', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Import</button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto' }}>
        {hostnames.map((hn) => (
          <div
            key={hn}
            onClick={() => onSelect(hn)}
            style={{
              padding: '10px 16px',
              borderBottom: '1px solid #21262d',
              background: activeHostname === hn ? '#1f2937' : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: rules[hn].enabled ? '#3fb950' : '#8b949e', flexShrink: 0 }} />
            <span style={{ fontSize: '13px', fontWeight: 500, color: activeHostname === hn ? '#f0f6fc' : '#e6edf3', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {hn === '*' ? 'Global (fallback)' : hn}
            </span>
            {rules[hn].css && <span style={{ fontSize: '10px', padding: '1px 5px', background: '#0e639c', borderRadius: '3px', color: 'white' }}>CSS</span>}
            {rules[hn].js && <span style={{ fontSize: '10px', padding: '1px 5px', background: '#f78166', borderRadius: '3px', color: '#161b22' }}>JS</span>}
            {hn !== '*' && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(hn); }}
                style={{ padding: '2px 6px', fontSize: '11px', background: 'transparent', color: '#f85149', border: '1px solid #30363d', borderRadius: '4px', cursor: 'pointer' }}
              >
                \u00d7
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
