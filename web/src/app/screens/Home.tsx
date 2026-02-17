import { useEffect, useMemo, useState } from 'react';
import { t, type SupportedLanguage } from '../i18n';

type Props = {
  inventory: any;
  onWake: () => Promise<void>;
  lang: SupportedLanguage;
};

type BackpackItem = {
  key: 'sandwiches' | 'coffee';
  label: string;
  icon: string;
  amount: number;
  rarity: 'common' | 'rare';
};

const formatCountdown = (targetMs: number, nowMs: number, lang: SupportedLanguage) => {
  const diff = Math.max(targetMs - nowMs, 0);
  if (diff <= 0) {
    return t(lang, 'home.readyNow');
  }

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
};

const buildBackpack = (inventory: any, lang: SupportedLanguage): BackpackItem[] => {
  const allItems: BackpackItem[] = [
    {
      key: 'sandwiches',
      label: t(lang, 'home.sandwiches'),
      icon: '🥪',
      amount: Number(inventory?.sandwiches || 0),
      rarity: 'common'
    },
    {
      key: 'coffee',
      label: t(lang, 'home.coffee'),
      icon: '☕',
      amount: Number(inventory?.coffee || 0),
      rarity: 'rare'
    }
  ];

  return allItems.filter((item) => item.amount > 0);
};

export function Home({ inventory, onWake, lang }: Props) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const next = inventory?.next_available_at ? new Date(inventory.next_available_at).getTime() : now;
  const disabled = next > now;
  const timer = useMemo(() => formatCountdown(next, now, lang), [next, now, lang]);

  const backpack = useMemo(() => buildBackpack(inventory, lang), [inventory, lang]);

  return (
    <div className="game-panel card">
      <div className="status-row">
        <h2>{t(lang, 'home.kingStatus')}</h2>
        <div className="steps-badge">{t(lang, 'home.steps', { steps: inventory?.steps ?? 0 })}</div>
      </div>

      <div className="countdown-panel">
        <p className="small">{t(lang, 'home.nextWakeIn')}</p>
        <strong>{timer}</strong>
      </div>

      <button className="wake-button" onClick={() => void onWake()} disabled={disabled}>
        {t(lang, 'home.wake')}
      </button>

      <div className="inventory-panel">
        <h3>{t(lang, 'home.backpack')}</h3>
        {backpack.length === 0 ? (
          <div className="backpack-empty">
            <p>{t(lang, 'home.backpackEmpty')}</p>
            <p className="small">{t(lang, 'home.referralRewardsHint')}</p>
            <p className="small">{t(lang, 'home.itemsFlexHint')}</p>
          </div>
        ) : (
          <>
            <div className="backpack-grid">
              {backpack.map((item) => (
                <div key={item.key} className={`item-slot ${item.rarity}`}>
                  <span className="item-icon" aria-hidden="true">{item.icon}</span>
                  <span className="item-name">{item.label}</span>
                  <strong>x{item.amount}</strong>
                </div>
              ))}
            </div>
            <p className="small backpack-footnote">{t(lang, 'home.itemsFlexHint')}</p>
          </>
        )}
      </div>
    </div>
  );
}
