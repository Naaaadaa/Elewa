import express from 'express';
import cors from 'cors';
import multer from 'multer';

import { fullCatalogue, isValidSubject, subjectsForGrade } from './cbc.js';
import {
  AGENT_ACTIONS,
  generateInsights,
  resolveLanguage,
  runAgent,
  transcribePhoto,
  translateMessage,
} from './agent.js';
import {
  createClass,
  createHomework,
  createMessage,
  createParent,
  signInTeacher,
  db,
  findClassByJoinCode,
  getClass,
  getParent,
  homeworkForClass,
  messagesForClass,
  seed,
} from './store.js';

const PORT = process.env.PORT || 5174;

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
});

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/** Wraps an async handler so thrown errors become clean JSON responses. */
const route = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) console.error(`[${req.method} ${req.path}]`, err);
    res.status(status).json({
      error: err.message || 'Something went wrong.',
      ...(err.detail ? { detail: err.detail } : {}),
    });
  }
};

function bad(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function notFound(message) {
  const err = new Error(message);
  err.status = 404;
  return err;
}

// ------------------------------------------------------------------- health

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    model: 'claude-sonnet-4-6',
    apiKeyConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
    counts: {
      classes: db.classes.length,
      homework: db.homework.length,
      messages: db.messages.length,
      parents: db.parents.length,
    },
  });
});

// ----------------------------------------------------------- CBC curriculum

app.get('/api/cbc/subjects', (req, res) => {
  const { grade } = req.query;
  if (grade) {
    const info = subjectsForGrade(grade);
    if (!info) return res.status(400).json({ error: 'Grade must be between 1 and 12.' });
    return res.json({ grade: Number(grade), ...info });
  }
  res.json({ catalogue: fullCatalogue() });
});

// -------------------------------------------------------------------- users

app.post(
  '/api/users',
  route(async (req, res) => {
    const { name, phone, role, language } = req.body || {};
    if (!name?.trim()) throw bad('Name is required.');
    if (!phone?.trim()) throw bad('Phone number is required.');
    if (role !== 'teacher' && role !== 'parent') throw bad('Role must be "teacher" or "parent".');

    const user =
      role === 'teacher'
        ? signInTeacher({ name: name.trim(), phone: phone.trim() })
        : createParent({ name: name.trim(), phone: phone.trim(), language: language || 'en' });

    res.status(201).json(user);
  })
);

// ------------------------------------------------------------------ classes

app.post(
  '/api/classes',
  route(async (req, res) => {
    const { name, grade, subject, academicYear, teacherId } = req.body || {};
    if (!name?.trim()) throw bad('Class name is required.');
    if (!grade) throw bad('Grade is required.');
    if (!subject?.trim()) throw bad('Subject is required.');
    if (!academicYear?.toString().trim()) throw bad('Academic year is required.');
    if (!subjectsForGrade(grade)) throw bad('Grade must be between 1 and 12.');
    if (!isValidSubject(grade, subject)) {
      throw bad(`"${subject}" is not a CBC subject for grade ${grade}.`);
    }

    const klass = createClass({
      name: name.trim(),
      grade,
      subject: subject.trim(),
      academicYear: String(academicYear).trim(),
      teacherId,
    });

    res.status(201).json(klass);
  })
);

app.post(
  '/api/classes/join',
  route(async (req, res) => {
    const { joinCode, parentId } = req.body || {};
    if (!joinCode?.trim()) throw bad('A join code is required.');

    const klass = findClassByJoinCode(joinCode);
    if (!klass) throw notFound('No class found with that code. Check it with the teacher.');
    if (klass.archived) throw bad('That class is from a past year and is no longer open to join.');

    const parent = getParent(parentId);
    if (parent && !parent.classIds.includes(klass.id)) parent.classIds.push(klass.id);

    const teacher = db.teachers.find((t) => t.id === klass.teacherId);
    res.json({ ...klass, teacherName: teacher?.name || null });
  })
);

app.get(
  '/api/classes',
  route(async (req, res) => {
    const { teacherId, parentId } = req.query;

    let classes = db.classes;
    if (teacherId) classes = classes.filter((c) => c.teacherId === teacherId);
    if (parentId) {
      const parent = getParent(parentId);
      const ids = parent?.classIds || [];
      classes = classes.filter((c) => ids.includes(c.id));
    }

    const decorate = (c) => ({
      ...c,
      homeworkCount: db.homework.filter((h) => h.classId === c.id).length,
      messageCount: db.messages.filter((m) => m.classId === c.id).length,
    });

    res.json({
      active: classes.filter((c) => !c.archived).map(decorate),
      archived: classes.filter((c) => c.archived).map(decorate),
    });
  })
);

app.get(
  '/api/classes/:id',
  route(async (req, res) => {
    const klass = getClass(req.params.id);
    if (!klass) throw notFound('Class not found.');
    const teacher = db.teachers.find((t) => t.id === klass.teacherId);
    res.json({ ...klass, teacherName: teacher?.name || null });
  })
);

// ----------------------------------------------------------------- homework

app.post(
  '/api/homework',
  route(async (req, res) => {
    const { classId, subject, grade, type, question, expectations } = req.body || {};
    if (!classId) throw bad('classId is required.');

    const klass = getClass(classId);
    if (!klass) throw notFound('Class not found.');
    if (klass.archived) throw bad('This class is archived and is read-only.');

    if (!question?.trim()) throw bad('The task is required.');
    if (type !== 'practice' && type !== 'project') {
      throw bad('type must be "practice" or "project".');
    }

    const useGrade = grade ?? klass.grade;
    const useSubject = subject?.trim() || klass.subject;
    if (!subjectsForGrade(useGrade)) throw bad('Grade must be between 1 and 12.');
    if (!isValidSubject(useGrade, useSubject)) {
      throw bad(`"${useSubject}" is not a CBC subject for grade ${useGrade}.`);
    }

    const item = createHomework({
      classId,
      subject: useSubject,
      grade: useGrade,
      type,
      question: question.trim(),
      expectations: expectations?.trim() || '',
    });

    res.status(201).json(item);
  })
);

