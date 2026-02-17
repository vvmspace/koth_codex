import { useEffect, useState } from 'react';
import { api, setSessionToken } from './api';
import { getTelegramInitData } from './auth';
import { Home } from './screens/Home';
import { Leaderboard } from './screens/Leaderboard';
import { Missions } from './screens/Missions';
import { Premium } from './screens/Premium';
import { Referral } from './screens/Referral';

type Tab = 'home' | 'missions' | 'leaderboard' | 'referral' | 'premium';

export function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [user, setUser] = useState<any>(null);
  const [inventory, setInventory] = useState<any>(null);
  const [missions, setMissions] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [error, setError] = useState('');

  const load = async () => {
    const [inv, m, l] = await Promise.all([
      api('/inventory'),
      api('/missions'),
      api('/leaderboard?limit=20')
    ]);
    setInventory(inv);
    setMissions(m);
    setLeaderboard(l);
  };

  useEffect(() => {
    (async () => {
      try {
        const initData = getTelegramInitData();
        const auth = await api<{ token: string; user: any }>('/auth/telegram', {
          method: 'POST',
          body: JSON.stringify({ initData })
        });
        setSessionToken(auth.token);
        setUser(auth.user);
        await load();
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, []);

  const wake = async () => {
    await api('/action/wake', { method: 'POST', body: '{}' });
    await load();
  };

  const completeMission = async (missionId: string) => {
    await api('/missions', { method: 'POST', body: JSON.stringify({ mission_id: missionId }) });
    await load();
  };

  return (
    <div className="container">
      <h1>King of the Hill</h1>
      {error && <p>{error}</p>}
      <nav>
        <button onClick={() => setTab('home')}>Home</button>
        <button onClick={() => setTab('missions')}>Missions</button>
        <button onClick={() => setTab('leaderboard')}>Leaderboard</button>
        <button onClick={() => setTab('referral')}>Referral</button>
        <button onClick={() => setTab('premium')}>Premium</button>
      </nav>
      {tab === 'home' && <Home inventory={inventory} onWake={wake} />}
      {tab === 'missions' && <Missions data={missions} onComplete={completeMission} />}
      {tab === 'leaderboard' && <Leaderboard data={leaderboard} />}
      {tab === 'referral' && <Referral user={user} />}
      {tab === 'premium' && <Premium />}
    </div>
  );
}
