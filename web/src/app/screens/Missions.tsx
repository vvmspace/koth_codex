import { useMemo, useState } from 'react';
import { TonConnectUI, type ConnectedWallet } from '@tonconnect/ui';
import { api } from '../api';
import { t, type SupportedLanguage } from '../i18n';

async function waitForWalletAddress(tonConnect: TonConnectUI, timeoutMs = 12_000): Promise<string | null> {
  if (tonConnect.account?.address) {
    return tonConnect.account.address;
  }

  return new Promise((resolve) => {
    let settled = false;

    const finish = (value: string | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      clearInterval(pollId);
      unsubscribe();
      resolve(value);
    };

    const unsubscribe = tonConnect.onStatusChange((wallet: ConnectedWallet | null) => {
      const address = wallet?.account?.address;
      if (address) finish(address);
    });

    const pollId = window.setInterval(() => {
      if (tonConnect.account?.address) finish(tonConnect.account.address);
    }, 250);

    const timeoutId = window.setTimeout(() => finish(null), timeoutMs);
  });
}

function missionIcon(type: string) {
  if (type === 'join_channel') return '📣';
  if (type === 'connect_wallet') return '💎';
  if (type === 'ton_payment') return '🪙';
  if (type === 'manual_confirm') return '✅';
  return '🎯';
}

function missionLink(mission: any): string | null {
  const payload = mission?.payload;
  if (!payload || typeof payload !== 'object') return null;

  const possible = [payload.link, payload.url, payload.post_url, payload.channel_url];
  const candidate = possible.find((value) => typeof value === 'string' && value.startsWith('http'));
  if (candidate) return candidate;

  if (typeof payload.channel_id === 'string' && payload.channel_id.startsWith('@')) {
    return `https://t.me/${payload.channel_id.slice(1)}`;
  }

  return null;
}

