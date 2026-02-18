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

      {visibleMissions.map((m: any) => (
        <div
          key={m.id}
          className="card"
          onClick={() => {
            if (m.type !== 'connect_wallet') return;
            if (submittingMissionId === m.id) return;
            if (completed.has(m.id)) return;
            void completeMission(m);
          }}
          onKeyDown={(event) => {
            if (m.type !== 'connect_wallet') return;
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            if (submittingMissionId === m.id) return;
            if (completed.has(m.id)) return;
            void completeMission(m);
          }}
          role={m.type === 'connect_wallet' ? 'button' : undefined}
          tabIndex={m.type === 'connect_wallet' ? 0 : undefined}
          style={{ cursor: m.type === 'connect_wallet' ? 'pointer' : 'default' }}
        >
          <h3>{m.title}</h3>
          <p>{m.description}</p>
          <button
            onClick={(event) => {
              event.stopPropagation();
              void completeMission(m);
            }}
            disabled={submittingMissionId === m.id || completed.has(m.id)}
          >
            {completed.has(m.id)
              ? t(lang, 'missions.completed')
              : m.type === 'connect_wallet'
              ? t(lang, 'missions.connectWalletAndComplete')
              : t(lang, 'missions.complete')}
          </button>
        </div>
      ))}
    </div>
  );
}
