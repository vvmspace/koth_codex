import { t, type SupportedLanguage } from '../i18n';

export function Settings({
  lang,
  name,
  selectedLanguage,
  onNameChange,
  onLanguageChange,
  onSave
}: {
  lang: SupportedLanguage;
  name: string;
  selectedLanguage: SupportedLanguage;
  onNameChange: (value: string) => void;
  onLanguageChange: (value: SupportedLanguage) => void;
  onSave: () => void;
}) {
  return (
    <div className="card settings-tab">
      <h2>{t(lang, 'settings.title')}</h2>

      <label className="field-label" htmlFor="settings-name">
        {t(lang, 'settings.name')}
      </label>
      <input
        id="settings-name"
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        placeholder={t(lang, 'settings.name')}
      />

      <label className="field-label" htmlFor="settings-language">
        {t(lang, 'settings.language')}
      </label>
      <select
        id="settings-language"
        value={selectedLanguage}
        onChange={(event) => onLanguageChange(event.target.value as SupportedLanguage)}
      >
        <option value="en">{t(lang, 'settings.languageEnglish')}</option>
        <option value="es">{t(lang, 'settings.languageSpanish')}</option>
      </select>

      <div className="row">
        <button type="button" onClick={onSave}>
          {t(lang, 'settings.save')}
        </button>
      </div>
    </div>
  );
}
