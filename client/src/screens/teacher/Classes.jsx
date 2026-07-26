import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useLanguage } from '../../LanguageContext';
import { Body, EmptyState, ErrorNote, Header, Loading } from '../../components';
import { IconArchive, IconChevronRight, IconGrid, IconPlus } from '../../icons';

/** "My Classes" — active classes, then archived (past academic years) below. */
export default function Classes({ teacherId, onOpenClass, onCreateClass }) {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    setError(null);
    try {
      setData(await api.listClasses({ teacherId }));
    } catch (err) {
      setError(err.offline ? t('error_offline') : err.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId]);

  return (
    <>
      <Header
        title={t('classes_title')}
        right={
          <button
            onClick={onCreateClass}
            aria-label={t('classes_create')}
            className="mt-0.5 rounded-xl bg-forest-500 p-2 text-white transition-colors hover:bg-forest-600"
          >
            <IconPlus size={19} />
          </button>
        }
      />
      <Body>
        {error && <ErrorNote message={error} onRetry={load} />}

        {!data && !error && <Loading label={t('loading')} />}

        {data && (
          <>
            {data.active.length === 0 && data.archived.length === 0 ? (
              <EmptyState
                icon={IconGrid}
                message={t('classes_empty')}
                action={
                  <button onClick={onCreateClass} className="btn-primary mt-1">
                    <IconPlus size={17} />
                    {t('classes_create')}
                  </button>
                }
              />
            ) : (
              <div className="space-y-5">
                {data.active.length > 0 && (
                  <Section label={t('classes_active')}>
                    {data.active.map((c) => (
                      <ClassRow key={c.id} klass={c} onOpen={() => onOpenClass(c)} />
                    ))}
                  </Section>
                )}

                {data.archived.length > 0 && (
                  <Section label={t('classes_archived')} icon={IconArchive}>
                    {data.archived.map((c) => (
                      <ClassRow key={c.id} klass={c} archived onOpen={() => onOpenClass(c)} />
                    ))}
                  </Section>
                )}
              </div>
            )}
          </>
        )}
      </Body>
    </>
  );
}

function Section({ label, icon: Icon, children }) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-1.5 px-1">
        {Icon && <Icon size={14} className="text-ink-faint" />}
        <h2 className="label">{label}</h2>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function ClassRow({ klass, archived, onOpen }) {
  const { t } = useLanguage();
  return (
    <button
      onClick={onOpen}
      className={`card flex w-full items-center gap-3 p-3.5 text-left transition-shadow hover:shadow-lift ${
        archived ? 'bg-paper-sunk' : ''
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-[15px] font-semibold text-ink">{klass.name}</h3>
          {archived && (
            <span className="chip shrink-0 border-paper-line bg-paper text-ink-mute">
              {t('classes_archived_note')}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-[12.5px] text-ink-mute">
          {klass.subject} · {klass.academicYear}
        </p>
        <p className="mt-1.5 text-[11.5px] text-ink-faint">
          {t('classes_homework_count', { count: klass.homeworkCount })} ·{' '}
          {t('classes_message_count', { count: klass.messageCount })}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-display text-[13px] font-bold tracking-[0.1em] text-forest-500">
          {klass.joinCode}
        </p>
        <IconChevronRight size={18} className="ml-auto mt-1 text-ink-faint" />
      </div>
    </button>
  );
}
