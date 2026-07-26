/**
 * Exercises every real AI feature against the running backend.
 *
 *   export ANTHROPIC_API_KEY=sk-ant-...
 *   npm run dev          # in one terminal
 *   npm run smoke        # in another
 *
 * Nothing here is mocked — each check is a live Claude call through the
 * backend, the same path the UI uses.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const BASE = process.env.ELEWA_API || 'http://localhost:5174/api';
const here = dirname(fileURLToPath(import.meta.url));

let passed = 0;
let failed = 0;

const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;

async function check(name, fn) {
  const started = Date.now();
  process.stdout.write(`  ${name} ... `);
  try {
    const detail = await fn();
    const secs = ((Date.now() - started) / 1000).toFixed(1);
    console.log(`${green('ok')} ${dim(`${secs}s`)}`);
    if (detail) console.log(detail.split('\n').map((l) => `      ${dim(l)}`).join('\n'));
    passed++;
  } catch (err) {
    console.log(red('FAILED'));
    console.log(`      ${red(err.message)}`);
    if (err.detail) console.log(`      ${dim(String(err.detail).slice(0, 400))}`);
    failed++;
  }
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(json?.error || `HTTP ${res.status}`);
    err.detail = json?.detail;
    throw err;
  }
  return json;
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
  return json;
}

const agent = (action, payload) => post('/agent', { action, payload });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

/** Rough check that a string is not just English — Somali/Oromo function words. */
function looksNonEnglish(text, language) {
  const markers =
    language === 'so'
      ? ['waa', 'ku', 'ka', 'iyo', 'in', 'uu', 'aad', 'oo', 'kartaa', 'wax']
      : ['fi', 'akka', 'kan', 'ni', 'isa', 'hin', 'jira', 'keessa', 'qaba', 'baru'];
  const words = text.toLowerCase().split(/\s+/);
  return markers.some((m) => words.includes(m));
}

console.log(bold('\nElewa — live AI smoke test'));
console.log(dim(`  ${BASE}\n`));

const health = await get('/health').catch(() => null);
if (!health) {
  console.log(red('  Backend is not reachable. Run `npm run dev` first.\n'));
  process.exit(1);
}
if (!health.apiKeyConfigured) {
  console.log(red('  ANTHROPIC_API_KEY is not set on the server.'));
  console.log(dim('  export ANTHROPIC_API_KEY=sk-ant-... then restart `npm run dev`.\n'));
  process.exit(1);
}

const classes = await get('/classes');
const grade4 = classes.active.find((c) => c.joinCode === 'BLUE24') || classes.active[0];
const homework = (await get(`/homework?classId=${grade4.id}`)).homework;
const project = homework.find((h) => h.type === 'project') || homework[0];

// 1 --------------------------------------------------------- explain_homework
await check('explain_homework (Somali)', async () => {
  const r = await agent('explain_homework', {
    question: project.question,
    expectations: project.expectations,
    language: 'so',
  });
  assert(r.explanation?.length > 30, 'explanation is missing or too short');
  assert(r.goodAnswerLooksLike?.length > 20, 'goodAnswerLooksLike is missing');
  assert(r.rubricNote?.length > 10, 'rubricNote is missing');
  assert(r.coachingQuestions?.length >= 3, `expected 3+ coaching questions, got ${r.coachingQuestions?.length}`);
  assert(looksNonEnglish(r.explanation, 'so'), `explanation does not look like Somali: "${r.explanation.slice(0, 80)}"`);
  return `${r.explanation.slice(0, 110)}...\n${r.coachingQuestions.length} coaching questions`;
});

// 2 ------------------------------------------------------ explain_homework/Oromo
await check('explain_homework (Oromo)', async () => {
  const r = await agent('explain_homework', {
    question: project.question,
    expectations: project.expectations,
    language: 'om',
  });
  assert(r.explanation?.length > 30, 'explanation is missing');
  assert(looksNonEnglish(r.explanation, 'om'), `explanation does not look like Oromo: "${r.explanation.slice(0, 80)}"`);
  return `${r.explanation.slice(0, 110)}...`;
});

// 3 ------------------------------------------------------- generate_walkthrough
await check('generate_walkthrough (Somali)', async () => {
  const r = await agent('generate_walkthrough', {
    question: project.question,
    expectations: project.expectations,
    language: 'so',
  });
  assert(r.steps?.length >= 3 && r.steps.length <= 5, `expected 3-5 steps, got ${r.steps?.length}`);
  assert(r.steps.every((s) => s.length > 10), 'a step is suspiciously short');
  return r.steps.map((s, i) => `${i + 1}. ${s.slice(0, 80)}`).join('\n');
});

// 4 --------------------------------------------------------- translate_message
await check('translate_message (Somali -> English, literal)', async () => {
  const source = 'Macallin, wiilkaygu wuu jiran yahay maanta, ma dhaafi karaa hawsha ilaa berri?';
  const r = await agent('translate_message', {
    text: source,
    direction: 'parent_to_teacher',
    language: 'so',
  });
  assert(r.translation?.length > 10, 'translation is missing');
  assert(!/\bmacallin\b/i.test(r.translation), 'translation still contains untranslated Somali');
  // Literalness: should not be padded out far beyond the source length.
  assert(
    r.translation.length < source.length * 2.4,
    `translation looks expanded rather than literal (${r.translation.length} vs ${source.length} chars)`
  );
  return `"${source}"\n-> "${r.translation}"`;
});

