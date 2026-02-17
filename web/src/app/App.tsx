import { useEffect, useMemo, useState } from 'react';
import { api, setSessionToken } from './api';
import { getTelegramInitData } from './auth';
import { detectLanguage, t, type SupportedLanguage } from './i18n';
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
  referral_code: 'demo123',
  language_code: null
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
  top: [
    { user_id: '1', display_name: 'Alice', country_flag: '🇪🇸', steps: 25, rank: 1 },
    { user_id: '2', display_name: 'Bob', country_flag: '🇺🇸', steps: 20, rank: 2 },
    { user_id: 'demo-user', display_name: 'Local demo', country_flag: '🏁', steps: 10, rank: 3 }
  ],
  current_user_rank: 3
};

const tabs: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'missions', label: 'Quests', icon: '🎯' },
  { id: 'leaderboard', label: 'Arena', icon: '🏆' },
  { id: 'referral', label: 'Friends', icon: '👥' },
  { id: 'premium', label: 'Boost', icon: '💎' }
];

export function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [user, setUser] = useState<any>(null);
  const [inventory, setInventory] = useState<any>(null);
  const [missions, setMissions] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [error, setError] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);

  const lang: SupportedLanguage = useMemo(() => detectLanguage(user?.language_code), [user?.language_code]);

  const tabs: Array<{ id: Tab; label: string; icon: string }> = useMemo(
    () => [
      { id: 'home', label: t(lang, 'tabs.home'), icon: '🏠' },
      { id: 'missions', label: t(lang, 'tabs.missions'), icon: '🎯' },
      { id: 'leaderboard', label: t(lang, 'tabs.leaderboard'), icon: '🏆' },
      { id: 'referral', label: t(lang, 'tabs.referral'), icon: '👥' },
      { id: 'premium', label: t(lang, 'tabs.premium'), icon: '💎' }
    ],
    [lang]
  );

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
      <header className="hero">
        <h1>👑 King of the Hill</h1>
        <p>{isDemoMode ? t(lang, 'hero.demo') : t(lang, 'hero.welcome', { name: user?.first_name || 'King' })}</p>
      </header>

      {error && <p className="small">{error}</p>}

      <main>
        {tab === 'home' && <Home inventory={inventory} onWake={wake} lang={lang} />}
        {tab === 'missions' && <Missions data={missions} onComplete={completeMission} lang={lang} />}
        {tab === 'leaderboard' && <Leaderboard data={leaderboard} lang={lang} />}
        {tab === 'referral' && <Referral user={user} lang={lang} />}
        {tab === 'premium' && <Premium lang={lang} />}
      </main>

      <nav className="bottom-tabs" aria-label="Main navigation">
        {tabs.map((item) => (
          <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}>
            <span className="tab-icon" aria-hidden="true">{item.icon}</span>
            <span className="tab-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
