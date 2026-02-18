import { useMemo, useState } from 'react';
import { TonConnectUI } from '@tonconnect/ui';
import { api } from '../api';
import { t, type SupportedLanguage } from '../i18n';

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

  const completeMission = async (mission: any) => {
    if (submittingMissionId === mission.id) return;

    try {
      if (mission.type === 'connect_wallet') {
        await tonConnect.openModal();
        const walletAddress = tonConnect.account?.address;

        if (!walletAddress) {
          throw new Error(t(lang, 'missions.walletNotConnected'));
        }

        await api('/payments/ton/confirm', {
          method: 'POST',
          body: JSON.stringify({ wallet_address: walletAddress })
        });
      }

      setSubmittingMissionId(mission.id);
      await onComplete(mission.id);
    } finally {
      setSubmittingMissionId(null);
    }
  };

  return (
    <div className="card">
      <h2>{t(lang, 'missions.title')}</h2>
      {(data?.missions || []).map((m: any) => (
        <div
          key={m.id}
          className="card"
          onClick={() => {
            if (m.type !== 'connect_wallet') return;
            if (completed.has(m.id) || submittingMissionId === m.id) return;
            void completeMission(m);
          }}
          onKeyDown={(event) => {
            if (m.type !== 'connect_wallet') return;
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            if (completed.has(m.id) || submittingMissionId === m.id) return;
            void completeMission(m);
          }}
          role={m.type === 'connect_wallet' ? 'button' : undefined}
          tabIndex={m.type === 'connect_wallet' ? 0 : undefined}
          style={{ cursor: m.type === 'connect_wallet' ? 'pointer' : 'default' }}
        >
          <h3>{m.title}</h3>
          <p>{m.description}</p>
          <p className="small">{t(lang, 'missions.type', { type: m.type })}</p>
          <button
            onClick={(event) => {
              event.stopPropagation();
              void completeMission(m);
            }}
            disabled={completed.has(m.id) || submittingMissionId === m.id}
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
