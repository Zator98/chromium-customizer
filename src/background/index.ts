import browser from 'webextension-polyfill';
import { getRules, matchRule } from '@options/utils/storage';
import { DEFAULT_RULES } from '@shared/constants';
import { RulesMap } from '@shared/types';

let rulesCache: RulesMap = DEFAULT_RULES;
let cachePromise: Promise<RulesMap> | null = null;

async function getRulesCached(forceRefresh = false): Promise<RulesMap> {
  if (forceRefresh) cachePromise = null;
  if (cachePromise) return cachePromise;
  cachePromise = (async () => {
    rulesCache = await getRules();
    return rulesCache;
  })();
  return cachePromise;
}

async function injectCssForTab(tabId: number, url: string) {
  const rules = await getRulesCached();
  const hostname = new URL(url).hostname.replace(/^www\./, '');
  const key = matchRule(rules, hostname);
  if (!key) return;

  const rule = rules[key];
  if (!rule.enabled) return;

  try {
    if (rule.css) {
      await browser.scripting.insertCSS({
        target: { tabId },
        css: rule.css,
      });
    }
  } catch (e) {
    console.error('[Customizer] CSS injection failed:', e);
  }
}

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.startsWith('http')) {
    await injectCssForTab(tabId, tab.url);
  }
});

browser.runtime.onInstalled.addListener(async () => {
  await getRulesCached(true);
  console.log('[Customizer] Installed, rules cached');
});

browser.storage.onChanged.addListener(() => {
  getRulesCached(true);
});

interface GetRuleMessage {
  type: 'GET_RULE';
  url: string;
}

interface SaveLiveCssMessage {
  type: 'SAVE_LIVE_CSS';
  hostname: string;
  css: string;
}

interface AppendLiveCssMessage {
  type: 'APPEND_LIVE_CSS';
  hostname: string;
  css: string;
}

type Message = GetRuleMessage | SaveLiveCssMessage | AppendLiveCssMessage | { type: string };

browser.runtime.onMessage.addListener((message: Message) => {
  if (message?.type === 'GET_RULE') {
    const msg = message as GetRuleMessage;
    return getRulesCached().then((rules) => {
      const hostname = new URL(msg.url).hostname.replace(/^www\./, '');
      const key = matchRule(rules, hostname);
      return key ? rules[key] : null;
    });
  }

  if (message?.type === 'SAVE_LIVE_CSS') {
    const msg = message as SaveLiveCssMessage;
    return getRulesCached().then(async (rules) => {
      const updated = {
        ...rules,
        [msg.hostname]: {
          ...(rules[msg.hostname] || { enabled: true }),
          css: msg.css,
          updatedAt: Date.now(),
        },
      };
      await browser.storage.sync.set({ site_customizer_rules: updated });
      return { ok: true };
    });
  }

  if (message?.type === 'APPEND_LIVE_CSS') {
    const msg = message as AppendLiveCssMessage;
    return getRulesCached().then(async (rules) => {
      const existing = rules[msg.hostname]?.css || '';
      const combined = existing ? `${existing}\n${msg.css}` : msg.css;
      const updated = {
        ...rules,
        [msg.hostname]: {
          ...(rules[msg.hostname] || { enabled: true }),
          css: combined,
          updatedAt: Date.now(),
        },
      };
      await browser.storage.sync.set({ site_customizer_rules: updated });

      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        browser.tabs.sendMessage(tabs[0].id, { type: 'CSS_APPENDED', css: msg.css }).catch(() => {});
      }

      return { ok: true };
    });
  }

  return undefined;
});

browser.commands.onCommand.addListener(async (command) => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  if (command === 'open-live-editor') {
    browser.tabs.sendMessage(tab.id, { type: 'OPEN_LIVE_EDITOR' });
  }
  if (command === 'open-element-picker') {
    browser.tabs.sendMessage(tab.id, { type: 'OPEN_ELEMENT_PICKER' });
  }
});
