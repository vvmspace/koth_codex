import { useMemo } from 'react';

type Props = {
  inventory: any;
  onWake: () => Promise<void>;
};

export function Home({ inventory, onWake }: Props) {
  const now = Date.now();
  const next = inventory?.next_available_at ? new Date(inventory.next_available_at).getTime() : now;
  const disabled = next > now;
  const freeLeft = Math.max(3 - (inventory?.daily_free_count || 0), 0);

  const timer = useMemo(() => {
    if (!disabled) return 'Ready now';
    const sec = Math.floor((next - now) / 1000);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
  }, [disabled, next, now]);

  return (
    <div className="card">
      <h2>King Status</h2>
      <p>Steps: {inventory?.steps ?? 0}</p>
      <p>Sandwiches: {inventory?.sandwiches ?? 0}</p>
      <p>Coffee: {inventory?.coffee ?? 0}</p>
      <p>Next wake: {timer}</p>
      <p>Remaining free actions today: {freeLeft}</p>
      <button onClick={() => void onWake()} disabled={disabled}>Wake the King</button>
      <p className="small">Optional: share referral link where appropriate.</p>
    </div>
  );
}
