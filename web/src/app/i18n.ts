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
    | 'home.itemDescriptionSandwiches'
    | 'home.itemDescriptionCoffee'
    | 'home.itemMenuLongTapHint'
    | 'home.itemActivatedStub'
    | 'home.itemActivationError'
    | 'home.rankBadge'
    | 'home.rankTierTop30'
    | 'home.rankTierTop50'
    | 'home.rankTierKeepGoing'
    | 'missions.title'
    | 'missions.complete'
    | 'missions.completed'
    | 'missions.connectWalletAndComplete'
    | 'missions.walletNotConnected'
    | 'leaderboard.title'
    | 'leaderboard.steps'
    | 'leaderboard.yourRank'
    | 'leaderboard.rankNA'
    | 'leaderboard.activityTitle'
    | 'leaderboard.activityHint'
    | 'referral.title'
    | 'referral.copy'
    | 'referral.share'
    | 'referral.rewardsTitle'
    | 'referral.rewardsBody'
    | 'referral.promoIdeasTitle'
    | 'referral.promoIdeasIntro'
    | 'referral.promoIdea1'
    | 'referral.promoIdea2'
    | 'referral.promoIdea3'
    | 'referral.promoIdea4'
    | 'referral.promoIdea5'
    | 'referral.promoIdea6'
    | 'referral.promoIdea7'
    | 'referral.promoIdea8'
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
    'home.wake': 'Wake up the King',
    'home.backpack': '🎒 Backpack',
    'home.backpackEmpty': 'Your backpack is empty. Invite friends to start earning rewards.',
    'home.referralRewardsHint': 'Referral rewards: when your invited friend wakes the King, you get sandwiches. If their invited friend wakes the King too, your friend gets sandwiches and you get coffee (2 levels).',
    'home.itemsFlexHint': 'Sandwiches and coffee are game items that can grant steps through future mechanics. Reward types and effects are configurable for flexible balancing.',
    'home.sandwiches': 'Sandwiches',
    'home.coffee': 'Coffee',
    'home.itemDescriptionSandwiches': 'Sandwich item. Current effects are configurable on backend and can be changed as game economy evolves.',
    'home.itemDescriptionCoffee': 'Coffee item. Current effects are configurable on backend and can be changed as game economy evolves.',
    'home.itemMenuLongTapHint': 'Long tap opens this menu. Tap outside to close.',
    'home.itemActivatedStub': 'Item activated. Effects will be extended in upcoming updates.',
    'home.itemActivationError': 'Could not activate item right now. Please try again.',
    'home.rankBadge': '🏅 Rank {{rank}}/{{total}}',
    'home.rankTierTop30': 'Top 30% 🔥',
    'home.rankTierTop50': 'Top 50% ⚡',
    'home.rankTierKeepGoing': 'Keep pushing 💪',
    'missions.title': 'Missions',
    'missions.complete': 'Complete',
    'missions.completed': 'Completed',
    'missions.connectWalletAndComplete': 'Connect wallet & complete',
    'missions.walletNotConnected': 'TON wallet is not connected yet.',
    'leaderboard.title': 'Leaderboard',
    'leaderboard.steps': '{{steps}} steps',
    'leaderboard.yourRank': 'Your rank: {{rank}}',
    'leaderboard.rankNA': 'N/A',
    'leaderboard.activityTitle': 'Activity matters',
    'leaderboard.activityHint': 'We reward active players. Keep your place inside Top 50%, and push for Top 30% for stronger momentum.',
    'referral.title': 'Referral',
    'referral.copy': 'Copy',
    'referral.share': 'Share',
    'referral.rewardsTitle': 'How rewards work',
    'referral.rewardsBody': 'When your invited friend wakes the King, you get a sandwich. When your friend\'s invited friend wakes the King, your friend gets a sandwich and you get coffee.',
    'referral.promoIdeasTitle': 'Ideas for sharing your link',
    'referral.promoIdeasIntro': 'Promote your referral link where sharing is allowed:',
    'referral.promoIdea1': 'Thematic chats focused on TMA games',
    'referral.promoIdea2': 'Social media posts',
    'referral.promoIdea3': 'Send it directly to a friend',
    'referral.promoIdea4': 'Print a QR code and place it in a permitted public location',
    'referral.promoIdea5': 'Write a post on Reddit',
    'referral.promoIdea6': 'Forum posts',
    'referral.promoIdea7': 'Forum signatures',
    'referral.promoIdea8': 'Links in social profile bios',
    'premium.title': 'Premium',
    'premium.subtitle': 'Connect your TON wallet to prepare for premium features.',
    'premium.connectWallet': 'Connect wallet',
    'premium.buyStub': 'Buy Premium',
    'premium.intentCreated': 'Payment request created.',
    'premium.connectStub': 'Wallet connection will open here.'
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
    'home.wake': 'Despierta al Rey',
    'home.backpack': '🎒 Mochila',
    'home.backpackEmpty': 'Tu mochila está vacía. Invita amigos para empezar a ganar recompensas.',
    'home.referralRewardsHint': 'Recompensas por referidos: cuando tu amigo invitado despierta al Rey, tú ganas sándwiches. Si el amigo de tu amigo también despierta al Rey, tu amigo gana sándwiches y tú ganas café (2 niveles).',
    'home.itemsFlexHint': 'Sándwiches y café son ítems del juego que podrán otorgar pasos con mecánicas futuras. Los tipos de recompensa y sus efectos son configurables para mantener flexibilidad.',
    'home.sandwiches': 'Sándwiches',
    'home.coffee': 'Café',
    'home.itemDescriptionSandwiches': 'Ítem sándwich. Los efectos actuales son configurables en backend y pueden cambiar con la economía del juego.',
    'home.itemDescriptionCoffee': 'Ítem café. Los efectos actuales son configurables en backend y pueden cambiar con la economía del juego.',
    'home.itemMenuLongTapHint': 'La pulsación larga abre este menú. Toca fuera para cerrarlo.',
    'home.itemActivatedStub': 'Ítem activado. Los efectos se ampliarán en próximas actualizaciones.',
    'home.itemActivationError': 'No se pudo activar el ítem ahora. Inténtalo de nuevo.',
    'home.rankBadge': '🏅 Puesto {{rank}}/{{total}}',
    'home.rankTierTop30': 'Top 30% 🔥',
    'home.rankTierTop50': 'Top 50% ⚡',
    'home.rankTierKeepGoing': 'Sigue subiendo 💪',
    'missions.title': 'Misiones',
    'missions.complete': 'Completar',
    'missions.completed': 'Completada',
    'missions.connectWalletAndComplete': 'Conectar wallet y completar',
    'missions.walletNotConnected': 'La wallet TON aún no está conectada.',
    'leaderboard.title': 'Clasificación',
    'leaderboard.steps': '{{steps}} pasos',
    'leaderboard.yourRank': 'Tu posición: {{rank}}',
    'leaderboard.rankNA': 'N/D',
    'leaderboard.activityTitle': 'La actividad importa',
    'leaderboard.activityHint': 'Premiamos a los jugadores activos. Mantente dentro del Top 50% e intenta llegar al Top 30% para crecer más rápido.',
    'referral.title': 'Referidos',
    'referral.copy': 'Copiar',
    'referral.share': 'Compartir',
    'referral.rewardsTitle': 'Cómo funcionan las recompensas',
    'referral.rewardsBody': 'Cuando tu amigo invitado despierta al Rey, recibes un sándwich. Cuando el amigo de tu amigo despierta al Rey, tu amigo recibe un sándwich y tú recibes café.',
    'referral.promoIdeasTitle': 'Ideas para compartir tu enlace',
    'referral.promoIdeasIntro': 'Comparte tu enlace de referido donde esté permitido:',
    'referral.promoIdea1': 'Chats temáticos sobre juegos TMA',
    'referral.promoIdea2': 'Publicaciones en redes sociales',
    'referral.promoIdea3': 'Envíalo directamente a un amigo',
    'referral.promoIdea4': 'Imprime un código QR y colócalo en un lugar público permitido',
    'referral.promoIdea5': 'Escribe una publicación en Reddit',
    'referral.promoIdea6': 'Publicaciones en foros',
    'referral.promoIdea7': 'Firmas en foros',
    'referral.promoIdea8': 'Enlaces en biografías de perfiles sociales',
    'premium.title': 'Premium',
    'premium.subtitle': 'Conecta tu wallet TON para preparar las funciones premium.',
    'premium.connectWallet': 'Conectar wallet',
    'premium.buyStub': 'Comprar Premium',
    'premium.intentCreated': 'Solicitud de pago creada.',
    'premium.connectStub': 'La conexión de wallet se abrirá aquí.'
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
