import { api } from '../api';
import { t, type SupportedLanguage } from '../i18n';

export function Premium({ lang }: { lang: SupportedLanguage }) {
  const createIntent = async () => {
    await api('/payments/ton/create-intent', { method: 'POST', body: JSON.stringify({ amount: 1, currency: 'TON' }) });
    alert(t(lang, 'premium.intentCreated'));
  };

  return (
    <div className="card">
      <h2>{t(lang, 'premium.title')}</h2>
      <p className="small">{t(lang, 'premium.subtitle')}</p>
      <div className="row">
        <button className="secondary" onClick={() => alert(t(lang, 'premium.connectStub'))}>{t(lang, 'premium.connectWallet')}</button>
        <button onClick={() => void createIntent()}>{t(lang, 'premium.buyStub')}</button>
      </div>
    </div>
  );
}
