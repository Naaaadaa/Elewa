// In-memory data store. Everything resets when the server restarts —
// deliberate for the hackathon build, no database.

let counter = 1000;
const nextId = (prefix) => `${prefix}_${++counter}`;

// Ambiguous characters (0/O, 1/I/L) left out so codes are readable aloud.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function makeJoinCode() {
  let code;
  do {
    code = Array.from(
      { length: 6 },
      () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
    ).join('');
  } while (db.classes.some((c) => c.joinCode === code));
  return code;
}

/**
 * Placeholder video cards for project work. Clearly demo data — there is no
 * video search in this build.
 */
export const DEMO_VIDEOS = [
  { title: 'How to Build a Simple Water Filter at Home', channel: 'Learn CBC Kenya', duration: '6:31', demo: true },
  { title: 'Explaining Your Project to the Class', channel: 'Shule Skills', duration: '4:12', demo: true },
  { title: 'Using Things Around the House for School Projects', channel: 'Elimu Studio', duration: '8:47', demo: true },
];

export const db = {
  teachers: [],
  parents: [],
  classes: [],
  homework: [],
  messages: [],
};

// ---------------------------------------------------------------- accessors

export function createTeacher({ name, phone }) {
  const teacher = { id: nextId('tch'), name, phone, role: 'teacher' };
  db.teachers.push(teacher);
  return teacher;
}

/**
 * Signing in as a teacher takes over the seeded demo teacher account, so the
 * seeded classes, homework and message threads are there on the first screen
 * instead of an empty list. Without this a new teacher id owns nothing.
 * Remove this and use createTeacher directly for real multi-teacher accounts.
 */
export function signInTeacher({ name, phone }) {
  const demo = db.teachers.find((t) => t.demoSeeded);
  if (demo) {
    demo.name = name;
    demo.phone = phone;
    return demo;
  }
  return createTeacher({ name, phone });
}

export function createParent({ name, phone, language }) {
  const parent = { id: nextId('par'), name, phone, language: language || 'en', role: 'parent', classIds: [] };
  db.parents.push(parent);
  return parent;
}

export function getParent(parentId) {
  return db.parents.find((p) => p.id === parentId) || null;
}

export function createClass({ name, grade, subject, academicYear, teacherId, archived = false }) {
  const klass = {
    id: nextId('cls'),
    name,
    grade: Number(grade),
    subject,
    academicYear,
    teacherId: teacherId || db.teachers[0]?.id || null,
    joinCode: makeJoinCode(),
    archived,
    createdAt: new Date().toISOString(),
  };
  db.classes.push(klass);
  return klass;
}

export function getClass(classId) {
  return db.classes.find((c) => c.id === classId) || null;
}

export function findClassByJoinCode(joinCode) {
  const code = String(joinCode || '').trim().toUpperCase();
  return db.classes.find((c) => c.joinCode === code) || null;
}

export function createHomework({ classId, subject, grade, type, question, expectations }) {
  const item = {
    id: nextId('hw'),
    classId,
    subject,
    grade: Number(grade),
    type,
    question,
    expectations: expectations || '',
    createdAt: new Date().toISOString(),
    // Project work gets demo video cards attached; practice work does not.
    videos: type === 'project' ? DEMO_VIDEOS : [],
  };
  db.homework.push(item);
  return item;
}

