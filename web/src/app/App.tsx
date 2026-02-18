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
type BackpackItemKey = 'sandwiches' | 'coffee';

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
  last_awake: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
  wake_interval_ms: 8 * 60 * 60 * 1000
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

export function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [user, setUser] = useState<any>(null);
  const [inventory, setInventory] = useState<any>(null);
  const [missions, setMissions] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [error, setError] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsName, setSettingsName] = useState('');
  const [settingsLanguage, setSettingsLanguage] = useState<SupportedLanguage>('en');
  const isLoadingUser = !user && !error;

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
        last_awake: new Date().toISOString(),
        wake_interval_ms: 8 * 60 * 60 * 1000
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

  const useItem = async (itemKey: BackpackItemKey) => {
    if (isDemoMode) {
      return;
    }

    await api('/items/use', {
      method: 'POST',
      body: JSON.stringify({ item_key: itemKey })
    });
  };

  const openSettings = () => {
    setSettingsName(user?.first_name || '');
    setSettingsLanguage(detectLanguage(user?.language_code));
    setIsSettingsOpen(true);
  };

  const saveSettings = () => {
    setUser((prev: any) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        first_name: settingsName.trim() || prev.first_name,
        language_code: settingsLanguage
      };
    });
    setIsSettingsOpen(false);
  };

  return (
    <div className="container">
      <button type="button" className="hero hero-button" onClick={openSettings}>
        <h1>👑 King of the Hill</h1>
        <p>{isDemoMode ? t(lang, 'hero.demo') : t(lang, 'hero.welcome', { name: user?.first_name || 'King' })}</p>
        <p className="small hero-settings-hint">{t(lang, 'hero.settingsHint')}</p>
      </button>

      {error && <p className="small">{error}</p>}

      <main>
        {tab === 'home' && (
          <Home
            inventory={inventory}
            onWake={wake}
            onItemTap={useItem}
            lang={lang}
            isLoadingUser={isLoadingUser}
          />
        )}
        {tab === 'missions' && <Missions data={missions} onComplete={completeMission} lang={lang} />}
        {tab === 'leaderboard' && <Leaderboard data={leaderboard} lang={lang} />}
        {tab === 'referral' && <Referral user={user} lang={lang} />}
        {tab === 'premium' && <Premium lang={lang} />}
      </main>

      {isSettingsOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={t(lang, 'settings.title')}>
          <button
            type="button"
            className="modal-backdrop"
            aria-label={t(lang, 'settings.cancel')}
            onClick={() => setIsSettingsOpen(false)}
          />
          <div className="card modal-content">
            <h3>{t(lang, 'settings.title')}</h3>

            <label className="field-label" htmlFor="settings-name">
              {t(lang, 'settings.name')}
            </label>
            <input
              id="settings-name"
              value={settingsName}
              onChange={(event) => setSettingsName(event.target.value)}
              placeholder={t(lang, 'settings.name')}
            />

            <label className="field-label" htmlFor="settings-language">
              {t(lang, 'settings.language')}
            </label>
            <select
              id="settings-language"
              value={settingsLanguage}
              onChange={(event) => setSettingsLanguage(event.target.value as SupportedLanguage)}
            >
              <option value="en">{t(lang, 'settings.languageEnglish')}</option>
              <option value="es">{t(lang, 'settings.languageSpanish')}</option>
            </select>

            <div className="row">
              <button type="button" onClick={saveSettings}>
                {t(lang, 'settings.save')}
              </button>
              <button type="button" className="secondary" onClick={() => setIsSettingsOpen(false)}>
                {t(lang, 'settings.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

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
