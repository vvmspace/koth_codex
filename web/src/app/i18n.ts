export type SupportedLanguage = 'en' | 'es';

type Dictionary = {
  [K in
    | 'tabs.home'
    | 'tabs.missions'
    | 'tabs.leaderboard'
    | 'tabs.referral'
    | 'tabs.premium'
    | 'hero.demo'
    | 'hero.welcome'
    | 'home.kingStatus'
    | 'home.steps'
    | 'home.nextWakeIn'
    | 'home.readyNow'
    | 'home.wake'
    | 'home.backpack'
    | 'home.sandwiches'
    | 'home.coffee'
    | 'missions.title'
    | 'missions.type'
    | 'missions.complete'
    | 'missions.completed'
    | 'leaderboard.title'
    | 'leaderboard.steps'
    | 'leaderboard.yourRank'
    | 'leaderboard.rankNA'
    | 'referral.title'
    | 'referral.copy'
    | 'referral.share'
    | 'referral.safeShare'
    | 'premium.title'
    | 'premium.subtitle'
    | 'premium.connectWallet'
    | 'premium.buyStub'
    | 'premium.intentCreated'
    | 'premium.connectStub']: string;
};

const dictionaries: Record<SupportedLanguage, Dictionary> = {
  en: {
    'tabs.home': 'Home',
    'tabs.missions': 'Quests',
    'tabs.leaderboard': 'Arena',
    'tabs.referral': 'Friends',
    'tabs.premium': 'Boost',
    'hero.demo': 'Demo mode for local preview.',
    'hero.welcome': 'Welcome, {{name}}',
    'home.kingStatus': '👑 King Status',
    'home.steps': '🏃 {{steps}} steps',
    'home.nextWakeIn': 'Next wake in',
    'home.readyNow': 'Ready now',
    'home.wake': 'Wake up The King',
    'home.backpack': '🎒 Backpack',
    'home.sandwiches': 'Sandwiches',
    'home.coffee': 'Coffee',
    'missions.title': 'Missions',
    'missions.type': 'Type: {{type}}',
    'missions.complete': 'Complete',
    'missions.completed': 'Completed',
    'leaderboard.title': 'Leaderboard',
    'leaderboard.steps': '{{steps}} steps',
    'leaderboard.yourRank': 'Your rank: {{rank}}',
    'leaderboard.rankNA': 'N/A',
    'referral.title': 'Referral',
    'referral.copy': 'Copy',
    'referral.share': 'Share',
    'referral.safeShare': 'Option: share this link in chats where it is allowed.',
    'premium.title': 'Premium (TON Scaffold)',
    'premium.subtitle': 'TonConnect UI and on-chain verification will be added later.',
    'premium.connectWallet': 'Connect wallet',
    'premium.buyStub': 'Buy Premium (stub)',
    'premium.intentCreated': 'TON payment intent created (stub).',
    'premium.connectStub': 'TonConnect placeholder: integrate wallet SDK later.'
  },
  es: {
    'tabs.home': 'Inicio',
    'tabs.missions': 'Misiones',
    'tabs.leaderboard': 'Clasificación',
    'tabs.referral': 'Amigos',
    'tabs.premium': 'Premium',
    'hero.demo': 'Modo demo para vista local.',
    'hero.welcome': 'Bienvenido, {{name}}',
    'home.kingStatus': '👑 Estado del Rey',
    'home.steps': '🏃 {{steps}} pasos',
    'home.nextWakeIn': 'Próximo despertar en',
    'home.readyNow': 'Disponible ahora',
    'home.wake': 'Wake up The King',
    'home.backpack': '🎒 Mochila',
    'home.sandwiches': 'Sándwiches',
    'home.coffee': 'Café',
    'missions.title': 'Misiones',
    'missions.type': 'Tipo: {{type}}',
    'missions.complete': 'Completar',
    'missions.completed': 'Completada',
    'leaderboard.title': 'Clasificación',
    'leaderboard.steps': '{{steps}} pasos',
    'leaderboard.yourRank': 'Tu posición: {{rank}}',
    'leaderboard.rankNA': 'N/D',
    'referral.title': 'Referidos',
    'referral.copy': 'Copiar',
    'referral.share': 'Compartir',
    'referral.safeShare': 'Opción: comparte este enlace en chats donde esté permitido.',
    'premium.title': 'Premium (estructura TON)',
    'premium.subtitle': 'TonConnect y la verificación on-chain se agregarán después.',
    'premium.connectWallet': 'Conectar wallet',
    'premium.buyStub': 'Comprar Premium (stub)',
    'premium.intentCreated': 'Intento de pago TON creado (stub).',
    'premium.connectStub': 'Placeholder de TonConnect: integrar SDK de wallet luego.'
  }
};

export function detectLanguage(userLanguageCode?: string | null): SupportedLanguage {
  const raw = (userLanguageCode || navigator.language || 'en').toLowerCase();
  return raw.startsWith('es') ? 'es' : 'en';
}

export function t(lang: SupportedLanguage, key: keyof Dictionary, params?: Record<string, string | number>) {
  const template = dictionaries[lang][key] || dictionaries.en[key];
  if (!params) return template;
  return Object.entries(params).reduce(
    (acc, [paramKey, value]) => acc.replaceAll(`{{${paramKey}}}`, String(value)),
    template
  );
}
