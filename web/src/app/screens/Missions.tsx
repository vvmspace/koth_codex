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
  const completed = new Set(
    (data?.user_missions || []).filter((m: any) => m.status === 'completed').map((m: any) => m.mission_id)
  );
  return (
    <div className="card">
      <h2>{t(lang, 'missions.title')}</h2>
      {(data?.missions || []).map((m: any) => (
        <div key={m.id} className="card">
          <h3>{m.title}</h3>
          <p>{m.description}</p>
          <p className="small">{t(lang, 'missions.type', { type: m.type })}</p>
          <button onClick={() => void onComplete(m.id)} disabled={completed.has(m.id)}>
            {completed.has(m.id) ? t(lang, 'missions.completed') : t(lang, 'missions.complete')}
          </button>
        </div>
      ))}
    </div>
  );
}
