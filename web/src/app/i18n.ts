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
    | 'settings.title'
    | 'settings.name'
    | 'settings.language'
    | 'settings.languageEnglish'
    | 'settings.languageSpanish'
    | 'settings.save'
    | 'settings.cancel'
    | 'home.kingStatus'
    | 'home.steps'
    | 'home.nextWakeIn'
    | 'home.readyNow'
    | 'home.wake'
    | 'home.backpack'
    | 'home.backpackEmpty'
    | 'home.referralRewardsHint'
    | 'home.itemsFlexHint'
    | 'home.sandwiches'
    | 'home.coffee'
    | 'home.itemTapHint'
    | 'home.itemDescriptionSandwiches'
    | 'home.itemDescriptionCoffee'
    | 'home.itemMenuLongTapHint'
    | 'home.itemActivatedStub'
    | 'home.itemActivationError'
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
    'settings.title': 'Settings',
    'settings.name': 'Name',
    'settings.language': 'Language',
    'settings.languageEnglish': 'English',
    'settings.languageSpanish': 'Spanish',
    'settings.save': 'Save',
    'settings.cancel': 'Cancel',
    'home.kingStatus': '👑 King Status',
    'home.steps': '🏃 {{steps}} steps',
    'home.nextWakeIn': 'Next wake in',
    'home.readyNow': 'Ready now',
    'home.wake': 'Wake up The King',
    'home.backpack': '🎒 Backpack',
    'home.backpackEmpty': 'Your backpack is empty. Invite friends to start earning rewards.',
    'home.referralRewardsHint': 'Referral rewards: when your invited friend wakes the King, you get sandwiches. If their invited friend wakes the King too, your friend gets sandwiches and you get coffee (2 levels).',
    'home.itemsFlexHint': 'Sandwiches and coffee are game items that can grant steps through future mechanics. Reward types and effects are configurable for flexible balancing.',
    'home.sandwiches': 'Sandwiches',
    'home.coffee': 'Coffee',
    'home.itemTapHint': 'Tap an item to activate it. Long tap to open item description.',
    'home.itemDescriptionSandwiches': 'Sandwich item. Current effects are configurable on backend and can be changed as game economy evolves.',
    'home.itemDescriptionCoffee': 'Coffee item. Current effects are configurable on backend and can be changed as game economy evolves.',
    'home.itemMenuLongTapHint': 'Long tap opens this menu. Tap outside to close.',
    'home.itemActivatedStub': 'Item activated. Effects will be extended in upcoming updates.',
    'home.itemActivationError': 'Could not activate item right now. Please try again.',
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
    'settings.title': 'Configuración',
    'settings.name': 'Nombre',
    'settings.language': 'Idioma',
    'settings.languageEnglish': 'Inglés',
    'settings.languageSpanish': 'Español',
    'settings.save': 'Guardar',
    'settings.cancel': 'Cancelar',
    'home.kingStatus': '👑 Estado del Rey',
    'home.steps': '🏃 {{steps}} pasos',
    'home.nextWakeIn': 'Próximo despertar en',
    'home.readyNow': 'Disponible ahora',
    'home.wake': 'Wake up The King',
    'home.backpack': '🎒 Mochila',
    'home.backpackEmpty': 'Tu mochila está vacía. Invita amigos para empezar a ganar recompensas.',
    'home.referralRewardsHint': 'Recompensas por referidos: cuando tu amigo invitado despierta al Rey, tú ganas sándwiches. Si el amigo de tu amigo también despierta al Rey, tu amigo gana sándwiches y tú ganas café (2 niveles).',
    'home.itemsFlexHint': 'Sándwiches y café son ítems del juego que podrán otorgar pasos con mecánicas futuras. Los tipos de recompensa y sus efectos son configurables para mantener flexibilidad.',
    'home.sandwiches': 'Sándwiches',
    'home.coffee': 'Café',
    'home.itemTapHint': 'Toca un ítem para activarlo. Mantén pulsado para abrir la descripción del ítem.',
    'home.itemDescriptionSandwiches': 'Ítem sándwich. Los efectos actuales son configurables en backend y pueden cambiar con la economía del juego.',
    'home.itemDescriptionCoffee': 'Ítem café. Los efectos actuales son configurables en backend y pueden cambiar con la economía del juego.',
    'home.itemMenuLongTapHint': 'La pulsación larga abre este menú. Toca fuera para cerrarlo.',
    'home.itemActivatedStub': 'Ítem activado. Los efectos se ampliarán en próximas actualizaciones.',
    'home.itemActivationError': 'No se pudo activar el ítem ahora. Inténtalo de nuevo.',
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