await check('translate_message (English -> Oromo)', async () => {
  const r = await agent('translate_message', {
    text: 'Please send the project to school on Friday. She does not need to buy anything.',
    direction: 'teacher_to_parent',
    language: 'om',
  });
  assert(r.translation?.length > 10, 'translation is missing');
  assert(looksNonEnglish(r.translation, 'om'), `does not look like Oromo: "${r.translation}"`);
  return `-> "${r.translation}"`;
});

// 5 ---------------------------------------------------------- generate_insights
await check('generate_insights', async () => {
  const messages = (await get(`/messages?classId=${grade4.id}`)).messages;
  assert(messages.length > 0, 'no seeded messages to summarise');
  const r = await agent('generate_insights', { messages });
  assert(r.summary?.length > 50, 'summary is missing or too short');
  assert(r.themes?.length >= 2, `expected 2+ themes, got ${r.themes?.length}`);
  assert(r.themes.every((th) => th.label && th.detail), 'a theme is missing label or detail');
  return `${r.summary.slice(0, 130)}...\nthemes: ${r.themes.map((th) => th.label).join(' | ')}`;
});

// 6 --------------------------------------------------------------- translate_ui
await check('translate_ui (full interface -> Somali, one call)', async () => {
  const { STRINGS } = await import('../client/src/strings.js');
  const keys = Object.keys(STRINGS);
  const r = await agent('translate_ui', { stringsObject: STRINGS, targetLanguage: 'so' });

  const returned = Object.keys(r.strings);
  assert(returned.length === keys.length, `key count changed: ${keys.length} in, ${returned.length} out`);
  const missing = keys.filter((k) => !(k in r.strings));
  assert(missing.length === 0, `missing keys: ${missing.slice(0, 5).join(', ')}`);

  const unchanged = keys.filter((k) => r.strings[k] === STRINGS[k]);
  // A handful legitimately stay the same ("Elewa"); most must have changed.
  assert(
    unchanged.length < keys.length * 0.25,
    `${unchanged.length}/${keys.length} values came back untranslated`
  );

  // Placeholders must survive.
  const withPlaceholders = keys.filter((k) => /\{\w+\}/.test(STRINGS[k]));
  for (const k of withPlaceholders) {
    const wanted = STRINGS[k].match(/\{\w+\}/g) || [];
    for (const p of wanted) {
      assert(r.strings[k].includes(p), `placeholder ${p} lost from key "${k}": "${r.strings[k]}"`);
    }
  }

  return [
    `${keys.length} keys in, ${returned.length} out, ${unchanged.length} unchanged`,
    `${withPlaceholders.length} placeholder strings verified intact`,
    `nav_home       -> ${r.strings.nav_home}`,
    `feed_post_homework -> ${r.strings.feed_post_homework}`,
    `explain_another_way -> ${r.strings.explain_another_way}`,
  ].join('\n');
});

// 7 ------------------------------------------- vision: real photo transcription
await check('POST /homework/photo (real image upload -> vision)', async () => {
  const bytes = readFileSync(join(here, '..', 'fixtures', 'homework-sample.png'));
  const form = new FormData();
  form.append('photo', new Blob([bytes], { type: 'image/png' }), 'homework-sample.png');

  const res = await fetch(`${BASE}/homework/photo`, { method: 'POST', body: form });
  const r = await res.json();
  if (!res.ok) throw new Error(r.error || `HTTP ${res.status}`);

  assert(r.found, `no task found in the image: ${r.note || ''}`);
  assert(/water cycle/i.test(r.text), `expected the water cycle task, got: "${r.text}"`);
  assert(/evaporation/i.test(r.text), 'the four parts to label were not transcribed');
  // The prompt says to leave out the pupil's name, school and page furniture.
  assert(!/faiza/i.test(r.text), 'pupil name leaked into the transcription');
  assert(!/nairobi primary/i.test(r.text), 'school name leaked into the transcription');
  return r.text.split('\n').join('\n');
});

// 8 ------------------------- end-to-end: sending a message translates it live
await check('POST /messages translates on the way through', async () => {
  const parent = await post('/users', {
    name: 'Smoke Test Parent',
    phone: '+254 700 000 000',
    role: 'parent',
    language: 'so',
  });
  await post('/classes/join', { joinCode: grade4.joinCode, parentId: parent.id });

  const sent = await post('/messages', {
    classId: grade4.id,
    parentId: parent.id,
    who: 'parent',
    text: 'Macallin, ma jiraa wax kale oo aan u diyaariyo carruurta berri?',
  });

  assert(!sent.translationError, `translation failed: ${sent.translationError}`);
  assert(sent.translation?.length > 10, 'message stored without a translation');
  assert(sent.translationLanguage === 'English', `expected English, got ${sent.translationLanguage}`);

  const reply = await post('/messages', {
    classId: grade4.id,
    parentId: parent.id,
    who: 'teacher',
    text: 'No, nothing else. Just bring the exercise book tomorrow.',
  });
  assert(reply.translationLanguage === 'Somali', `teacher reply not translated to Somali`);
  assert(looksNonEnglish(reply.translation, 'so'), `reply translation looks English: "${reply.translation}"`);

  return `parent -> "${sent.translation}"\nteacher -> "${reply.translation}"`;
});

console.log(
  `\n  ${passed} passed${failed ? red(`, ${failed} failed`) : ''}\n`
);
process.exit(failed ? 1 : 0);
