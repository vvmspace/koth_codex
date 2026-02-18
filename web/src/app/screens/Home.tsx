import { useEffect, useMemo, useRef, useState } from 'react';
import { t, type SupportedLanguage } from '../i18n';

type BackpackItemKey = 'sandwiches' | 'coffee';

type Props = {
  inventory: any;
  onWake: () => Promise<void>;
  onItemTap: (itemKey: BackpackItemKey) => Promise<void>;
  itemActionMessage?: string;
  lang: SupportedLanguage;
  isLoadingUser?: boolean;
};

type BackpackItem = {
  key: BackpackItemKey;
  label: string;
  description: string;
  icon: string;
  amount: number;
  rarity: 'common' | 'rare';
};

const LONG_TAP_MS = 550;

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
      description: t(lang, 'home.itemDescriptionSandwiches'),
      icon: '🥪',
      amount: Number(inventory?.sandwiches || 0),
      rarity: 'common'
    },
    {
      key: 'coffee',
      label: t(lang, 'home.coffee'),
      description: t(lang, 'home.itemDescriptionCoffee'),
      icon: '☕',
      amount: Number(inventory?.coffee || 0),
      rarity: 'rare'
    }
  ];

  return allItems.filter((item) => item.amount > 0);
};

export function Home({ inventory, onWake, onItemTap, itemActionMessage = '', lang, isLoadingUser = false }: Props) {
  const [now, setNow] = useState(Date.now());
  const [selectedItem, setSelectedItem] = useState<BackpackItem | null>(null);
  const longTapTimeoutRef = useRef<number | null>(null);
  const longTapTriggeredRef = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
      clearLongTapTimeout();
    };
  }, []);

  const wakeIntervalMs = Number(inventory?.wake_interval_ms || 28_800_000);
  const lastAwakeMs = inventory?.last_awake ? new Date(inventory.last_awake).getTime() : null;
  const next = lastAwakeMs ? lastAwakeMs + wakeIntervalMs : now;
  const disabled = isLoadingUser || !inventory || next > now;
  const timer = useMemo(() => formatCountdown(next, now, lang), [next, now, lang]);

  const backpack = useMemo(() => buildBackpack(inventory, lang), [inventory, lang]);

  const clearLongTapTimeout = () => {
    if (longTapTimeoutRef.current !== null) {
      window.clearTimeout(longTapTimeoutRef.current);
      longTapTimeoutRef.current = null;
    }
  };

  const handleItemPointerDown = (itemKey: BackpackItemKey) => {
    longTapTriggeredRef.current = false;
    clearLongTapTimeout();
    longTapTimeoutRef.current = window.setTimeout(() => {
      longTapTriggeredRef.current = true;
      longTapTimeoutRef.current = null;
      const item = backpack.find((entry) => entry.key === itemKey) || null;
      setSelectedItem(item);
    }, LONG_TAP_MS);
  };

  const handleItemPointerUp = (itemKey: BackpackItemKey) => {
    clearLongTapTimeout();
    if (longTapTriggeredRef.current) {
      longTapTriggeredRef.current = false;
    }
  };

  const handleItemClick = (itemKey: BackpackItemKey) => {
    if (longTapTriggeredRef.current) {
      longTapTriggeredRef.current = false;
      return;
    }

    void onItemTap(itemKey);
  };

  const handlePointerCancel = () => {
    clearLongTapTimeout();
    longTapTriggeredRef.current = false;
  };

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
          <div className="backpack-grid">
            {backpack.map((item) => (
              <button
                key={item.key}
                className={`item-slot ${item.rarity}`}
                type="button"
                onPointerDown={() => handleItemPointerDown(item.key)}
                onPointerUp={() => handleItemPointerUp(item.key)}
                onPointerCancel={handlePointerCancel}
                onPointerLeave={handlePointerCancel}
                onClick={() => handleItemClick(item.key)}
                onContextMenu={(event) => event.preventDefault()}
              >
                <span className="item-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="item-name">{item.label}</span>
                <strong>x{item.amount}</strong>
              </button>
            ))}
          </div>
        )}
        {backpack.length > 0 && <p className="small backpack-footnote">{t(lang, 'home.itemTapHint')}</p>}
        {itemActionMessage && <p className="small backpack-footnote">{itemActionMessage}</p>}
      </div>

      {selectedItem && (
        <div
          className="item-menu-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={selectedItem.label}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedItem(null);
            }
          }}
        >
          <div className="item-menu card" onClick={(event) => event.stopPropagation()}>
            <div className="item-menu-header">
              <span className="item-icon" aria-hidden="true">
                {selectedItem.icon}
              </span>
              <h3>{selectedItem.label}</h3>
            </div>
            <p>{selectedItem.description}</p>
            <p className="small">{t(lang, 'home.itemMenuLongTapHint')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
