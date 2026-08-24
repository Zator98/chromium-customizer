export interface SiteRule {
  css?: string;
  js?: string;
  enabled: boolean;
  updatedAt: number;
}

export interface RulesMap {
  [hostname: string]: SiteRule;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
