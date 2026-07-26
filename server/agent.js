// The AI layer. Every Anthropic call in Elewa lives here.
// The API key is read from the environment on the server only — it never
// reaches the browser.

import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-4-6';

let client = null;
function anthropic() {
  if (!process.env.ANTHROPIC_API_KEY) {
    const err = new Error(
      'ANTHROPIC_API_KEY is not set. Export it and restart the server.'
    );
    err.status = 503;
    throw err;
  }
  if (!client) client = new Anthropic();
  return client;
}

// ---------------------------------------------------------------- languages

const LANGUAGES = {
  so: { name: 'Somali', endonym: 'Af-Soomaali' },
  om: { name: 'Oromo', endonym: 'Afaan Oromoo' },
  en: { name: 'English', endonym: 'English' },
};

/** Accepts 'so' | 'om' | 'en' or 'Somali' | 'Oromo' | 'English'. */
export function resolveLanguage(input) {
  if (!input) return LANGUAGES.en;
  const key = String(input).trim().toLowerCase();
  if (LANGUAGES[key]) return LANGUAGES[key];
  const byName = Object.values(LANGUAGES).find(
    (l) => l.name.toLowerCase() === key || l.endonym.toLowerCase() === key
  );
  return byName || LANGUAGES.en;
}

// ------------------------------------------------------------ JSON plumbing

/**
 * Claude Sonnet 4.6 does not support the structured-outputs parameter, so we
 * ask for JSON in the prompt and parse defensively: strip markdown fences,
 * then fall back to the outermost {...} span.
 */
function parseJson(text, label) {
  let raw = (text || '').trim();

  const fenced = raw.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenced) raw = fenced[1].trim();

  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(raw.slice(start, end + 1));
      } catch {
        /* fall through */
      }
    }
    const err = new Error(`Model did not return valid JSON for ${label}.`);
    err.status = 502;
    err.detail = raw.slice(0, 800);
    throw err;
  }
}

function textOf(response) {
  return response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');
}

async function ask({ system, user, maxTokens = 4000, label = 'request' }) {
  const response = await anthropic().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
  });

  // Somali and Oromo use noticeably more tokens than the equivalent English,
  // so a budget that looks generous can still cut a reply off mid-sentence.
  // Surface that plainly rather than letting it show up as invalid JSON.
  if (response.stop_reason === 'max_tokens') {
    const err = new Error(
      `The model ran out of output tokens on ${label} (max_tokens: ${maxTokens}). Raise the budget for this action.`
    );
    err.status = 502;
    throw err;
  }

  return textOf(response);
}

async function askJson({ system, user, maxTokens = 4000, label }) {
  return parseJson(await ask({ system, user, maxTokens, label }), label);
}

// ------------------------------------------------------------------ actions

const REGISTER = `You are writing for a parent in Kenya who may have left school early. Use a warm spoken register — the way a kind neighbour explains something on the phone. Short sentences. Everyday words. No academic jargon, no bullet-point voice, no emoji, no markdown formatting.`;

const LITERAL = `Be strictly literal and faithful to the source. Do not add facts, examples, encouragement, context or advice that is not in the source. Do not invent details about the child, the school, or the task. If the source is vague, stay vague.`;

/**
 * explain_homework — turns a CBC task into something a parent can act on,
 * written entirely in their language.
 */
export async function explainHomework({ question, expectations, language }) {
  const lang = resolveLanguage(language);

  const system = `You are Elewa, an assistant that helps Kenyan parents understand their child's CBC (Competency Based Curriculum) homework.

${REGISTER}

${LITERAL} You are explaining THIS task, not homework in general. Everything you say must be traceable to the teacher's words below.

Write every single word of your output in ${lang.name} (${lang.endonym}) — including any labels or lists. Do not write in English unless ${lang.name} is English. If a CBC or subject term has no natural ${lang.name} word, use the plain ${lang.name} description and put the English term in brackets after it once.

Return ONLY a JSON object, no prose around it, with exactly these keys:
{
  "explanation": "2-4 sentences telling the parent what the child has been asked to do, in plain language.",
  "goodAnswerLooksLike": "2-3 sentences describing what a finished, good piece of work would look like — concretely, based only on what the teacher asked for.",
  "rubricNote": "1-2 sentences on what the teacher will be looking at when marking, based only on the teacher's stated expectations. If the teacher gave no expectations, say plainly that the teacher did not say and the parent can ask.",
  "coachingQuestions": ["3 or 4 short questions the parent can ask their child out loud to help them think, without giving the answer away"]
}

The JSON keys stay in English. All values are in ${lang.name}.`;

  const user = `The teacher set this task:

TASK: ${question}

TEACHER'S EXPECTATIONS: ${expectations?.trim() ? expectations : '(the teacher did not write any expectations)'}`;

  const data = await askJson({ system, user, maxTokens: 4000, label: 'explain_homework' });

  return {
    explanation: String(data.explanation || ''),
    goodAnswerLooksLike: String(data.goodAnswerLooksLike || ''),
    rubricNote: String(data.rubricNote || ''),
    coachingQuestions: Array.isArray(data.coachingQuestions)
      ? data.coachingQuestions.map(String)
      : [],
    language: lang.name,
  };
}

