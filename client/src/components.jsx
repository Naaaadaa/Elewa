import { useLanguage } from './LanguageContext';
import {
  IconAlert,
  IconArchive,
  IconChevronLeft,
  IconRefresh,
  Spinner,
} from './icons';

/** The 390px phone presentation frame the whole app lives inside. */
export function PhoneFrame({ children }) {
  return (
    <div className="min-h-screen w-full bg-paper-sunk px-4 py-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-[390px] flex-col">
        <div className="relative h-[812px] w-full overflow-hidden rounded-[2.25rem] bg-paper shadow-phone">
          <div className="flex h-full flex-col">{children}</div>
        </div>
        <p className="mt-4 text-center text-[11px] text-ink-faint">
          Elewa — CBC homework, in the language you speak
        </p>
      </div>
    </div>
  );
}

/** Sticky screen header. Pass onBack to get a back chevron. */
export function Header({ title, subtitle, onBack, right }) {
  const { t } = useLanguage();
  return (
    <header className="flex shrink-0 items-start gap-2 border-b border-paper-line bg-paper/95 px-4 pb-3 pt-5 backdrop-blur">
      {onBack && (
        <button
          onClick={onBack}
          aria-label={t('action_back')}
          className="-ml-1.5 mt-0.5 rounded-lg p-1.5 text-ink-soft transition-colors hover:bg-paper-sunk"
        >
          <IconChevronLeft size={22} />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[19px] font-semibold leading-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-0.5 truncate text-[12.5px] text-ink-mute">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}

/** Scrollable body region between the header and the bottom nav. */
export function Body({ children, className = '' }) {
  return (
    <div className={`scroll-area min-h-0 flex-1 overflow-y-auto px-4 py-4 ${className}`}>
      {children}
    </div>
  );
}

export function BottomNav({ items, active, onSelect }) {
  return (
    <nav className="flex shrink-0 items-stretch gap-1 border-t border-paper-line bg-paper-raised px-2 pb-5 pt-2">
      {items.map((item) => {
        const isActive = item.key === active;
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            onClick={() => onSelect(item.key)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 transition-colors ${
              isActive ? 'text-forest-500' : 'text-ink-faint hover:text-ink-mute'
            }`}
          >
            <Icon size={21} />
            <span className="max-w-full truncate text-[10.5px] font-semibold tracking-[0.01em]">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export function TypeBadge({ type }) {
  const { t } = useLanguage();
  const isProject = type === 'project';
  return (
    <span
      className={`chip ${
        isProject
          ? 'border-amber-200 bg-amber-50 text-amber-600'
          : 'border-forest-200 bg-forest-50 text-forest-600'
      }`}
    >
      {isProject ? t('type_project') : t('type_practice')}
    </span>
  );
}

/** Centred loading state with a caption — used for every in-flight AI call. */
export function Loading({ label, sub }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center animate-fade-up">
      <Spinner size={26} className="text-forest-500" />
      <div>
        <p className="text-[14px] font-medium text-ink">{label}</p>
        {sub && <p className="mt-1 text-[12.5px] text-ink-mute">{sub}</p>}
      </div>
    </div>
  );
}

export function ErrorNote({ message, onRetry }) {
  const { t } = useLanguage();
  return (
    <div className="card flex items-start gap-3 border-amber-200 bg-amber-50 p-3.5">
      <IconAlert size={19} className="mt-0.5 shrink-0 text-amber-500" />
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] leading-relaxed text-ink-soft">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-forest-600 hover:text-forest-700"
          >
            <IconRefresh size={15} />
            {t('action_retry')}
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, message, action }) {
  return (
    <div className="flex flex-col items-center gap-3 px-8 py-14 text-center">
      {Icon && (
        <div className="rounded-2xl bg-paper-sunk p-3 text-ink-faint">
          <Icon size={24} />
        </div>
      )}
      <p className="text-[13.5px] leading-relaxed text-ink-mute">{message}</p>
      {action}
    </div>
  );
}

export function ArchivedBanner({ year }) {
  const { t } = useLanguage();
  return (
    <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-paper-line bg-paper-sunk px-3 py-2.5">
      <IconArchive size={17} className="shrink-0 text-ink-mute" />
      <p className="text-[12.5px] text-ink-soft">{t('archived_banner', { year })}</p>
    </div>
  );
}

/** The join code, styled to be read aloud from a stage. */
export function JoinCode({ code, hint }) {
  return (
    <div className="rounded-2xl border border-dashed border-forest-300 bg-forest-50 px-4 py-3.5 text-center">
      <p className="font-display text-[26px] font-bold tracking-[0.16em] text-forest-600">{code}</p>
      {hint && <p className="mt-1.5 text-[12px] leading-relaxed text-ink-mute">{hint}</p>}
    </div>
  );
}

export function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      {label && <span className="label mb-1.5">{label}</span>}
      {children}
      {hint && !error && <span className="mt-1.5 block text-[12px] text-ink-mute">{hint}</span>}
      {error && <span className="mt-1.5 block text-[12px] font-medium text-amber-600">{error}</span>}
    </label>
  );
}

/** AI-provenance footnote — parents should know what is machine-generated. */
export function AiNote() {
  const { t } = useLanguage();
  return (
    <p className="px-1 pt-1 text-[11px] leading-relaxed text-ink-faint">{t('powered_by_ai')}</p>
  );
}
