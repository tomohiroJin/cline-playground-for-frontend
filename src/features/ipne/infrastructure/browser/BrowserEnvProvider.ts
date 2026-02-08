/**
 * ブラウザ依存環境抽象
 */

export interface BrowserEnvProvider {
  getQueryParam(name: string): string | null;
}

export const BROWSER_ENV_PROVIDER: BrowserEnvProvider = {
  getQueryParam: (name: string) => {
    if (typeof window === 'undefined') {
      return null;
    }
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  },
};
