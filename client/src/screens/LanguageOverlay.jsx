import { useLanguage } from '../LanguageContext';
import { IconAlert, IconGlobe, Spinner } from '../icons';

/**
 * Covers the screen while translate_ui runs, and takes over if it fails.
 * Because the translation is what makes the rest of the app readable to the
 * parent, this is a blocking state rather than a toast.
 */
export default function LanguageOverlay() {
  const { status, pendingLanguageName, changeLanguage, dismissError, t } = useLanguage();

  if (status === 'ready') return null;

  if (status === 'translating') {
    return (
      <Sheet>
        <span className="text-forest-500">
          <IconGlobe size={30} />
        </span>
        <h2 className="mt-4 text-center font-display text-[18px] font-semibold text-ink">
          {t('translating_title', { language: pendingLanguageName || '' })}
        </h2>
        <p className="mt-1.5 max-w-[250px] text-center text-[13px] leading-relaxed text-ink-mute">
          {t('translating_body')}
        </p>
        <Spinner size={22} className="mt-6 text-forest-500" />
      </Sheet>
    );
  }

  // status === 'error'
  return (
    <Sheet>
      <span className="text-amber-400">
        <IconAlert size={30} />
      </span>
      <p className="mt-4 max-w-[268px] text-center text-[13.5px] leading-relaxed text-ink-soft">
        {t('translating_failed')}
      </p>
      <div className="mt-6 flex w-full max-w-[268px] flex-col gap-2">
        <button
          className="btn-primary w-full"
          onClick={() => {
            const code = pendingLanguageNameToCode(pendingLanguageName);
            dismissError();
            if (code) changeLanguage(code);
          }}
        >
          {t('translating_retry')}
        </button>
        <button className="btn-ghost w-full" onClick={dismissError}>
          {t('translating_continue_english')}
        </button>
      </div>
    </Sheet>
  );
}

function pendingLanguageNameToCode(name) {
  if (name === 'Somali') return 'so';
  if (name === 'Oromo') return 'om';
  return null;
}

function Sheet({ children }) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-paper/97 px-6 backdrop-blur-sm">
      {children}
    </div>
  );
}
