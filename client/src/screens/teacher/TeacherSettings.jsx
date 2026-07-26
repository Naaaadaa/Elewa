import { useLanguage } from '../../LanguageContext';
import { Body, Header } from '../../components';
import { IconTeacher } from '../../icons';

/** Teacher account screen — the way out, so you can sign in as someone else. */
export default function TeacherSettings({ user, onBack, onSignOut }) {
  const { t } = useLanguage();

  return (
    <>
      <Header title={t('settings_title')} onBack={onBack} />
      <Body>
        <div className="space-y-5">
          <section className="card flex items-center gap-3 p-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-600">
              <IconTeacher size={20} />
            </span>
            <div className="min-w-0">
              <p className="label mb-0.5">{t('settings_role_label')}</p>
              <p className="truncate text-[15px] font-semibold text-ink">{user.name}</p>
              <p className="mt-0.5 truncate text-[12.5px] text-ink-mute">
                {t('role_teacher')} · {user.phone}
              </p>
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
