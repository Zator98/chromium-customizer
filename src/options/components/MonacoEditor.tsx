import { useEffect, useRef, useCallback } from 'react';
import { loadMonaco } from '@options/utils/monaco';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: 'css' | 'javascript';
  height?: string;
  theme?: string;
  readOnly?: boolean;
}

export function MonacoEditor({ value, onChange, language, height = '300px', theme = 'vs-dark', readOnly = false }: MonacoEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    mountedRef.current = true;

    const init = async () => {
      if (!containerRef.current) return;
      await loadMonaco();
      if (!mounted) return;

      const monaco = window.monaco;
      if (!monaco) return;

      const editor = monaco.editor.create(containerRef.current, {
        value,
        language,
        theme,
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 13,
        lineNumbers: 'on',
        renderLineHighlight: 'all',
        bracketPairColorization: { enabled: true },
        guides: { bracketPairs: true },
        tabSize: 2,
        insertSpaces: true,
        readOnly,
        wordWrap: 'on',
      });

      editorRef.current = editor;

      editor.onDidChangeModelContent(() => {
        if (mountedRef.current) {
          onChange(editor.getValue());
        }
      });
    };

    init();

    return () => {
      mounted = false;
      mountedRef.current = false;
      editorRef.current?.dispose();
      editorRef.current = null;
    };
  }, [language, theme, readOnly]);

  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== value) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  const focus = useCallback(() => {
    editorRef.current?.focus();
  }, []);

  return <div ref={containerRef} style={{ height, width: '100%', borderRadius: '6px', border: '1px solid #333', overflow: 'hidden' }} tabIndex={0} onClick={focus} />;
}

declare global {
  interface Window {
    monaco: any;
    require: any;
  }
}
