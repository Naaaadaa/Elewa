import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useLanguage } from '../../LanguageContext';
import { AiNote, Body, ErrorNote, Header, Loading, TypeBadge } from '../../components';
import { IconChat, IconPlay, IconSpark, Spinner } from '../../icons';

/**
 * The expanded homework card. On open it calls explain_homework in the
 * parent's language. "Explain another way" calls generate_walkthrough.
 * Project tasks additionally show demo video cards.
 */
export default function HomeworkDetail({ item, onBack, onAskTeacher }) {
  const { t, language } = useLanguage();

  const [explanation, setExplanation] = useState(null);
  const [explainError, setExplainError] = useState(null);
  const [explaining, setExplaining] = useState(true);

  const [walkthrough, setWalkthrough] = useState(null);
  const [walkthroughError, setWalkthroughError] = useState(null);
  const [walkingThrough, setWalkingThrough] = useState(false);

  async function explain() {
    setExplaining(true);
    setExplainError(null);
    try {
      const result = await api.agent('explain_homework', {
        question: item.question,
        expectations: item.expectations,
        language,
      });
      setExplanation(result);
    } catch (err) {
      setExplainError(err.offline ? t('error_offline') : `${t('explain_failed')} ${err.message}`);
    } finally {
      setExplaining(false);
    }
  }

  useEffect(() => {
    explain();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id, language]);

  async function buildWalkthrough() {
    setWalkingThrough(true);
    setWalkthroughError(null);
    try {
      const result = await api.agent('generate_walkthrough', {
        question: item.question,
        expectations: item.expectations,
        language,
      });
      setWalkthrough(result.steps || []);
    } catch (err) {
      setWalkthroughError(
        err.offline ? t('error_offline') : `${t('walkthrough_failed')} ${err.message}`
      );
    } finally {
      setWalkingThrough(false);
    }
  }

  return (
    <>
      <Header
        title={item.subject}
        subtitle={`${t('post_grade_label')} ${item.grade}`}
        onBack={onBack}
      />
      <Body>
        {/* The task exactly as the teacher wrote it, never translated — the
            parent may need to show it to the child or the teacher. */}
        <article className="card mb-4 p-3.5">
          <div className="mb-2">
            <TypeBadge type={item.type} />
          </div>
          <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink">
            {item.question}
          </p>
        </article>

        {explaining && <Loading label={t('explain_loading')} />}

        {!explaining && explainError && <ErrorNote message={explainError} onRetry={explain} />}

        {!explaining && explanation && (
          <div className="space-y-3 animate-fade-up">
            <Panel label={t('explain_what_label')} tone="forest">
              {explanation.explanation}
            </Panel>

            <Panel label={t('explain_good_label')}>{explanation.goodAnswerLooksLike}</Panel>

            <Panel label={t('explain_rubric_label')} tone="amber">
              {explanation.rubricNote}
            </Panel>

            {explanation.coachingQuestions?.length > 0 && (
              <section className="card p-3.5">
                <h2 className="label mb-2.5">{t('explain_questions_label')}</h2>
                <ul className="space-y-2.5">
                  {explanation.coachingQuestions.map((q, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-forest-400" />
                      <span className="text-[14px] leading-relaxed text-ink-soft">{q}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Explain another way -> walkthrough */}
            {!walkthrough && (
              <button
                onClick={buildWalkthrough}
                disabled={walkingThrough}
                className="btn-ghost w-full"
              >
                {walkingThrough ? <Spinner size={17} /> : <IconSpark size={17} />}
                {walkingThrough ? t('walkthrough_loading') : t('explain_another_way')}
              </button>
            )}

            {walkthroughError && <ErrorNote message={walkthroughError} onRetry={buildWalkthrough} />}

            {walkthrough && walkthrough.length > 0 && (
              <section className="card p-3.5 animate-fade-up">
                <h2 className="label mb-3">{t('walkthrough_label')}</h2>
                <ol className="space-y-3">
                  {walkthrough.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest-500 font-display text-[11.5px] font-bold text-white">
                        {i + 1}
                      </span>
                      <span className="pt-0.5 text-[14px] leading-relaxed text-ink-soft">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Project work: demo video cards. Clearly labelled as demo data. */}
            {item.type === 'project' && item.videos?.length > 0 && (
              <section>
                <h2 className="label mb-2 px-1">{t('videos_label')}</h2>
                <div className="space-y-2">
                  {item.videos.map((video, i) => (
                    <div key={i} className="card flex items-center gap-3 p-3">
                      <span className="flex h-11 w-14 shrink-0 items-center justify-center rounded-lg bg-paper-sunk text-ink-faint">
                        <IconPlay size={20} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-medium leading-snug text-ink">
                          {video.title}
                        </p>
                        <p className="mt-1 text-[11.5px] text-ink-faint">
                          {video.channel} · {video.duration}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-2 px-1 text-[11px] leading-relaxed text-ink-faint">
                  {t('videos_demo_note')}
                </p>
              </section>
            )}

            <button onClick={onAskTeacher} className="btn-amber w-full">
              <IconChat size={17} />
              {t('ask_teacher')}
            </button>

            <AiNote />
          </div>
        )}
      </Body>
    </>
  );
}

function Panel({ label, children, tone }) {
  const border =
    tone === 'forest'
      ? 'border-forest-200 bg-forest-50'
      : tone === 'amber'
        ? 'border-amber-200 bg-amber-50'
        : 'border-paper-line bg-paper-raised';

  return (
    <section className={`rounded-2xl border p-3.5 shadow-card ${border}`}>
      <h2 className="label mb-1.5">{label}</h2>
      <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink-soft">{children}</p>
    </section>
  );
}
