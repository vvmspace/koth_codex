export function getTelegramInitData() {
  const win = window as unknown as { Telegram?: { WebApp?: { initData?: string; ready?: () => void } } };
  win.Telegram?.WebApp?.ready?.();
  return win.Telegram?.WebApp?.initData || '';
}
