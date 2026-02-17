import { t, type SupportedLanguage } from '../i18n';

export function Referral({ user, lang }: { user: any; lang: SupportedLanguage }) {
  const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'your_bot';
  const link = `https://t.me/${botUsername}?start=ref_${user?.referral_code || ''}`;

  const share = () => {
    const win = window as any;
    if (win.Telegram?.WebApp?.openTelegramLink) {
      win.Telegram.WebApp.openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('Join me in King of the Hill!')}`
      );
    } else {
      navigator.clipboard.writeText(link);
    }
  };

  return (
    <div className="card">
      <h2>{t(lang, 'referral.title')}</h2>
      <input readOnly value={link} />
      <div className="row" style={{ marginTop: 8 }}>
        <button className="secondary" onClick={() => navigator.clipboard.writeText(link)}>{t(lang, 'referral.copy')}</button>
        <button onClick={share}>{t(lang, 'referral.share')}</button>
      </div>
      <p className="small">{t(lang, 'referral.safeShare')}</p>
    </div>
  );
}
