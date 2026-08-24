import { useState, useEffect, useRef } from 'react';
import { MonacoEditor } from './MonacoEditor';
import { SiteRule } from '@shared/types';
import { DEBOUNCE_MS } from '@shared/constants';

interface RuleEditorProps {
  hostname: string;
  rule: SiteRule;
  onSave: (hostname: string, rule: Partial<SiteRule>) => void;
  onDelete: () => void;
  isDefault?: boolean;
}

export function RuleEditor({ hostname, rule, onSave, onDelete, isDefault }: RuleEditorProps) {
  const [css, setCss] = useState(rule.css || '');
  const [js, setJs] = useState(rule.js || '');
  const [saved, setSaved] = useState(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setCss(rule.css || '');
    setJs(rule.js || '');
  }, [hostname]);

  const debouncedSave = (field: 'css' | 'js', value: string) => {
    setSaved(false);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      onSave(hostname, { [field]: value });
      setSaved(true);
    }, DEBOUNCE_MS);
  };

  const handleCssChange = (value: string) => {
    setCss(value);
    debouncedSave('css', value);
  };

  const handleJsChange = (value: string) => {
    setJs(value);
    debouncedSave('js', value);
  };

  const handleToggle = () => {
    onSave(hostname, { enabled: !rule.enabled });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', overflow: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input type="checkbox" checked={rule.enabled} onChange={handleToggle} />
            <span style={{ fontWeight: 500 }}>{hostname === '*' ? 'Global (fallback)' : hostname}</span>
            {isDefault && <span style={{ fontSize: '11px', padding: '2px 6px', background: '#0e639c', borderRadius: '4px', color: 'white' }}>Default</span>}
          </label>
        </div>
        {!isDefault && (
          <button onClick={onDelete} style={{ padding: '6px 12px', background: '#da3633', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Delete Rule
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: '#8b949e' }}>CSS</label>
          <MonacoEditor value={css} onChange={handleCssChange} language="css" height="320px" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: '#8b949e' }}>JavaScript</label>
          <MonacoEditor value={js} onChange={handleJsChange} language="javascript" height="320px" />
        </div>
      </div>
      {!saved && <span style={{ fontSize: '11px', color: '#f85149' }}>Saving\u2026</span>}
    </div>
  );
}