/**
 * translate_message — used for the chat thread. Strictly literal: a parent
 * must be able to trust that the teacher read what they actually said.
 * direction: 'parent_to_teacher' translates into English,
 *            'teacher_to_parent' translates into the parent's language.
 */
export async function translateMessage({ text, direction, language }) {
  const lang = resolveLanguage(language);
  const toTeacher = direction === 'parent_to_teacher';
  const target = toTeacher ? { name: 'English', endonym: 'English' } : lang;

  if (!text?.trim()) return { translation: '', language: target.name };

  // Nothing to do if source and target are the same language.
  if (target.name === 'English' && lang.name === 'English') {
    return { translation: text, language: 'English' };
  }

  const system = `You are a message translator inside a school messaging app. You translate one short message at a time between a parent and their child's teacher.

Translate into ${target.name} (${target.endonym}).

${LITERAL} Translate — do not summarize, do not shorten, do not expand, do not soften, do not correct the writer, do not add greetings or sign-offs that are not there. Keep the same tone, the same level of politeness, and the same order of ideas. Keep names, numbers, dates and school terms exactly as written. If part of the message is already in ${target.name}, leave that part as it is.

Return ONLY a JSON object: {"translation": "..."} — nothing else.`;

  const user = `Message to translate:\n\n${text}`;

  const data = await askJson({ system, user, maxTokens: 2500, label: 'translate_message' });

  return {
    translation: String(data.translation ?? '').trim(),
    language: target.name,
  };
}

/**
 * generate_walkthrough — the "Explain another way" button. Spoken steps a
 * parent can follow with the child at the kitchen table.
 */
export async function generateWalkthrough({ question, expectations, language }) {
  const lang = resolveLanguage(language);

  const system = `You are Elewa. A parent has read the explanation of their child's CBC homework and still wants it a different way: as steps they can walk through with the child.

${REGISTER} These steps will be read out loud, so write them the way you would say them.

${LITERAL} The steps must come from the task itself. Do not solve the task for the child and do not invent an example answer.

Write every word in ${lang.name} (${lang.endonym}).

Return ONLY a JSON object: {"steps": ["...", "...", "..."]} with 3 to 5 steps. Each step is one or two short sentences. No numbering inside the strings.`;

  const user = `TASK: ${question}

TEACHER'S EXPECTATIONS: ${expectations?.trim() ? expectations : '(none given)'}`;

  const data = await askJson({ system, user, maxTokens: 3500, label: 'generate_walkthrough' });

  return {
    steps: Array.isArray(data.steps) ? data.steps.map(String).filter(Boolean) : [],
    language: lang.name,
  };
}

/**
 * generate_insights — a teacher-facing read on what parents are actually
 * asking about in one class.
 */
export async function generateInsights({ messages }) {
  const list = Array.isArray(messages) ? messages : [];

  if (list.length === 0) {
    return {
      summary: 'No messages in this class yet. Insights will appear once parents start writing.',
      themes: [],
    };
  }

  const transcript = list
    .map((m) => {
      const who = m.who === 'teacher' ? 'Teacher' : `Parent${m.parentName ? ` (${m.parentName})` : ''}`;
      // Prefer the English version so the analysis reads the same content the teacher does.
      const body = m.who === 'parent' ? m.translation || m.text : m.text;
      return `${who}: ${body}`;
    })
    .join('\n');

  const system = `You are Elewa, helping a Kenyan CBC teacher see patterns across the messages parents have sent about one class.

Write in plain English for the teacher. Be concrete and useful — name the actual things parents raised. Do not invent messages, parents, or concerns that are not in the transcript. Do not give the teacher advice unless it follows directly from what parents said. No emoji, no markdown.

Return ONLY a JSON object with exactly these keys:
{
  "summary": "3-5 sentences on what parents in this class are asking about and where they seem stuck.",
  "themes": [{ "label": "a short 2-5 word theme name", "detail": "one sentence on what parents said about it", "count": <how many messages touch this theme, as a number> }]
}

Give 2 to 5 themes, most common first.`;

  const user = `Message thread for this class:\n\n${transcript}`;

  const data = await askJson({ system, user, maxTokens: 3000, label: 'generate_insights' });

  return {
    summary: String(data.summary || ''),
    themes: Array.isArray(data.themes)
      ? data.themes.map((t) => ({
          label: String(t?.label || ''),
          detail: String(t?.detail || ''),
          count: Number(t?.count) || 0,
        }))
      : [],
  };
}

