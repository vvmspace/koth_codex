export function Missions({ data, onComplete }: { data: any; onComplete: (missionId: string) => Promise<void> }) {
  const completed = new Set((data?.user_missions || []).filter((m: any) => m.status === 'completed').map((m: any) => m.mission_id));
  return (
    <div className="card">
      <h2>Missions</h2>
      {(data?.missions || []).map((m: any) => (
        <div key={m.id} className="card">
          <h3>{m.title}</h3>
          <p>{m.description}</p>
          <p className="small">Type: {m.type}</p>
          <button onClick={() => void onComplete(m.id)} disabled={completed.has(m.id)}>
            {completed.has(m.id) ? 'Completed' : 'Complete'}
          </button>
        </div>
      ))}
    </div>
  );
}
