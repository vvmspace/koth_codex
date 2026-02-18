import { useEffect, useMemo, useRef, useState } from 'react';
import { t, type SupportedLanguage } from '../i18n';

type BackpackItemKey = 'sandwiches' | 'coffee';

type Props = {
  inventory: any;
  leaderboard: any;
  onWake: () => Promise<void>;
  onUseItem: (itemKey: 'sandwiches' | 'coffee', mode: 'tap' | 'hold') => Promise<void>;
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

const HOLD_DELAY_MS = 550;

export function Home({ inventory, leaderboard, onWake, onUseItem, lang, isLoadingUser = false }: Props) {
  const [now, setNow] = useState(Date.now());
  const [itemActionText, setItemActionText] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<BackpackItem | null>(null);
  const longTapTimeoutRef = useRef<number | null>(null);

  const clearLongTapTimeout = () => {
    if (longTapTimeoutRef.current) {
      window.clearTimeout(longTapTimeoutRef.current);
      longTapTimeoutRef.current = null;
    }
  };

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
  const wakeDisabled = isLoadingUser || !inventory || next > now;
  const timer = useMemo(() => formatCountdown(next, now, lang), [next, now, lang]);

  const backpack = useMemo(() => buildBackpack(inventory, lang), [inventory, lang]);
  const totalUsers = Number(leaderboard?.total_users ?? 0);
  const currentRank = Number(leaderboard?.current_user_rank ?? 0);
  const percentile = totalUsers > 0 && currentRank > 0 ? (currentRank / totalUsers) * 100 : null;

  const rankTier = useMemo(() => {
    if (percentile === null) return null;
    if (percentile <= 30) {
      return { label: t(lang, 'home.rankTierTop30'), className: 'rank-badge top30' };
    }
    if (percentile <= 50) {
      return { label: t(lang, 'home.rankTierTop50'), className: 'rank-badge top50' };
    }
    return { label: t(lang, 'home.rankTierKeepGoing'), className: 'rank-badge others' };
  }, [lang, percentile]);

  const runItemAction = async (itemKey: 'sandwiches' | 'coffee', mode: 'tap' | 'hold') => {
    try {
      await onUseItem(itemKey, mode);
      setItemActionText(t(lang, 'home.itemActivatedStub'));
    } catch {
      setItemActionText(t(lang, 'home.itemActivationError'));
    }
  };

  const openItemInfo = (item: BackpackItem) => {
    setSelectedItem(item);
  };

  return (
    <div className="game-panel card">
      <div className="status-row">
        <h2>{t(lang, 'home.kingStatus')}</h2>
        <div className="status-badges">
          <div className="steps-badge">{t(lang, 'home.steps', { steps: inventory?.steps ?? 0 })}</div>
          {rankTier && (
            <div className={rankTier.className}>
              {t(lang, 'home.rankBadge', { rank: currentRank, total: totalUsers })}
              <span>{rankTier.label}</span>
            </div>
          )}
        </div>
      </div>

      <div className="countdown-panel">
        <p className="small">{t(lang, 'home.nextWakeIn')}</p>
        <strong>{timer}</strong>
      </div>

      <button className="wake-button" onClick={() => void onWake()} disabled={wakeDisabled}>
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
                <button
                  key={item.key}
                  type="button"
                  className={`item-slot ${item.rarity}`}
                  onClick={(event) => {
                    if (event.currentTarget.dataset.holdTriggered === 'true') {
                      event.currentTarget.dataset.holdTriggered = 'false';
                      return;
                    }
                    void runItemAction(item.key, 'tap');
                  }}
                  onPointerDown={(event) => {
                    const element = event.currentTarget;
                    clearLongTapTimeout();

                    longTapTimeoutRef.current = window.setTimeout(() => {
                      element.dataset.holdTriggered = 'true';
                      openItemInfo(item);
                    }, HOLD_DELAY_MS);

                    element.dataset.holdTriggered = 'false';
                  }}
                  onPointerUp={() => {
                    clearLongTapTimeout();
                  }}
                  onPointerLeave={() => {
                    clearLongTapTimeout();
                  }}
                >
                  <span className="item-icon" aria-hidden="true">{item.icon}</span>
                  <span className="item-name">{item.label}</span>
                  <strong>x{item.amount}</strong>
                </button>
              ))}
            </div>
          </>
        )}
        {itemActionText && <p className="small backpack-footnote">{itemActionText}</p>}
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
