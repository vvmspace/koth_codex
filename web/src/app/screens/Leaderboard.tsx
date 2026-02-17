export function Leaderboard({ data }: { data: any }) {
  return (
    <div className="card">
      <h2>Leaderboard</h2>
      <ol className="list">
        {(data?.top || []).map((entry: any) => (
          <li key={entry.user_id}>
            <span>#{entry.rank} {entry.display_name}</span>
            <strong>{entry.steps} steps</strong>
          </li>
        ))}
      </ol>
      <p>Your rank: {data?.current_user_rank ?? 'N/A'}</p>
    </div>
  );
}
