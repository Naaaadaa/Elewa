import { useState } from 'react';
import { LANGUAGES, useLanguage } from '../LanguageContext';
import { api } from '../api';
import { Field } from '../components';
import { IconCheck, IconParent, IconTeacher, Spinner } from '../icons';

/**
 * Name, phone, role cards. Parents additionally pick a language as chips —
 * choosing Somali or Oromo triggers the one-off translate_ui call before the
 * app is entered, so the parent never sees an English screen.
 */
export default function SignIn({ onSignedIn }) {
  const { t, changeLanguage, prefetchLanguage } = useLanguage();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState(null);
  const [language, setLanguage] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState(null);
  // Kept so that retrying after a failed translation does not create a second
  // account for the same person.
  const [account, setAccount] = useState(null);

  const roles = [
    { key: 'teacher', label: t('role_teacher'), sub: t('role_teacher_sub'), icon: IconTeacher },
    { key: 'parent', label: t('role_parent'), sub: t('role_parent_sub'), icon: IconParent },
  ];

  function validate() {
    const next = {};
    if (!name.trim()) next.name = t('signin_error_name');
    if (!phone.trim()) next.phone = t('signin_error_phone');
    if (role === 'parent' && !language) next.language = t('signin_error_language');
    setErrors(next);
    return Object.keys(next).length === 0 && Boolean(role);
  }

  async function submit() {
    setFailure(null);
    if (!validate()) return;

    setBusy(true);
    try {
      const user =
        account ||
        (await api.createUser({
          name: name.trim(),
          phone: phone.trim(),
          role,
          language: role === 'parent' ? language : 'en',
        }));
      setAccount(user);

      // For a parent, localise the whole interface before entering the app.
      if (role === 'parent' && language && language !== 'en') {
        const result = await changeLanguage(language);
        if (!result.ok) {
          // The provider is showing its own error overlay; stay put.
          setBusy(false);
          return;
        }
      }

      onSignedIn(user);
    } catch (err) {
      setFailure(err.offline ? t('error_offline') : err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="scroll-area flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-8 pt-12">
      <div className="mb-8">
        <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-forest-500">
          <span className="font-display text-[20px] font-bold text-white">E</span>
        </div>
        <h1 className="font-display text-[27px] font-bold leading-tight text-ink">
          {t('app_name')}
        </h1>
        <p className="mt-1 text-[14px] text-ink-mute">{t('app_tagline')}</p>
      </div>

      <h2 className="text-[17px] font-semibold text-ink">{t('signin_heading')}</h2>
      <p className="mb-5 mt-1 text-[13px] leading-relaxed text-ink-mute">{t('signin_sub')}</p>

      <div className="space-y-4">
        <Field label={t('signin_name_label')} error={errors.name}>
          <input
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('signin_name_placeholder')}
            autoComplete="name"
          />
        </Field>

        <Field label={t('signin_phone_label')} error={errors.phone}>
          <input
            className="field"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t('signin_phone_placeholder')}
            inputMode="tel"
            autoComplete="tel"
          />
        </Field>

        <div>
          <span className="label mb-2">{t('signin_role_label')}</span>
          <div className="grid grid-cols-2 gap-2.5">
            {roles.map((r) => {
              const active = role === r.key;
              const Icon = r.icon;
              return (
                <button
                  key={r.key}
                  onClick={() => {
                    setRole(r.key);
                    setAccount(null);
                  }}
                  className={`flex flex-col items-start gap-2 rounded-2xl border p-3.5 text-left transition-all ${
                    active
                      ? 'border-forest-500 bg-forest-50 shadow-card'
                      : 'border-paper-line bg-paper-raised hover:border-ink-faint'
                  }`}
                >
                  <span className={active ? 'text-forest-500' : 'text-ink-faint'}>
                    <Icon size={22} />
                  </span>
                  <span>
                    <span className="block text-[14px] font-semibold text-ink">{r.label}</span>
                    <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-mute">
                      {r.sub}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Language chips: parents only. */}
        {role === 'parent' && (
          <div className="animate-fade-up">
            <span className="label mb-2">{t('signin_language_label')}</span>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((l) => {
                const active = language === l.code;
                return (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code);
                      setAccount(null);
                      // Start translating now so the wait overlaps the form.
                      prefetchLanguage(l.code);
                    }}
                    className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left transition-all ${
                      active
                        ? 'border-forest-500 bg-forest-500 text-white'
                        : 'border-paper-line bg-paper-raised text-ink hover:border-ink-faint'
                    }`}
                  >
                    {active && <IconCheck size={15} />}
                    <span>
                      <span className="block text-[13.5px] font-semibold">{t(l.labelKey)}</span>
                      <span
                        className={`block text-[11px] ${active ? 'text-forest-100' : 'text-ink-faint'}`}
                      >
                        {l.endonym}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.language ? (
              <p className="mt-2 text-[12px] font-medium text-amber-600">{errors.language}</p>
            ) : (
              <p className="mt-2 text-[12px] leading-relaxed text-ink-mute">
                {t('signin_language_hint')}
              </p>
            )}
          </div>
        )}
      </div>

      {failure && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12.5px] text-ink-soft">
          {failure}
        </p>
      )}

      <button
        onClick={submit}
        disabled={busy || !role}
        className="btn-primary mt-7 w-full"
      >
        {busy && <Spinner size={17} />}
        {t('signin_continue')}
      </button>
    </div>
  );
}
