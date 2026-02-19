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
    <div className="referral-layout">
      <div className="card">
        <h2>🔗 {t(lang, 'referral.title')}</h2>
        <input className="form-control" readOnly value={link} />
        <div className="row" style={{ marginTop: 8 }}>
          <button className="secondary referral-copy-button btn-with-icon" onClick={() => navigator.clipboard.writeText(link)}>
            <span className="btn-icon" aria-hidden="true">⧉</span><span>{t(lang, 'referral.copy')}</span>
          </button>
          <button className="referral-share-button btn-with-icon" onClick={share}><span className="btn-icon" aria-hidden="true">⇪</span><span>{t(lang, 'referral.share')}</span></button>
          <button
            className="secondary referral-open-button btn-with-icon"
            onClick={() => {
              const win = window as any;
              if (win.Telegram?.WebApp?.openTelegramLink) {
                win.Telegram.WebApp.openTelegramLink(link);
                return;
              }
              window.open(link, '_blank', 'noopener,noreferrer');
            }}
          >
            <span className="btn-icon" aria-hidden="true">↗</span><span>Open</span>
          </button>
        </div>
      </div>

      <section className="card referral-info-block">
        <h3>{t(lang, 'referral.rewardsTitle')}</h3>
        <p>{t(lang, 'referral.rewardsBody')}</p>
      </section>

      <section className="card referral-info-block">
        <h3>{t(lang, 'referral.promoIdeasTitle')}</h3>
        <p>{t(lang, 'referral.promoIdeasIntro')}</p>
        <ul>
          <li>{t(lang, 'referral.promoIdea1')}</li>
          <li>{t(lang, 'referral.promoIdea2')}</li>
          <li>{t(lang, 'referral.promoIdea3')}</li>
          <li>{t(lang, 'referral.promoIdea4')}</li>
          <li>{t(lang, 'referral.promoIdea5')}</li>
          <li>{t(lang, 'referral.promoIdea6')}</li>
          <li>{t(lang, 'referral.promoIdea7')}</li>
          <li>{t(lang, 'referral.promoIdea8')}</li>
        </ul>
      </section>
    </div>
  );
}
