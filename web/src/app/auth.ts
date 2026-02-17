function readInitDataFromLocation() {
  const url = new URL(window.location.href);
  const fromQuery = url.searchParams.get('tgWebAppData');
  if (fromQuery) {
    return fromQuery;
  }

  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  const hashParams = new URLSearchParams(hash);
  return hashParams.get('tgWebAppData') || '';
}

export function getTelegramInitData() {
  const win = window as unknown as {
    Telegram?: { WebApp?: { initData?: string; ready?: () => void; expand?: () => void } };
  };

  win.Telegram?.WebApp?.ready?.();
  win.Telegram?.WebApp?.expand?.();

  return win.Telegram?.WebApp?.initData || readInitDataFromLocation();
}
