export function Leaderboard({ data }: { data: any }) {
  return (
    <div className="card">
      <h2>Leaderboard</h2>
      <ol>
        {(data?.top || []).map((entry: any) => (
          <li key={entry.user_id}>{entry.display_name} — {entry.steps} steps</li>
        ))}
      </ol>
      <p>Your rank: {data?.current_user_rank ?? 'N/A'}</p>
    </div>
  );
}
