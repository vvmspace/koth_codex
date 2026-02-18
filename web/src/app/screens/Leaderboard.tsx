import { t, type SupportedLanguage } from '../i18n';

export function Leaderboard({ data, lang }: { data: any; lang: SupportedLanguage }) {
  return (
    <div className="card">
      <h2>{t(lang, 'leaderboard.title')}</h2>
      <ol className="list">
        {(data?.top || []).map((entry: any) => (
          <li key={entry.user_id}>
            <span className="leaderboard-name">
              <span className="leaderboard-flag">{entry.country_flag || '🏳️'}</span>#{entry.rank} {entry.display_name}
            </span>
            <strong>{t(lang, 'leaderboard.steps', { steps: entry.steps })}</strong>
          </li>
        ))}
      </ol>
      <p>{t(lang, 'leaderboard.yourRank', { rank: data?.current_user_rank ?? t(lang, 'leaderboard.rankNA') })}</p>
      <div className="leaderboard-activity card">
        <h3>{t(lang, 'leaderboard.activityTitle')}</h3>
        <p className="small">{t(lang, 'leaderboard.activityHint')}</p>
      </div>
    </div>
  );
}
