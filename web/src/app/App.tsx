import { useEffect, useState } from 'react';
import { api, setSessionToken } from './api';
import { getTelegramInitData } from './auth';
import { Home } from './screens/Home';
import { Leaderboard } from './screens/Leaderboard';
import { Missions } from './screens/Missions';
import { Premium } from './screens/Premium';
import { Referral } from './screens/Referral';

type Tab = 'home' | 'missions' | 'leaderboard' | 'referral' | 'premium';

const DEMO_USER = {
  id: 'demo-user',
  first_name: 'Local',
  username: 'demo',
  referral_code: 'demo123'
};

const DEMO_INVENTORY = {
  steps: 10,
  sandwiches: 2,
  coffee: 1,
  next_available_at: new Date(Date.now() - 60_000).toISOString(),
  daily_free_count: 1
};

const DEMO_MISSIONS = {
  missions: [
    {
      id: 'mission-1',
      title: 'Join channel',
      description: 'Join the official channel',
      type: 'join_channel',
      status: 'pending'
    },
    {
      id: 'mission-2',
      title: 'React latest post',
      description: 'Manual confirm mission',
      type: 'manual_confirm',
      status: 'pending'
    }
  ]
};

const DEMO_LEADERBOARD = {
  rows: [
    { user_id: '1', display_name: 'Alice', steps: 25, rank: 1 },
    { user_id: '2', display_name: 'Bob', steps: 20, rank: 2 },
    { user_id: 'demo-user', display_name: 'Local demo', steps: 10, rank: 3 }
  ],
  me: { rank: 3, steps: 10 }
};

export function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [user, setUser] = useState<any>(null);
  const [inventory, setInventory] = useState<any>(null);
  const [missions, setMissions] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [error, setError] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);

  const load = async () => {
    const [inv, m, l] = await Promise.all([api('/inventory'), api('/missions'), api('/leaderboard?limit=20')]);
    setInventory(inv);
    setMissions(m);
    setLeaderboard(l);
  };

  useEffect(() => {
    (async () => {
      try {
        const initData = getTelegramInitData();

        if (!initData && import.meta.env.DEV) {
          setIsDemoMode(true);
          setUser(DEMO_USER);
          setInventory(DEMO_INVENTORY);
          setMissions(DEMO_MISSIONS);
          setLeaderboard(DEMO_LEADERBOARD);
          return;
        }

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
    if (isDemoMode) {
      setInventory((prev: any) => ({
        ...prev,
        steps: (prev?.steps || 0) + 1,
        daily_free_count: Math.min((prev?.daily_free_count || 0) + 1, 3),
        next_available_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
      }));
      return;
    }

    await api('/action/wake', { method: 'POST', body: '{}' });
    await load();
  };

  const completeMission = async (missionId: string) => {
    if (isDemoMode) {
      setMissions((prev: any) => ({
        ...prev,
        missions: (prev?.missions || []).map((mission: any) =>
          mission.id === missionId ? { ...mission, status: 'completed' } : mission
        )
      }));
      return;
    }

    await api('/missions', { method: 'POST', body: JSON.stringify({ mission_id: missionId }) });
    await load();
  };

  return (
    <div className="container">
      <h1>King of the Hill</h1>
      {isDemoMode && <p className="small">Local demo mode: Telegram auth/backend calls are mocked for UI checks.</p>}
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
