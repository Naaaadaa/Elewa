import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api';
import { useLanguage } from '../../LanguageContext';
import {
  ArchivedBanner,
  Body,
  BottomNav,
  EmptyState,
  ErrorNote,
  Header,
  JoinCode,
  Loading,
  TypeBadge,
} from '../../components';
import { IconBook, IconChat, IconPlus, IconSpark } from '../../icons';
import PostHomework from './PostHomework';
import TeacherMessages from './TeacherMessages';
import Insights from './Insights';

/** Inside a class: Home (feed) / Messages / Insights, with the bottom nav. */
export default function ClassScreen({ klass, onBack }) {
  const { t } = useLanguage();
  const [tab, setTab] = useState('home');
  const [posting, setPosting] = useState(false);
  const [homework, setHomework] = useState(null);
  const [error, setError] = useState(null);

  const loadHomework = useCallback(async () => {
    setError(null);
    try {
      const res = await api.listHomework(klass.id);
      setHomework(res.homework);
    } catch (err) {
      setError(err.offline ? t('error_offline') : err.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [klass.id]);

  useEffect(() => {
    loadHomework();
  }, [loadHomework]);

  const header = (
    <Header
      title={klass.name}
      subtitle={`${klass.subject} · ${klass.academicYear}`}
      onBack={onBack}
    />
  );

  const nav = (
    <BottomNav
      active={tab}
      onSelect={setTab}
      items={[
        { key: 'home', label: t('nav_home'), icon: IconBook },
        { key: 'messages', label: t('nav_messages'), icon: IconChat },
        { key: 'insights', label: t('nav_insights'), icon: IconSpark },
      ]}
    />
  );

  if (posting) {
    return (
      <PostHomework
        klass={klass}
        onBack={() => setPosting(false)}
        onPosted={async () => {
          setPosting(false);
          await loadHomework();
        }}
      />
    );
  }

  return (
    <>
      {tab === 'home' && (
        <>
          {header}
          <Body>
            {klass.archived && <ArchivedBanner year={klass.academicYear} />}

            <div className="mb-4">
              <p className="label mb-2">{t('classes_join_code')}</p>
              <JoinCode code={klass.joinCode} hint={t('classes_join_code_hint')} />
            </div>

            {!klass.archived && (
              <button onClick={() => setPosting(true)} className="btn-primary mb-4 w-full">
                <IconPlus size={17} />
                {t('feed_post_homework')}
              </button>
            )}

            <h2 className="label mb-2 px-1">{t('feed_title')}</h2>

            {error && <ErrorNote message={error} onRetry={loadHomework} />}
            {!homework && !error && <Loading label={t('loading')} />}

            {homework && homework.length === 0 && (
              <EmptyState icon={IconBook} message={t('feed_empty_teacher')} />
            )}

            {homework && homework.length > 0 && (
              <div className="space-y-2">
                {homework.map((item) => (
                  <article key={item.id} className="card p-3.5">
                    <div className="mb-2 flex items-center gap-2">
                      <TypeBadge type={item.type} />
                      <span className="text-[11.5px] text-ink-faint">
                        {item.subject} · {t('post_grade_label')} {item.grade}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink">
                      {item.question}
                    </p>
                    {item.expectations && (
                      <div className="mt-3 rounded-xl bg-paper-sunk p-3">
                        <p className="label mb-1">{t('feed_expectations_label')}</p>
                        <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink-soft">
                          {item.expectations}
                        </p>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </Body>
          {nav}
        </>
      )}

      {tab === 'messages' && (
        <>
          <TeacherMessages
            klass={klass}
            header={
              <Header title={t('messages_title')} subtitle={klass.name} onBack={onBack} />
            }
          />
          {nav}
        </>
      )}

      {tab === 'insights' && (
        <>
          <Insights
            klass={klass}
            header={<Header title={t('insights_title')} subtitle={klass.name} onBack={onBack} />}
          />
          {nav}
        </>
      )}
    </>
  );
}