export function Missions({
  data,
  onComplete,
  onReload,
  lang
}: {
  data: any;
  onComplete: (missionId: string) => Promise<void>;
  onReload: () => Promise<void>;
  lang: SupportedLanguage;
}) {
  const [submittingMissionId, setSubmittingMissionId] = useState<string | null>(null);
  const [missionError, setMissionError] = useState('');
  const [tonTxByMission, setTonTxByMission] = useState<Record<string, string>>({});

  const tonConnect = useMemo(() => new TonConnectUI({ manifestUrl: `${window.location.origin}/tonconnect-manifest.json` }), []);

  const completed = new Set((data?.user_missions || []).filter((m: any) => m.status === 'completed').map((m: any) => m.mission_id));
  const pending = new Set((data?.user_missions || []).filter((m: any) => m.status === 'pending').map((m: any) => m.mission_id));
  const visibleMissions = data?.missions || [];

  const connectWallet = async () => {
    await tonConnect.openModal();
    const walletAddress = await waitForWalletAddress(tonConnect);
    if (!walletAddress) throw new Error(t(lang, 'missions.walletNotConnected'));
    await api('/payments/ton/connect', { method: 'POST', body: JSON.stringify({ wallet_address: walletAddress }) });
    return walletAddress;
  };

  const handleTonMissionStart = async (mission: any) => {
    await connectWallet();
    const intent = await api<{ amount_ton: string; output_address: string }>('/payments/ton/create-intent', {
      method: 'POST',
      body: JSON.stringify({ mission_id: mission.id })
    });

    await onReload();

    const message = `Send ${intent.amount_ton} TON to:\n${intent.output_address}\n\nAfter sending, paste transaction id and tap Claim.`;
    alert(message);
    setTonTxByMission((prev) => ({ ...prev, [mission.id]: prev[mission.id] || '' }));
  };

  const claimTonMission = async (mission: any) => {
    const transactionId = (tonTxByMission[mission.id] || '').trim();
    if (!transactionId) throw new Error('Enter TON transaction id first.');

    const walletAddress = tonConnect.account?.address;
    if (!walletAddress) throw new Error(t(lang, 'missions.walletNotConnected'));

    const result = await api<{ status: 'pending' | 'declined' | 'confirmed'; ok: boolean }>('/payments/ton/confirm', {
      method: 'POST',
      body: JSON.stringify({ mission_id: mission.id, transaction_id: transactionId, wallet_address: walletAddress })
    });

    if (result.status === 'declined') {
      setTonTxByMission((prev) => ({ ...prev, [mission.id]: '' }));
      await onReload();
      throw new Error('Transaction declined. You can start this mission again.');
    }

    if (result.status === 'pending') {
      throw new Error('Transaction is still pending. Please retry Claim later.');
    }

    await onReload();
  };

  const completeMission = async (mission: any) => {
    if (submittingMissionId === mission.id || completed.has(mission.id)) return;

    setMissionError('');
    setSubmittingMissionId(mission.id);

    try {
      if (mission.type === 'connect_wallet') {
        await connectWallet();
      } else if (mission.type === 'ton_payment') {
        if (pending.has(mission.id)) {
          await claimTonMission(mission);
        } else {
          await handleTonMissionStart(mission);
        }
        return;
      }

      await onComplete(mission.id);
    } catch (error) {
      setMissionError((error as Error).message || t(lang, 'missions.walletNotConnected'));
    } finally {
      setSubmittingMissionId(null);
    }
  };

  return (
    <div className="card">
      <h2>{t(lang, 'missions.title')}</h2>
      {missionError && <p className="small">{missionError}</p>}
      {visibleMissions.length === 0 && <p className="small">{t(lang, 'missions.empty')}</p>}

      {visibleMissions.map((m: any) => {
        const link = missionLink(m);
        const isCompleted = completed.has(m.id);
        const isPending = pending.has(m.id);

        return (
          <div key={m.id} className={`card mission-card ${isCompleted ? 'is-completed' : ''}`}>
            <div className="mission-header">
              <h3>
                <span className="mission-icon" aria-hidden="true">{missionIcon(m.type)}</span> {m.title}
              </h3>
              {isCompleted && <span className="mission-status-pill">✓</span>}
              {!isCompleted && isPending && m.type === 'ton_payment' && <span className="mission-status-pill">…</span>}
            </div>

            <p>{m.description}</p>

            {m.type === 'ton_payment' && !isCompleted && (
              <input
                type="text"
                placeholder="TON transaction id"
                value={tonTxByMission[m.id] || ''}
                onChange={(event) => setTonTxByMission((prev) => ({ ...prev, [m.id]: event.target.value }))}
                onClick={(event) => event.stopPropagation()}
              />
            )}

            <div className="mission-actions">
              {link && (
                <button
                  type="button"
                  className="secondary mission-link-button btn-with-icon"
                  onClick={(event) => {
                    event.stopPropagation();
                    const win = window as any;
                    if (win.Telegram?.WebApp?.openTelegramLink && link.includes('t.me/')) {
                      win.Telegram.WebApp.openTelegramLink(link);
                      return;
                    }
                    window.open(link, '_blank', 'noopener,noreferrer');
                  }}
                >
                  <span className="btn-icon" aria-hidden="true">↗</span><span>{t(lang, 'missions.openLink')}</span>
                </button>
              )}

              <button
                className="mission-complete-button btn-with-icon"
                onClick={() => void completeMission(m)}
                disabled={submittingMissionId === m.id || isCompleted}
              >
                <span className="btn-icon" aria-hidden="true">✓</span>
                <span>
                  {isCompleted
                    ? t(lang, 'missions.completed')
                    : m.type === 'ton_payment'
                    ? isPending
                      ? 'Claim'
                      : 'Start payment'
                    : m.type === 'connect_wallet'
                    ? t(lang, 'missions.connectWalletAndComplete')
                    : t(lang, 'missions.complete')}
                </span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