app.get(
  '/api/homework',
  route(async (req, res) => {
    const { classId } = req.query;
    if (!classId) throw bad('classId query parameter is required.');
    res.json({ homework: homeworkForClass(classId) });
  })
);

/**
 * Accepts a real uploaded image, either as multipart/form-data (field name
 * "photo") or as JSON { base64, mediaType }. Sends it to Claude's vision
 * input and returns the transcribed homework task.
 */
app.post(
  '/api/homework/photo',
  upload.single('photo'),
  route(async (req, res) => {
    let base64;
    let mediaType;

    if (req.file) {
      base64 = req.file.buffer.toString('base64');
      mediaType = req.file.mimetype;
    } else if (req.body?.base64) {
      // Tolerate a full data: URL as well as a bare base64 payload.
      const raw = String(req.body.base64);
      const match = raw.match(/^data:([^;]+);base64,(.*)$/s);
      base64 = match ? match[2] : raw;
      mediaType = match ? match[1] : req.body.mediaType;
    }

    if (!base64) throw bad('Attach an image as form field "photo", or send { base64, mediaType }.');
    if (!mediaType) throw bad('Could not determine the image type. Send mediaType.');

    if (!ACCEPTED_IMAGE_TYPES.includes(mediaType)) {
      throw bad(`Unsupported image type "${mediaType}". Use JPEG, PNG, GIF or WebP.`);
    }

    const result = await transcribePhoto({ base64, mediaType });
    res.json(result);
  })
);

// ----------------------------------------------------------------- messages

app.post(
  '/api/messages',
  route(async (req, res) => {
    const { classId, parentId, who, text } = req.body || {};
    if (!classId) throw bad('classId is required.');
    if (!parentId) throw bad('parentId is required — a thread is always between one parent and the teacher.');
    if (who !== 'parent' && who !== 'teacher') throw bad('who must be "parent" or "teacher".');
    if (!text?.trim()) throw bad('Message text is required.');

    const klass = getClass(classId);
    if (!klass) throw notFound('Class not found.');
    if (klass.archived) throw bad('This class is archived and is read-only.');

    const parent = getParent(parentId);
    if (!parent) throw notFound('Parent not found.');

    // The parent's chosen language is one side of every translation; the
    // teacher's side is English.
    const language = parent.language;
    const direction = who === 'parent' ? 'parent_to_teacher' : 'teacher_to_parent';

    let translation = '';
    let translationLanguage = null;
    let translationError = null;

    try {
      const result = await translateMessage({ text: text.trim(), direction, language });
      translation = result.translation;
      translationLanguage = result.language;
    } catch (err) {
      // A failed translation must not lose the message — store it untranslated
      // and tell the client so it can show that honestly.
      console.error('[translate_message]', err.message);
      translationError = err.message;
    }

    const message = createMessage({
      classId,
      parentId,
      who,
      text: text.trim(),
      translation,
      translationLanguage,
    });

    res.status(201).json({ ...message, ...(translationError ? { translationError } : {}) });
  })
);

app.get(
  '/api/messages',
  route(async (req, res) => {
    const { classId, parentId } = req.query;
    if (!classId) throw bad('classId query parameter is required.');

    let messages = messagesForClass(classId);
    if (parentId) messages = messages.filter((m) => m.parentId === parentId);

    res.json({ messages });
  })
);

// -------------------------------------------------------------- agent router

app.post(
  '/api/agent',
  route(async (req, res) => {
    const { action, payload } = req.body || {};
    if (!action) throw bad(`action is required. Expected one of: ${AGENT_ACTIONS.join(', ')}.`);
    const result = await runAgent(action, payload || {});
    res.json(result);
  })
);

/**
 * Convenience endpoint for the teacher Insights screen — pulls the class's
 * messages server-side and runs generate_insights over them.
 */
app.get(
  '/api/insights',
  route(async (req, res) => {
    const { classId } = req.query;
    if (!classId) throw bad('classId query parameter is required.');
    const result = await generateInsights({ messages: messagesForClass(classId) });
    res.json(result);
  })
);

// -------------------------------------------------------------------- start

app.use((err, _req, res, _next) => {
  // Multer and body-parser errors land here.
  const status = err.status || err.statusCode || 400;
  res.status(status).json({ error: err.message || 'Bad request.' });
});

const seeded = seed();

app.listen(PORT, () => {
  console.log(`\n  Elewa API   http://localhost:${PORT}`);
  console.log(`  model       claude-sonnet-4-6`);
  console.log(
    `  API key     ${process.env.ANTHROPIC_API_KEY ? 'configured' : 'MISSING — export ANTHROPIC_API_KEY'}`
  );
  console.log(
    `  seeded      ${seeded.classes.length} classes (${seeded.classes.filter((c) => c.archived).length} archived), ` +
      `${db.homework.length} homework, ${db.messages.length} messages`
  );
  console.log(
    `  join codes  ${seeded.classes.map((c) => `${c.joinCode} (${c.name})`).join('   ')}\n`
  );
  console.log(`  Parent language on seeded parents: Amina = Somali, Gadise = Oromo\n`);
});
