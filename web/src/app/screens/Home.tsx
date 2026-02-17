import { useEffect, useMemo, useState } from 'react';

type Props = {
  inventory: any;
  onWake: () => Promise<void>;
};

type BackpackItem = {
  key: 'sandwiches' | 'coffee';
  label: string;
  icon: string;
  amount: number;
  rarity: 'common' | 'rare';
};

const formatCountdown = (targetMs: number, nowMs: number) => {
  const diff = Math.max(targetMs - nowMs, 0);
  if (diff <= 0) {
    return 'Ready now';
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

const buildBackpack = (inventory: any): BackpackItem[] => [
  {
    key: 'sandwiches',
    label: 'Sandwiches',
    icon: '🥪',
    amount: Number(inventory?.sandwiches || 0),
    rarity: 'common'
  },
  {
    key: 'coffee',
    label: 'Coffee',
    icon: '☕',
    amount: Number(inventory?.coffee || 0),
    rarity: 'rare'
  }
];

export function Home({ inventory, onWake }: Props) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const next = inventory?.next_available_at ? new Date(inventory.next_available_at).getTime() : now;
  const disabled = next > now;
  const freeLeft = Math.max(3 - (inventory?.daily_free_count || 0), 0);

  const timer = useMemo(() => formatCountdown(next, now), [next, now]);

  const backpack = useMemo(() => buildBackpack(inventory), [inventory]);

  return (
    <div className="game-panel card">
      <div className="status-row">
        <h2>👑 King Status</h2>
        <div className="steps-badge">🏃 {inventory?.steps ?? 0} steps</div>
      </div>

      <div className="countdown-panel">
        <p className="small">Next wake in</p>
        <strong>{timer}</strong>
        <p className="small">Free wakes left today: {freeLeft}/3</p>
      </div>

      <button className="wake-button" onClick={() => void onWake()} disabled={disabled}>
        Wake up The King
      </button>

      <div className="inventory-panel">
        <h3>🎒 Backpack</h3>
        <div className="backpack-grid">
          {backpack.map((item) => (
            <div key={item.key} className={`item-slot ${item.rarity}`}>
              <span className="item-icon" aria-hidden="true">{item.icon}</span>
              <span className="item-name">{item.label}</span>
              <strong>x{item.amount}</strong>
            </div>
          ))}
        </div>
      </div>

      <p className="small">Optional: share referral link where appropriate.</p>
    </div>
  );
}
