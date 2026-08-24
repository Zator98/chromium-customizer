import { useState, useEffect, useCallback } from 'react';
import { getRules, saveRules, resetRules, matchRule } from '@options/utils/storage';
import { RulesMap, SiteRule } from '@shared/types';
import { DEFAULT_RULES } from '@shared/constants';

export function useRules() {
  const [rules, setRules] = useState<RulesMap>(DEFAULT_RULES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRules().then((r) => {
      setRules(r);
      setLoading(false);
    });
  }, []);

  const updateRule = useCallback(async (hostname: string, rule: Partial<SiteRule>) => {
    setRules((prev) => {
      const next = { ...prev, [hostname]: { ...prev[hostname], ...rule, updatedAt: Date.now() } as SiteRule };
      saveRules(next);
      return next;
    });
  }, []);

  const deleteRule = useCallback(async (hostname: string) => {
    if (hostname === '*') return;
    setRules((prev) => {
      const next = { ...prev };
      delete next[hostname];
      saveRules(next);
      return next;
    });
  }, []);

  const toggleRule = useCallback(async (hostname: string) => {
    setRules((prev) => {
      const rule = prev[hostname];
      if (!rule) return prev;
      const next = { ...prev, [hostname]: { ...rule, enabled: !rule.enabled } };
      saveRules(next);
      return next;
    });
  }, []);

  const reset = useCallback(async () => {
    setRules(DEFAULT_RULES);
    await resetRules();
  }, []);

  const getActiveRule = useCallback((url: string) => {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    const key = matchRule(rules, hostname);
    return key ? rules[key] : null;
  }, [rules]);

  return { rules, loading, updateRule, deleteRule, toggleRule, reset, getActiveRule };
}
