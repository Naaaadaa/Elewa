import { useEffect, useRef, useState } from 'react';
import { api } from '../../api';
import { useLanguage } from '../../LanguageContext';
import { Body, EmptyState, ErrorNote, Loading } from '../../components';
import { IconChat, IconSend, Spinner } from '../../icons';

/**
 * Parent chat thread with the teacher.
 * Parent bubbles left, teacher bubbles right, with the translated caption
 * under each bubble so the parent can see both sides of every message.
 */
export default function ParentMessages({ klass, parentId, header }) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState(null);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const endRef = useRef(null);

  async function load() {
    setError(null);
    try {
      const res = await api.listMessages({ classId: klass.id, parentId });
      setMessages(res.messages);
    } catch (err) {
      setError(err.offline ? t('error_offline') : err.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [klass.id, parentId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages?.length]);

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setSendError(null);
    try {
      await api.sendMessage({ classId: klass.id, parentId, who: 'parent', text });
      setDraft('');
      await load();
    } catch (err) {
      setSendError(err.offline ? t('error_offline') : err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {header}
      <Body className="pb-2">
        {error && <ErrorNote message={error} onRetry={load} />}
        {!messages && !error && <Loading label={t('loading')} />}

        {messages && messages.length === 0 && (
          <EmptyState icon={IconChat} message={t('messages_empty_parent')} />
        )}

        {messages && messages.length > 0 && (
          <div className="space-y-3">
            {messages.map((m) => (
              <Bubble key={m.id} message={m} />
            ))}
            <div ref={endRef} />
          </div>
        )}

        {sendError && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12.5px] text-ink-soft">
            {sendError}
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

function Bubble({ message }) {
  const { t } = useLanguage();
  const fromParent = message.who === 'parent';

  // The parent reads their own language: their own words as written, and the
  // translation of what the teacher wrote.
  const primary = fromParent ? message.text : message.translation || message.text;
  const caption = fromParent ? message.translation : message.text;

  return (
    <div className={`flex ${fromParent ? 'justify-start' : 'justify-end'}`}>
      <div className="max-w-[84%]">
        <p
          className={`mb-1 px-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-ink-faint ${
            fromParent ? '' : 'text-right'
          }`}
        >
          {fromParent ? t('messages_you') : t('messages_teacher')}
        </p>
        <div
          className={`rounded-2xl px-3.5 py-2.5 ${
            fromParent
              ? 'rounded-bl-md border border-paper-line bg-paper-raised text-ink'
              : 'rounded-br-md bg-forest-500 text-white'
          }`}
        >
          <p className="whitespace-pre-wrap text-[14px] leading-relaxed">{primary}</p>
        </div>
        {caption ? (
          <p
            className={`mt-1 px-1 text-[11.5px] leading-snug text-ink-faint ${
              fromParent ? '' : 'text-right'
            }`}
          >
            {caption}
          </p>
        ) : (
          <p className={`mt-1 px-1 text-[11px] text-amber-600 ${fromParent ? '' : 'text-right'}`}>
            {t('messages_translation_failed')}
          </p>
        )}
      </div>
    </div>
  );
}