/**
 * translate_ui — called once per language switch. Takes the whole English UI
 * strings object and returns the same shape with every value translated.
 */
export async function translateUi({ stringsObject, targetLanguage }) {
  const lang = resolveLanguage(targetLanguage);

  if (!stringsObject || typeof stringsObject !== 'object') {
    const err = new Error('translate_ui requires a stringsObject.');
    err.status = 400;
    throw err;
  }

  if (lang.name === 'English') return { strings: stringsObject, language: 'English' };

  const keys = Object.keys(stringsObject);

  const system = `You are localising the interface of Elewa, a phone app used by Kenyan parents to understand their child's school homework and message the teacher.

Translate every value into ${lang.name} (${lang.endonym}).

Rules:
- Return a JSON object with EXACTLY the same keys as the input, in the same order. Never rename, add, drop, merge or reorder a key.
- Translate only the values. Keys stay in English.
- These are interface labels: buttons, headings, navigation items, empty-state lines, placeholders. Keep each one about as short as the English — a button label must still fit on a phone button.
- Warm and plain, the way you would speak to a parent. Not formal or official.
- Keep any {placeholder} in curly braces exactly as it is, in the same place in the sentence.
- Keep the app name "Elewa" as "Elewa".
- Subject names and school terms: use the everyday ${lang.name} word parents actually use. If there is none, keep the English term.
- No emoji. No markdown. No explanations or notes anywhere in your reply.

Return ONLY the JSON object.`;

  const user = `Translate the values of this object into ${lang.name}. It has ${keys.length} keys.\n\n${JSON.stringify(
    stringsObject,
    null,
    2
  )}`;

  const data = await askJson({ system, user, maxTokens: 16000, label: 'translate_ui' });

  // Guarantee the shape the frontend expects: same keys, English fallback for
  // anything the model dropped.
  const out = {};
  for (const key of keys) {
    const value = data[key];
    out[key] = typeof value === 'string' && value.trim() ? value : stringsObject[key];
  }

  return { strings: out, language: lang.name };
}

/**
 * Vision: transcribe just the homework question/task from a real photo of an
 * exercise book, blackboard or printed sheet.
 */
export async function transcribePhoto({ base64, mediaType }) {
  const system = `You read photographs of Kenyan school homework — exercise books, blackboards, printed worksheets, textbook pages — and transcribe the task.

Transcribe ONLY the homework question or task that the pupil has been asked to do. Write it out as text.

Leave out everything else: the pupil's name, the date, the school or class name, page numbers, headings like "Homework" or "Assignment", the teacher's marks or ticks, the pupil's own answers, and anything printed around the edges.

Rules:
- Keep the original wording and the original language. Do not translate. Do not correct grammar or spelling.
- Keep numbering exactly as it appears if there are several parts (1., 2., a), b) ...), one per line.
- If handwriting is genuinely unreadable, put [unclear] in place of just those words.
- Return only the transcribed task text. No preamble, no quotes, no commentary, no markdown.
- If the photo contains no homework task at all, reply with exactly: NO_TASK_FOUND`;

  const response = await anthropic().messages.create({
    model: MODEL,
    max_tokens: 2500,
    system,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: 'Transcribe the homework task in this photo.' },
        ],
      },
    ],
  });

  const text = textOf(response).trim();

  if (!text || text === 'NO_TASK_FOUND') {
    return {
      text: '',
      found: false,
      note: 'No homework task could be read in that photo. Try a closer, better-lit photo, or type the task in.',
    };
  }

  return { text, found: true };
}

export const AGENT_ACTIONS = [
  'explain_homework',
  'translate_message',
  'generate_walkthrough',
  'generate_insights',
  'translate_ui',
];

/** POST /agent router. */
export async function runAgent(action, payload = {}) {
  switch (action) {
    case 'explain_homework':
      return explainHomework(payload);
    case 'translate_message':
      return translateMessage(payload);
    case 'generate_walkthrough':
      return generateWalkthrough(payload);
    case 'generate_insights':
      return generateInsights(payload);
    case 'translate_ui':
      return translateUi(payload);
    default: {
      const err = new Error(
        `Unknown action "${action}". Expected one of: ${AGENT_ACTIONS.join(', ')}.`
      );
      err.status = 400;
      throw err;
    }
  }
}
