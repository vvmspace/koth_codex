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
      if (address) {
        finish(address);
      }
    });

    const pollId = window.setInterval(() => {
      if (tonConnect.account?.address) {
        finish(tonConnect.account.address);
      }
    }, 250);

    const timeoutId = window.setTimeout(() => finish(null), timeoutMs);
  });
}

function missionIcon(type: string) {
  if (type === 'join_channel') return '📣';
  if (type === 'connect_wallet') return '💎';
  if (type === 'activate_web3') return '🪙';
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

async function pollActivateWeb3(invoiceId: string, lang: SupportedLanguage) {
  const startedAt = Date.now();
  const timeoutMs = 90_000;

  while (Date.now() - startedAt < timeoutMs) {
    const sync = await api<{ status: 'pending' | 'paid' }>('/payments/ton/activate-web3/sync', {
      method: 'POST',
      body: JSON.stringify({ invoice_id: invoiceId })
    });

    if (sync.status === 'paid') return;
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }

  throw new Error(t(lang, 'missions.paymentPending'));
}

export function Missions({
  data,
  onComplete,
  lang
}: {
  data: any;
  onComplete: (missionId: string) => Promise<void>;
  lang: SupportedLanguage;
}) {
  const [submittingMissionId, setSubmittingMissionId] = useState<string | null>(null);
  const [missionError, setMissionError] = useState('');

  const tonConnect = useMemo(
    () =>
      new TonConnectUI({
        manifestUrl: `${window.location.origin}/tonconnect-manifest.json`
      }),
    []
  );

  const completed = new Set(
    (data?.user_missions || []).filter((m: any) => m.status === 'completed').map((m: any) => m.mission_id)
  );

  const visibleMissions = data?.missions || [];

  const completeMission = async (mission: any) => {
    if (submittingMissionId === mission.id) return;
    if (completed.has(mission.id)) return;

    setMissionError('');
    setSubmittingMissionId(mission.id);

    try {
      if (mission.type === 'connect_wallet') {
        await tonConnect.openModal();
        const walletAddress = await waitForWalletAddress(tonConnect);

        if (!walletAddress) {
          throw new Error(t(lang, 'missions.walletNotConnected'));
        }

        await api('/payments/ton/confirm', {
          method: 'POST',
          body: JSON.stringify({ wallet_address: walletAddress })
        });
      }

      if (mission.type === 'activate_web3') {
        if (!tonConnect.account?.address) {
          await tonConnect.openModal();
        }

        const walletAddress = await waitForWalletAddress(tonConnect);
        if (!walletAddress) {
          throw new Error(t(lang, 'missions.walletNotConnected'));
        }

        const intent = await api<{
          invoice_id: string;
          transaction: {
            validUntil: number;
            messages: Array<{ address: string; amount: string; payload: string }>;
          };
        }>('/payments/ton/activate-web3/create-intent', {
          method: 'POST',
          body: JSON.stringify({})
        });

        await tonConnect.sendTransaction(intent.transaction);
        await pollActivateWeb3(intent.invoice_id, lang);
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
        const isWalletAction = m.type === 'connect_wallet' || m.type === 'activate_web3';

        return (
          <div
            key={m.id}
            className={`card mission-card ${completed.has(m.id) ? 'is-completed' : ''}`}
            onClick={() => {
              if (!isWalletAction) return;
              if (submittingMissionId === m.id) return;
              if (completed.has(m.id)) return;
              void completeMission(m);
            }}
            onKeyDown={(event) => {
              if (!isWalletAction) return;
              if (event.key !== 'Enter' && event.key !== ' ') return;
              event.preventDefault();
              if (submittingMissionId === m.id) return;
              if (completed.has(m.id)) return;
              void completeMission(m);
            }}
            role={isWalletAction ? 'button' : undefined}
            tabIndex={isWalletAction ? 0 : undefined}
            style={{ cursor: isWalletAction ? 'pointer' : 'default' }}
          >
            <div className="mission-header">
              <h3>
                <span className="mission-icon" aria-hidden="true">
                  {missionIcon(m.type)}
                </span>{' '}
                {m.title}
              </h3>
              {completed.has(m.id) && <span className="mission-status-pill">✓</span>}
            </div>

            <p>{m.description}</p>
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
                className={`mission-complete-button btn-with-icon ${isWalletAction ? 'wallet' : 'default'}`}
                onClick={(event) => {
                  event.stopPropagation();
                  void completeMission(m);
                }}
                disabled={submittingMissionId === m.id || completed.has(m.id)}
              >
                <span className="btn-icon" aria-hidden="true">{isWalletAction ? '◇' : '✓'}</span>
                <span>
                  {completed.has(m.id)
                    ? t(lang, 'missions.completed')
                    : isWalletAction
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
