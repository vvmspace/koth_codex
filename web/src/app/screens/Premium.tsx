import { useEffect, useMemo, useState } from 'react';
import { TonConnectUI, type ConnectedWallet } from '@tonconnect/ui';
import { api } from '../api';
import { t, type SupportedLanguage } from '../i18n';

export function Premium({ lang }: { lang: SupportedLanguage }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const tonConnect = useMemo(
    () =>
      new TonConnectUI({
        manifestUrl: `${window.location.origin}/tonconnect-manifest.json`
      }),
    []
  );

  useEffect(() => {
    const unsubscribe = tonConnect.onStatusChange(async (wallet: ConnectedWallet | null) => {
      const address = wallet?.account?.address ?? null;
      setWalletAddress(address);

      if (!address) return;

      try {
        await api('/payments/ton/confirm', {
          method: 'POST',
          body: JSON.stringify({ wallet_address: address })
        });
      } catch (error) {
        console.error(error);
      }
    });

    if (tonConnect.account?.address) {
      setWalletAddress(tonConnect.account.address);
    }

    return () => {
      unsubscribe();
    };
  }, [tonConnect]);

  const connectWallet = async () => {
    if (walletAddress) return;

    setIsConnecting(true);
    try {
      await tonConnect.openModal();
    } finally {
      setIsConnecting(false);
    }
  };

  const createIntent = async () => {
    await api('/payments/ton/create-intent', { method: 'POST', body: JSON.stringify({ amount: 1, currency: 'TON' }) });
    alert(t(lang, 'premium.intentCreated'));
  };

  return (
    <div className="card">
      <h2>{t(lang, 'premium.title')}</h2>
      <p className="small">{t(lang, 'premium.subtitle')}</p>
      <div className="premium-actions">
        <button className="secondary premium-button" onClick={() => void connectWallet()} disabled={isConnecting || Boolean(walletAddress)}>
          <span className="button-icon" aria-hidden="true">{walletAddress ? '✅' : '🔌'}</span>
          <span>{walletAddress ? t(lang, 'premium.connectedWallet') : t(lang, 'premium.connectWallet')}</span>
        </button>
        <button className="premium-button" onClick={() => void createIntent()}>
          <span className="button-icon" aria-hidden="true">💎</span>
          <span>{t(lang, 'premium.buyStub')}</span>
        </button>
      </div>
      {walletAddress && (
        <p className="small premium-wallet-hint">
          <span className="wallet-dot" aria-hidden="true" />
          {t(lang, 'premium.walletConnected', { address: `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}` })}
        </p>
      )}
    </div>
  );
}
