import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../api';
import { useLanguage } from '../../LanguageContext';
import { Body, EmptyState, ErrorNote, Header, Loading } from '../../components';
import { IconChat, IconChevronRight, IconSend, Spinner } from '../../icons';

/**
 * Per-class threads. A class has one thread per parent; the teacher picks a
 * parent, then reads and replies. Replies are translated into that parent's
 * language on the way out (handled server-side by POST /messages).
 */
export default function TeacherMessages({ klass, header }) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState(null);
  const [error, setError] = useState(null);
  const [openParentId, setOpenParentId] = useState(null);

  async function load() {
    setError(null);
    try {
      const res = await api.listMessages({ classId: klass.id });
      setMessages(res.messages);
    } catch (err) {
      setError(err.offline ? t('error_offline') : err.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [klass.id]);

  // Group into one thread per parent.
  const threads = useMemo(() => {
    if (!messages) return [];
    const map = new Map();
    for (const m of messages) {
      if (!map.has(m.parentId)) {
        map.set(m.parentId, { parentId: m.parentId, parentName: m.parentName, messages: [] });
      }
      map.get(m.parentId).messages.push(m);
    }
    return [...map.values()];
  }, [messages]);

  const openThread = threads.find((th) => th.parentId === openParentId) || null;

  if (openThread) {
    return (
      <Thread
        klass={klass}
        thread={openThread}
        onBack={() => setOpenParentId(null)}
        onSent={load}
      />
    );
  }

  return (
    <>
      {header}
      <Body>
        {error && <ErrorNote message={error} onRetry={load} />}
        {!messages && !error && <Loading label={t('loading')} />}

        {messages && threads.length === 0 && (
          <EmptyState icon={IconChat} message={t('messages_empty_teacher')} />
        )}

        {threads.length > 0 && (
          <>
            <h2 className="label mb-2 px-1">{t('messages_threads_title')}</h2>
            <div className="space-y-2">
              {threads.map((th) => {
                const last = th.messages[th.messages.length - 1];
                // The teacher reads the English side of a parent's message.
                const preview =
                  last.who === 'parent' ? last.translation || last.text : last.text;
                return (
                  <button
                    key={th.parentId}
                    onClick={() => setOpenParentId(th.parentId)}
                    className="card flex w-full items-center gap-3 p-3.5 text-left transition-shadow hover:shadow-lift"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-50 font-display text-[13px] font-bold text-forest-600">
                      {(th.parentName || '?').charAt(0)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14.5px] font-semibold text-ink">
                        {th.parentName || t('messages_parent')}
                      </p>
                      <p className="mt-0.5 truncate text-[12.5px] text-ink-mute">{preview}</p>
                    </div>
                    <IconChevronRight size={18} className="shrink-0 text-ink-faint" />
                  </button>
                );
              })}
            </div>
          </>
        )}
      </Body>
    </>
  );
}

function Thread({ klass, thread, onBack, onSent }) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [thread.messages.length]);

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      await api.sendMessage({
        classId: klass.id,
        parentId: thread.parentId,
        who: 'teacher',
        text,
      });
      setDraft('');
      await onSent();
    } catch (err) {
      setError(err.offline ? t('error_offline') : err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Header
        title={thread.parentName || t('messages_parent')}
        subtitle={klass.name}
        onBack={onBack}
      />
      <Body className="pb-2">
        <div className="space-y-3">
          {thread.messages.map((m) => (
            <Bubble key={m.id} message={m} mine={m.who === 'teacher'} />
          ))}
          <div ref={endRef} />
        </div>
        {error && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12.5px] text-ink-soft">
            {error}
          </p>
        )}
      </Body>

      <div className="shrink-0 border-t border-paper-line bg-paper-raised px-3 py-3">
        <div className="flex items-end gap-2">
          <textarea
            rows={1}
            className="field max-h-24 min-h-[46px] flex-1 resize-none py-3"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={t('messages_input_placeholder')}
          />
          <button
            onClick={send}
            disabled={sending || !draft.trim()}
            aria-label={t('messages_send')}
            className="btn-primary h-[46px] w-[46px] shrink-0 !px-0"
          >
            {sending ? <Spinner size={17} /> : <IconSend size={18} />}
          </button>
        </div>
        {sending && (
          <p className="mt-1.5 px-1 text-[11px] text-ink-faint">{t('messages_translating')}</p>
        )}
      </div>
    </>
  );
}

/**
 * Teacher view: the teacher's own messages sit right, the parent's left —
 * mirroring the parent's view where their own bubbles are left.
 */
function Bubble({ message, mine }) {
  const { t } = useLanguage();

  // The teacher reads English: their own text as written, and the English
  // translation of what the parent wrote.
  const primary = mine ? message.text : message.translation || message.text;
  const secondary = mine ? message.translation : message.text;

  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[84%]">
        <div
          className={`rounded-2xl px-3.5 py-2.5 ${
            mine
              ? 'rounded-br-md bg-forest-500 text-white'
              : 'rounded-bl-md border border-paper-line bg-paper-raised text-ink'
          }`}
        >
          <p className="whitespace-pre-wrap text-[14px] leading-relaxed">{primary}</p>
        </div>
        {secondary ? (
          <p
            className={`mt-1 px-1 text-[11.5px] leading-snug text-ink-faint ${
              mine ? 'text-right' : ''
            }`}
          >
            {mine ? `${t('messages_translation_label')}: ` : ''}
            {secondary}
          </p>
        ) : (
          <p className={`mt-1 px-1 text-[11px] text-amber-600 ${mine ? 'text-right' : ''}`}>
            {t('messages_translation_failed')}
          </p>
        )}
      </div>
    </div>
  );
}
