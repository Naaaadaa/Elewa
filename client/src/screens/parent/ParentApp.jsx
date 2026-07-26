import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api';
import { LANGUAGES, useLanguage } from '../../LanguageContext';
import {
  Body,
  BottomNav,
  EmptyState,
  ErrorNote,
  Header,
  Loading,
  TypeBadge,
} from '../../components';
import { IconBook, IconChat, IconCheck, IconChevronRight, IconGlobe, IconSettings } from '../../icons';
import JoinClass from './JoinClass';
import HomeworkDetail from './HomeworkDetail';
import ParentMessages from './ParentMessages';

/** Parent flow: join a class, read the feed, open a task, message the teacher. */
export default function ParentApp({ user, onSignOut }) {
  const { t } = useLanguage();
  const [klass, setKlass] = useState(null);
  const [tab, setTab] = useState('home');
  const [openItem, setOpenItem] = useState(null);

  if (!klass) {
    return <JoinClass parentId={user.id} onJoined={setKlass} />;
  }

  const nav = (
    <BottomNav
      active={tab}
      onSelect={(next) => {
        setOpenItem(null);
        setTab(next);
      }}
      items={[
        { key: 'home', label: t('nav_home'), icon: IconBook },
        { key: 'messages', label: t('nav_messages'), icon: IconChat },
        { key: 'settings', label: t('nav_settings'), icon: IconSettings },
      ]}
    />
  );

  if (openItem) {
    return (
      <HomeworkDetail
        item={openItem}
        onBack={() => setOpenItem(null)}
        onAskTeacher={() => {
          setOpenItem(null);
          setTab('messages');
        }}
      />
    );
  }

  return (
    <>
      {tab === 'home' && <Feed klass={klass} onOpen={setOpenItem} />}

      {tab === 'messages' && (
        <ParentMessages
          klass={klass}
          parentId={user.id}
          header={<Header title={t('messages_title')} subtitle={klass.name} />}
        />
      )}

      {tab === 'settings' && (
        <Settings user={user} klass={klass} onSignOut={onSignOut} onLeaveClass={() => setKlass(null)} />
      )}

      {nav}
    </>
  );
}

function Feed({ klass, onOpen }) {
  const { t } = useLanguage();
  const [homework, setHomework] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
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
    load();
  }, [load]);

  return (
    <>
      <Header
        title={t('feed_title')}
        subtitle={
          klass.teacherName ? `${klass.name} · ${klass.teacherName}` : klass.name
        }
      />
      <Body>
        {error && <ErrorNote message={error} onRetry={load} />}
        {!homework && !error && <Loading label={t('loading')} />}

        {homework && homework.length === 0 && (
          <EmptyState icon={IconBook} message={t('feed_empty_parent')} />
        )}

        {homework && homework.length > 0 && (
          <div className="space-y-2">
            {homework.map((item) => (
              <button
                key={item.id}
                onClick={() => onOpen(item)}
                className="card w-full p-3.5 text-left transition-shadow hover:shadow-lift"
              >
                <div className="mb-2 flex items-center gap-2">
                  <TypeBadge type={item.type} />
                  <span className="truncate text-[11.5px] text-ink-faint">{item.subject}</span>
                </div>
                <p className="line-clamp-3 whitespace-pre-wrap text-[14px] leading-relaxed text-ink">
                  {item.question}
                </p>
                <span className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-semibold text-forest-600">
                  {t('feed_tap_to_open')}
                  <IconChevronRight size={15} />
                </span>
              </button>
            ))}
          </div>
        )}
      </Body>
    </>
  );
}

function Settings({ user, klass, onSignOut, onLeaveClass }) {
  const { t, language, changeLanguage, isTranslating } = useLanguage();

  return (
    <>
      <Header title={t('settings_title')} />
      <Body>
        <div className="space-y-5">
          <section className="card p-3.5">
            <p className="label mb-1.5">{t('settings_role_label')}</p>
            <p className="text-[15px] font-semibold text-ink">{user.name}</p>
            <p className="mt-0.5 text-[12.5px] text-ink-mute">
              {t('role_parent')} · {user.phone}
            </p>
          </section>

          <section>
            <div className="mb-2 flex items-center gap-1.5 px-1">
              <IconGlobe size={14} className="text-ink-faint" />
              <p className="label">{t('settings_language_label')}</p>
            </div>
            <div className="space-y-2">
              {LANGUAGES.map((l) => {
                const active = language === l.code;
                return (
                  <button
                    key={l.code}
                    onClick={() => changeLanguage(l.code)}
                    disabled={isTranslating}
                    className={`card flex w-full items-center gap-3 p-3.5 text-left transition-colors ${
                      active ? 'border-forest-400 bg-forest-50' : 'hover:bg-paper-sunk'
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-semibold text-ink">
                        {t(l.labelKey)}
                      </span>
                      <span className="mt-0.5 block text-[11.5px] text-ink-faint">{l.endonym}</span>
                    </span>
                    {active && <IconCheck size={18} className="shrink-0 text-forest-500" />}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <p className="label mb-2 px-1">{t('nav_classes')}</p>
            <div className="card p-3.5">
              <p className="text-[14px] font-semibold text-ink">{klass.name}</p>
              <p className="mt-0.5 text-[12.5px] text-ink-mute">
                {klass.teacherName
                  ? `${t('join_teacher_label')}: ${klass.teacherName}`
                  : klass.subject}
              </p>
              <button
                onClick={onLeaveClass}
                className="mt-3 text-[13px] font-semibold text-forest-600 hover:text-forest-700"
              >
                {t('join_another')}
              </button>
            </div>
          </section>

          <button onClick={onSignOut} className="btn-ghost w-full">
            {t('settings_signout')}
          </button>
        </div>
      </Body>
    </>
  );
}
