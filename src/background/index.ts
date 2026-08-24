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

type Message = GetRuleMessage | SaveLiveCssMessage | { type: string };

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

  return undefined;
});

browser.commands.onCommand.addListener(async (command) => {
  if (command === 'open-live-editor') {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      browser.tabs.sendMessage(tab.id, { type: 'OPEN_LIVE_EDITOR' });
    }
  }
});
