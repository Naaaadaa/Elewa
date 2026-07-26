# Elewa

Helping Somali- and Oromo-speaking Kenyan parents understand their child's CBC
homework and talk to their child's teacher.

The hard part isn't the homework. It's that a parent can be handed a Grade 4
science task written in English, with no idea what "good work" looks like, and no
shared language with the teacher to ask. Elewa closes both gaps: it explains the
task in the parent's own language, and it translates the conversation both ways.

## Run it

```bash
export ANTHROPIC_API_KEY=sk-ant-...   # backend only — never reaches the browser
npm install
npm run dev                           # starts the API and the web app together
```

- Web app: http://localhost:5173
- API: http://localhost:5174

The startup log prints the seeded join codes.

To verify every AI feature end to end against live Claude calls:

```bash
npm run smoke
```

## Demo path

**Parent**  Sign in as a Parent, pick **Somali** → the whole interface is
translated in one call before you land on a screen. Join with code **`BLUE24`**.
Tap the water-filter task: explanation, what good work looks like, what the
teacher is marking, and questions to ask your child — all in Somali. Tap
**Explain another way** for spoken steps. Project tasks also show demo video
cards. Go to Messages, write in Somali; the teacher receives English.

**Teacher**  Sign in as a Teacher (you take over the seeded demo account, so the
classes are already there). `Grade 4 Blue` and `Grade 7 East` are active,
`Grade 3 Green` is archived from 2025 and read-only. Inside a class: post
homework with a **real photo** of an exercise book — the file goes to Claude
vision and the transcribed task fills the textarea. Messages shows one thread per
parent with both languages. Insights summarises what parents are actually stuck on.

A sample photo to test the vision flow with is in `fixtures/homework-sample.png`.

## How it fits together

```
client/  React + Vite + Tailwind, 390px mobile-first, phone-frame presentation
server/  Node + Express, in-memory store, the only place the API key exists
```

| File | What lives there |
| --- | --- |
| `server/agent.js` | Every Claude call. Model: `claude-sonnet-4-6` |
| `server/cbc.js` | CBC subject lists by grade band, used for dropdowns and validation |
| `server/store.js` | In-memory data + seed (1 teacher, 3 classes, 5 homework, 6 messages) |
| `client/src/strings.js` | Every piece of interface text, in English, in one flat object |
| `client/src/LanguageContext.jsx` | Sends that object to `translate_ui` once, caches, re-renders everything |

### The localisation flow

This is the distinctive part. All UI text lives in one flat object of 144 keys in
`strings.js`. No screen hardcodes a string — every screen calls `t('key')`.

When a parent picks Somali or Oromo, `LanguageContext` sends the **whole object**
to `POST /agent { action: "translate_ui" }` in a single call, caches the result
in React state (per language, in memory — no localStorage), and the entire
parent-facing UI re-renders in that language. English skips the call entirely.
Switching back to a language already fetched is instant from cache.

The backend guarantees the response has exactly the keys it was given, falling
back to English for any value the model drops, so the UI can never render blank.
Placeholders like `{count}` are preserved and verified by the smoke test.

### Endpoints

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/api/users` | Sign in; teachers take over the seeded demo account |
| `POST` | `/api/classes` | Validates the subject against the CBC list for that grade |
| `POST` | `/api/classes/join` | By join code; archived classes are refused |
| `GET` | `/api/classes?teacherId=` | Returns `{ active, archived }` separately |
| `POST` `GET` | `/api/homework` | `type` is `practice` or `project` |
| `POST` | `/api/homework/photo` | Real image upload (multipart or base64) → Claude vision → `{ text }` |
| `POST` | `/api/messages` | Translates via the agent on the way through, stores original + translation |
| `GET` | `/api/messages?classId=` | Optionally filtered by `parentId` |
| `POST` | `/api/agent` | `explain_homework`, `translate_message`, `generate_walkthrough`, `generate_insights`, `translate_ui` |
| `GET` | `/api/insights?classId=` | Convenience wrapper that pulls the class's messages first |
| `GET` | `/api/cbc/subjects[?grade=]` | The CBC catalogue |

### Prompt design

Two constraints run through every prompt, because both failure modes are worse
than being unhelpful:

- **Literal, never inventive.** Translations and explanations must not add facts,
  examples or encouragement that the teacher did not write. A parent has to be
  able to trust that the teacher read what they actually said.
- **Warm spoken register.** Written the way a kind neighbour explains something
  on the phone — for a parent who may have left school early. Short sentences,
  everyday words, no academic voice.

Explanations are also written *entirely* in the target language, labels included,
with the English term in brackets only where no natural equivalent exists.

## Deliberate limits

- **In-memory store.** Everything resets on restart. No database.
- **Video cards are placeholder data**, labelled as such in the UI. There is no
  video search API in this build.
- **Seeded message translations are hand-written** so there is history on first
  load. Every message sent while the app is running is translated live.
- **Teacher sign-in takes over one demo account** so the seeded classes are
  visible; see `signInTeacher` in `server/store.js` for the note on making it
  properly multi-teacher.
- **The teacher replies to existing threads** rather than starting one, since a
  thread is defined by the parent in it.
- Structured outputs are not available on `claude-sonnet-4-6`, so JSON is
  requested in the prompt and parsed defensively (fences stripped, outermost
  object recovered) — see `parseJson` in `server/agent.js`.
