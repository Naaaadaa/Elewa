import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useLanguage } from '../../LanguageContext';
import { AiNote, Body, EmptyState, ErrorNote, Loading } from '../../components';
import { IconRefresh, IconSpark } from '../../icons';

/** Summary + themes across this class's parent messages. */
export default function Insights({ klass, header }) {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setData(await api.insights(klass.id));
    } catch (err) {
      setError(err.offline ? t('error_offline') : `${t('insights_failed')} ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [klass.id]);

  const hasThemes = data?.themes?.length > 0;

  return (
    <>
      {header}
      <Body>
        {loading && <Loading label={t('insights_loading')} />}

        {!loading && error && <ErrorNote message={error} onRetry={load} />}

        {!loading && !error && data && (
          <div className="space-y-5 animate-fade-up">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[12.5px] leading-relaxed text-ink-mute">{t('insights_sub')}</p>
              <button
                onClick={load}
                aria-label={t('insights_refresh')}
                className="shrink-0 rounded-lg border border-paper-line bg-paper-raised p-2 text-ink-mute transition-colors hover:bg-paper-sunk"
              >
                <IconRefresh size={16} />
              </button>
            </div>

            {!hasThemes && !data.summary ? (
              <EmptyState icon={IconSpark} message={t('insights_empty')} />
            ) : (
              <>
                <section className="card p-4">
                  <h2 className="label mb-2">{t('insights_summary_label')}</h2>
                  <p className="text-[14px] leading-relaxed text-ink-soft">{data.summary}</p>
                </section>

                {hasThemes && (
                  <section>
                    <h2 className="label mb-2 px-1">{t('insights_themes_label')}</h2>
                    <div className="space-y-2">
                      {data.themes.map((theme, i) => (
                        <div key={`${theme.label}-${i}`} className="card p-3.5">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-[14px] font-semibold text-ink">{theme.label}</h3>
                            {theme.count > 0 && (
                              <span className="chip shrink-0 border-amber-200 bg-amber-50 text-amber-600">
                                {t('insights_theme_mentions', { count: theme.count })}
                              </span>
                            )}
                          </div>
                          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-mute">
                            {theme.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <AiNote />
              </>
            )}
          </div>
        )}
      </Body>
    </>
  );
}