export function homeworkForClass(classId) {
  return db.homework
    .filter((h) => h.classId === classId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function createMessage({ classId, parentId, who, text, translation, translationLanguage }) {
  const parent = getParent(parentId);
  const message = {
    id: nextId('msg'),
    classId,
    parentId,
    parentName: parent?.name || null,
    who,
    text,
    translation: translation || '',
    translationLanguage: translationLanguage || null,
    createdAt: new Date().toISOString(),
  };
  db.messages.push(message);
  return message;
}

export function messagesForClass(classId) {
  return db.messages
    .filter((m) => m.classId === classId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

// -------------------------------------------------------------------- seed

const ago = (mins) => new Date(Date.now() - mins * 60_000).toISOString();

export function seed() {
  const teacher = createTeacher({ name: 'Mr. Otieno', phone: '+254 712 004 118' });
  teacher.demoSeeded = true;

  const currentYear = '2026';
  const lastYear = '2025';

  const grade4 = createClass({
    name: 'Grade 4 Blue',
    grade: 4,
    subject: 'Science and Technology',
    academicYear: currentYear,
    teacherId: teacher.id,
  });

  const grade7 = createClass({
    name: 'Grade 7 East',
    grade: 7,
    subject: 'Integrated Science',
    academicYear: currentYear,
    teacherId: teacher.id,
  });

  const archived = createClass({
    name: 'Grade 3 Green',
    grade: 3,
    subject: 'Environmental Activities',
    academicYear: lastYear,
    teacherId: teacher.id,
    archived: true,
  });

  // Fixed join codes on the seeded classes so they can be read out on stage.
  grade4.joinCode = 'BLUE24';
  grade7.joinCode = 'EAST77';
  archived.joinCode = 'GREEN3';

  // --- homework: mix of practice and project, mix of subjects and grades ---

  const hw = [
    {
      classId: grade4.id,
      subject: 'Science and Technology',
      grade: 4,
      type: 'project',
      question:
        'Build a simple water filter using materials you can find at home. Use at least three different layers. Bring it to class on Friday and be ready to explain how it cleans the water.',
      expectations:
        'Learner should identify each layer and say what it removes. They should explain in their own words why dirty water becomes clearer. Neatness matters less than being able to explain it. Parents may help gather materials but the learner must build it.',
    },
    {
      classId: grade4.id,
      subject: 'Mathematics',
      grade: 4,
      type: 'practice',
      question:
        'Work out these multiplication problems in your exercise book. 1. 24 x 6  2. 37 x 8  3. 145 x 4  4. 208 x 7. Show your working for each one.',
      expectations:
        'I am looking at the working, not only the final answer. Learner should line up the place values correctly and carry properly. Four correct out of four with working shown is excellent.',
    },
    {
      classId: grade4.id,
      subject: 'English',
      grade: 4,
      type: 'practice',
      question:
        'Read the story on page 42 of your English book. Write five sentences about what the main character did wrong and what she should have done instead.',
      expectations:
        'Full sentences with a capital letter and a full stop. The learner should give a reason, not just say what happened. Spelling mistakes are fine at this stage as long as the idea is clear.',
    },
    {
      classId: grade7.id,
      subject: 'Integrated Science',
      grade: 7,
      type: 'project',
      question:
        'In groups of three, investigate which local material keeps water coldest for the longest time. Test at least three materials. Record the temperature every ten minutes for one hour. Present your findings on a chart.',
      expectations:
        'I want to see the actual measurements written down in a table, even if the results are surprising. Each learner must be able to say what their own part of the work was. The chart should have labels on both axes.',
    },
    {
      classId: grade7.id,
      subject: 'Social Studies',
      grade: 7,
      type: 'practice',
      question:
        'Interview one older person in your community about how the market in your area has changed since they were young. Write half a page on what they told you.',
      expectations:
        'The learner should write down what the person actually said, not what they imagine. At least three specific changes. Names of places are useful. This is about listening carefully.',
    },
  ];

  const created = hw.map((h) => createHomework(h));
  // Stagger creation times so the feed has a believable order.
  created.forEach((item, i) => {
    item.createdAt = ago((i + 1) * 240);
  });

  // --- parents + a short existing thread per class ---

  const amina = createParent({ name: 'Amina Hassan', phone: '+254 733 551 902', language: 'so' });
  amina.classIds.push(grade4.id);

  const gadise = createParent({ name: 'Gadise Bekele', phone: '+254 720 447 316', language: 'om' });
  gadise.classIds.push(grade7.id);

  // Seeded translations are hand-written so the demo has history on first load.
  // Every message sent from here on is translated live by the agent.
  const thread = [
    {
      classId: grade4.id,
      parentId: amina.id,
      who: 'parent',
      text: 'Macallin, waan salaamayaa. Wiilkayga wuu ii sheegay in ay leeyihiin shaqo saynis ah laakiin anigu ma fahmin waxa loo baahan yahay.',
      translation:
        "Teacher, greetings. My son told me they have science work but I did not understand what is needed.",
      translationLanguage: 'English',
      at: 300,
    },
    {
      classId: grade4.id,
      parentId: amina.id,
      who: 'teacher',
      text: 'Thank you for asking. He needs to build a small water filter using three layers of material from home — sand, stones and cloth all work. He does not need to buy anything.',
      translation:
        'Waad ku mahadsan tahay su’aasha. Waa in uu dhisaa filter yar oo biyo lagu safeeyo isagoo isticmaalaya saddex lakab oo alaab guriga ah — ciid, dhagaxyo iyo maro dhammaantood way shaqeeyaan. Wax ma u baahna in uu iibsado.',
      translationLanguage: 'Somali',
      at: 280,
    },
    {
      classId: grade4.id,
      parentId: amina.id,
      who: 'parent',
      text: 'Waad mahadsan tahay. Hadda waan fahmay. Ma jiraa waqti gaar ah oo loo baahan yahay in la keeno?',
      translation:
        'Thank you. Now I understand. Is there a specific time it needs to be brought in?',
      translationLanguage: 'English',
      at: 265,
    },
    {
      classId: grade7.id,
      parentId: gadise.id,
      who: 'parent',
      text: 'Barsiisaa, nagaa. Intalli koo hojii saayinsii qabdi jedhe. Meeshaa bishaan qabbanaa. Ani hin beeku akkamitti gargaaruu dandaʼu.',
      translation:
        'Teacher, greetings. My daughter said she has science work about keeping water cold. I do not know how I can help her.',
      translationLanguage: 'English',
      at: 420,
    },
    {
      classId: grade7.id,
      parentId: gadise.id,
      who: 'teacher',
      text: 'She is working in a group of three, so she does not have to do it alone. Your help would be letting her measure at home and write the numbers down every ten minutes. Nothing needs to be bought.',
      translation:
        'Isheen garee nama sadii keessatti hojjetti, kanaaf qofaa ishee hojjachuu hin qabdu. Gargaarsi keessan safaruu mana keessatti akka gootuu fi lakkoofsa daqiiqaa kudhan hunda barreessuu akka gootu hayyamuudha. Homaa bitachuun barbaachisaa miti.',
      translationLanguage: 'Oromo',
      at: 400,
    },
    {
      classId: grade7.id,
      parentId: gadise.id,
      who: 'parent',
      text: 'Galatoomi barsiisaa. Waan tokko qofa. Chart kana harkaan barreessuu dandaʼaa moo kompiitaraan barbaachisaa?',
      translation:
        'Thank you teacher. Only one thing. Can this chart be written by hand or does it need a computer?',
      translationLanguage: 'English',
      at: 380,
    },
  ];

  for (const m of thread) {
    const message = createMessage(m);
    message.createdAt = ago(m.at);
  }

  return { teacher, classes: [grade4, grade7, archived], parents: [amina, gadise] };
}
