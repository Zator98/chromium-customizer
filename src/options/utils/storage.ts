import browser from 'webextension-polyfill';
import { STORAGE_KEY, DEFAULT_RULES } from '@shared/constants';
import { RulesMap } from '@shared/types';

export async function getRules(): Promise<RulesMap> {
  const { [STORAGE_KEY]: stored } = await browser.storage.sync.get(STORAGE_KEY);
  if (!stored) {
    await browser.storage.sync.set({ [STORAGE_KEY]: DEFAULT_RULES });
    return DEFAULT_RULES;
  }
  return { ...DEFAULT_RULES, ...stored };
}

export async function saveRules(rules: RulesMap): Promise<void> {
  await browser.storage.sync.set({ [STORAGE_KEY]: rules });
}

export async function resetRules(): Promise<void> {
  await browser.storage.sync.set({ [STORAGE_KEY]: DEFAULT_RULES });
}

export function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '*';
  }
}

export function matchRule(rules: RulesMap, hostname: string): string | null {
  if (rules[hostname]) return hostname;
  const parts = hostname.split('.');
  for (let i = 1; i < parts.length; i++) {
    const wildcard = `*.${parts.slice(i).join('.')}`;
    if (rules[wildcard]) return wildcard;
  }
  return rules['*'] ? '*' : null;
}

export type { RulesMap };
