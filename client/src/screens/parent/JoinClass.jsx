import { useState } from 'react';
import { api } from '../../api';
import { useLanguage } from '../../LanguageContext';
import { Body, Field, Header } from '../../components';
import { IconKey, Spinner } from '../../icons';

/** Parent joins a class with the code the teacher gave them. */
export default function JoinClass({ parentId, onJoined, onBack }) {
  const { t } = useLanguage();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit() {
    const joinCode = code.trim();
    setError(null);
    if (!joinCode) {
      setError(t('join_error_empty'));
      return;
    }
    setBusy(true);
    try {
      const klass = await api.joinClass({ joinCode, parentId });
      onJoined(klass);
    } catch (err) {
      setError(err.offline ? t('error_offline') : err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Header title={t('join_title')} onBack={onBack} />
      <Body>
        <div className="flex flex-col items-center gap-3 pb-6 pt-4 text-center">
          <span className="rounded-2xl bg-forest-50 p-3 text-forest-500">
            <IconKey size={24} />
          </span>
          <p className="max-w-[270px] text-[13.5px] leading-relaxed text-ink-mute">
            {t('join_sub')}
          </p>
        </div>

        <Field label={t('join_code_label')} error={error}>
          <input
            className="field text-center font-display text-[22px] font-bold uppercase tracking-[0.18em]"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={t('join_code_placeholder')}
            maxLength={8}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />
        </Field>

        <button onClick={submit} disabled={busy} className="btn-primary mt-5 w-full">
          {busy && <Spinner size={17} />}
          {busy ? t('join_joining') : t('join_submit')}
        </button>
      </Body>
    </>
  );
}
