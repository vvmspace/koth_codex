import { api } from '../api';

export function Premium() {
  const createIntent = async () => {
    await api('/payments/ton/create-intent', { method: 'POST', body: JSON.stringify({ amount: 1, currency: 'TON' }) });
    alert('TON payment intent created (stub).');
  };

  return (
    <div className="card">
      <h2>Premium (TON Scaffold)</h2>
      <button onClick={() => alert('TonConnect placeholder: integrate wallet SDK later.')}>Connect wallet</button>
      <button onClick={() => void createIntent()} style={{ marginLeft: 8 }}>Buy Premium (stub)</button>
    </div>
  );
}
