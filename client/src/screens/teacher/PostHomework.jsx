import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../api';
import { useLanguage } from '../../LanguageContext';
import { Body, Field, Header } from '../../components';
import { IconCamera, IconCheck, Spinner } from '../../icons';

const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);

/**
 * Post homework. The photo input is a real file picker: the selected File is
 * uploaded to POST /api/homework/photo, which sends it to Claude's vision
 * input, and the transcribed task fills the textarea below.
 */
export default function PostHomework({ klass, onBack, onPosted }) {
  const { t } = useLanguage();
  const fileInput = useRef(null);

  const [catalogue, setCatalogue] = useState(null);
  const [grade, setGrade] = useState(klass.grade);
  const [subject, setSubject] = useState(klass.subject);
  const [type, setType] = useState('practice');
  const [question, setQuestion] = useState('');
  const [expectations, setExpectations] = useState('');

  const [photoName, setPhotoName] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [reading, setReading] = useState(false);
  const [photoStatus, setPhotoStatus] = useState(null); // 'filled' | 'empty' | 'failed'
  const [photoError, setPhotoError] = useState(null);

  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .cbcCatalogue()
      .then((res) => setCatalogue(res.catalogue))
      .catch(() => setCatalogue(null));
  }, []);

  // Release the preview blob URL when it is replaced or the screen unmounts.
  useEffect(() => () => photoPreview && URL.revokeObjectURL(photoPreview), [photoPreview]);

  const subjects = useMemo(() => catalogue?.[grade]?.subjects || [], [catalogue, grade]);

  useEffect(() => {
    if (subjects.length === 0) return;
    if (!subjects.includes(subject)) setSubject(subjects[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects]);

  async function handlePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhotoName(file.name);
    setPhotoStatus(null);
    setPhotoError(null);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setReading(true);

    try {
      const result = await api.transcribePhoto(file);
      if (result.found && result.text) {
        setQuestion(result.text);
        setPhotoStatus('filled');
      } else {
        setPhotoStatus('empty');
      }
    } catch (err) {
      setPhotoStatus('failed');
      setPhotoError(err.offline ? t('error_offline') : err.message);
    } finally {
      setReading(false);
      // Allow re-picking the same file.
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  async function submit() {
    setError(null);
    if (!question.trim()) {
      setError(t('post_error_question'));
      return;
    }
    setPosting(true);
    try {
      await api.createHomework({
        classId: klass.id,
        subject,
        grade,
        type,
        question: question.trim(),
        expectations: expectations.trim(),
      });
      onPosted();
    } catch (err) {
      setError(err.offline ? t('error_offline') : err.message);
    } finally {
      setPosting(false);
    }
  }

  return (
    <>
      <Header title={t('post_title')} subtitle={klass.name} onBack={onBack} />
      <Body>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('post_grade_label')}>
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

            <Field label={t('post_subject_label')}>
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

          {/* Practice / Project toggle */}
          <div>
            <span className="label mb-1.5">{t('post_type_label')}</span>
            <div className="flex gap-1 rounded-xl border border-paper-line bg-paper-sunk p-1">
              {[
                { key: 'practice', label: t('type_practice') },
                { key: 'project', label: t('type_project') },
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => setType(option.key)}
                  className={`flex-1 rounded-lg py-2.5 text-[13.5px] font-semibold transition-colors ${
                    type === option.key
                      ? 'bg-paper-raised text-forest-600 shadow-card'
                      : 'text-ink-mute hover:text-ink'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Real photo upload */}
          <div>
            <span className="label mb-1.5">{t('post_photo_label')}</span>
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handlePhoto}
              className="hidden"
            />

            {photoPreview && (
              <img
                src={photoPreview}
                alt=""
                className="mb-2.5 max-h-44 w-full rounded-xl border border-paper-line object-cover"
              />
            )}

            <button
              onClick={() => fileInput.current?.click()}
              disabled={reading}
              className="btn-ghost w-full"
            >
              <IconCamera size={18} />
              {photoName ? t('post_photo_change') : t('post_photo_choose')}
            </button>

            {reading && (
              <div className="mt-2.5 flex items-center gap-2.5 rounded-xl border border-forest-200 bg-forest-50 px-3 py-2.5">
                <Spinner size={17} className="shrink-0 text-forest-500" />
                <p className="text-[12.5px] font-medium text-forest-700">
                  {t('post_photo_reading')}
                </p>
              </div>
            )}

            {!reading && photoStatus === 'filled' && (
              <div className="mt-2.5 flex items-start gap-2.5 rounded-xl border border-forest-200 bg-forest-50 px-3 py-2.5">
                <IconCheck size={16} className="mt-0.5 shrink-0 text-forest-500" />
                <p className="text-[12.5px] leading-relaxed text-forest-700">
                  {t('post_photo_filled')}
                </p>
              </div>
            )}

            {!reading && photoStatus === 'empty' && (
              <p className="mt-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12.5px] leading-relaxed text-ink-soft">
                {t('post_photo_nothing_found')}
              </p>
            )}

            {!reading && photoStatus === 'failed' && (
              <p className="mt-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12.5px] leading-relaxed text-ink-soft">
                {t('post_photo_failed')}
                {photoError ? ` (${photoError})` : ''}
              </p>
            )}

            {!photoName && !reading && (
              <p className="mt-1.5 text-[12px] leading-relaxed text-ink-mute">
                {t('post_photo_hint')}
              </p>
            )}
          </div>

          <Field label={t('post_question_label')}>
            <textarea
              className="field min-h-[128px] resize-y leading-relaxed"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t('post_question_placeholder')}
            />
          </Field>

          <Field label={t('post_expectations_label')}>
            <textarea
              className="field min-h-[96px] resize-y leading-relaxed"
              value={expectations}
              onChange={(e) => setExpectations(e.target.value)}
              placeholder={t('post_expectations_placeholder')}
            />
          </Field>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12.5px] text-ink-soft">
            {error}
          </p>
        )}

        <button onClick={submit} disabled={posting || reading} className="btn-primary mt-6 w-full">
          {posting && <Spinner size={17} />}
          {posting ? t('post_posting') : t('post_submit')}
        </button>
      </Body>
    </>
  );
}
