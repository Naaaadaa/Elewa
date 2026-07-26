import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api';
import { useLanguage } from '../../LanguageContext';
import { Body, Field, Header, JoinCode } from '../../components';
import { IconCheck, Spinner } from '../../icons';

const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);
const CURRENT_YEAR = String(new Date().getFullYear());

/** Create class -> shows the join code on success. Subjects filtered by CBC grade. */
export default function CreateClass({ teacherId, onBack, onCreated, onOpenClass }) {
  const { t } = useLanguage();

  const [catalogue, setCatalogue] = useState(null);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState(4);
  const [subject, setSubject] = useState('');
  const [year, setYear] = useState(CURRENT_YEAR);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null);

  useEffect(() => {
    api
      .cbcCatalogue()
      .then((res) => setCatalogue(res.catalogue))
      .catch(() => setCatalogue(null));
  }, []);

  const gradeInfo = catalogue?.[grade] || null;
  const subjects = useMemo(() => gradeInfo?.subjects || [], [gradeInfo]);

  // Keep the subject valid whenever the grade changes.
  useEffect(() => {
    if (subjects.length === 0) return;
    if (!subjects.includes(subject)) setSubject(subjects[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects]);

  async function submit() {
    setError(null);
    if (!name.trim()) {
      setError(t('create_class_name_label'));
      return;
    }
    setBusy(true);
    try {
      const klass = await api.createClass({
        name: name.trim(),
        grade,
        subject,
        academicYear: year,
        teacherId,
      });
      setCreated(klass);
      onCreated?.();
    } catch (err) {
      setError(err.offline ? t('error_offline') : err.message);
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <>
        <Header title={t('create_class_created')} onBack={onBack} />
        <Body>
          <div className="flex flex-col items-center gap-4 py-6 text-center animate-fade-up">
            <span className="rounded-2xl bg-forest-50 p-3 text-forest-500">
              <IconCheck size={26} />
            </span>
            <div>
              <h2 className="font-display text-[18px] font-semibold text-ink">{created.name}</h2>
              <p className="mt-1 text-[13px] text-ink-mute">
                {created.subject} · {t('create_class_grade_label')} {created.grade} ·{' '}
                {created.academicYear}
              </p>
            </div>
          </div>

          <p className="label mb-2 text-center">{t('classes_join_code')}</p>
          <JoinCode code={created.joinCode} hint={t('create_class_created_sub')} />

          <button onClick={() => onOpenClass(created)} className="btn-primary mt-6 w-full">
            {t('create_class_go_to_class')}
          </button>
        </Body>
      </>
    );
  }

  return (
    <>
      <Header title={t('create_class_title')} onBack={onBack} />
      <Body>
        <div className="space-y-4">
          <Field label={t('create_class_name_label')}>
            <input
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('create_class_name_placeholder')}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('create_class_grade_label')}>
              <select
                className="field"
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={t('create_class_year_label')}>
              <input className="field" value={year} onChange={(e) => setYear(e.target.value)} />
            </Field>
          </div>

          <Field
            label={t('create_class_subject_label')}
            hint={gradeInfo?.band === 'senior-school' ? 'Core and pathway subjects' : undefined}
          >
            <select
              className="field"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={subjects.length === 0}
            >
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12.5px] text-ink-soft">
            {error}
          </p>
        )}

        <button onClick={submit} disabled={busy} className="btn-primary mt-6 w-full">
          {busy && <Spinner size={17} />}
          {t('create_class_submit')}
        </button>
      </Body>
    </>
  );
}
