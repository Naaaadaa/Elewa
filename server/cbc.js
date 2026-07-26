// CBC (Competency Based Curriculum, Kenya) subject lists by grade band.
// Used for dropdown population and for validating POST /homework.

export const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const LOWER_PRIMARY = [
  'English',
  'Kiswahili',
  'Mathematics',
  'Environmental Activities',
  'Religious Education',
  'Creative Arts',
  'Physical and Health Education',
];

const UPPER_PRIMARY = [
  'English',
  'Kiswahili',
  'Mathematics',
  'Science and Technology',
  'Social Studies',
  'Agriculture and Nutrition',
  'Creative Arts',
  'Religious Education',
];

const JUNIOR_SCHOOL = [
  'English',
  'Kiswahili',
  'Mathematics',
  'Integrated Science',
  'Social Studies',
  'Pre-Technical Studies',
  'Agriculture',
  'Creative Arts',
  'Religious Education',
];

// Senior school: core subjects taken by everyone, plus pathway subjects.
const SENIOR_CORE = [
  'English',
  'Kiswahili',
  'Mathematics',
  'Community Service Learning',
  'Physical Education',
];

const SENIOR_PATHWAYS = {
  STEM: [
    'Biology',
    'Chemistry',
    'Physics',
    'General Science',
    'Agriculture',
    'Computer Studies',
    'Home Science',
    'Drawing and Design',
    'Aviation Technology',
    'Building Construction',
    'Electricity',
    'Metal Work',
    'Power Mechanics',
    'Wood Work',
                   ],
  'Social Sciences': [
    'Business Studies',
    'History and Citizenship',
    'Geography',
    'Christian Religious Education',
    'Islamic Religious Education',
    'Hindu Religious Education',
    'Literature in English',
    'Fasihi ya Kiswahili',
    'Kenyan Sign Language',
    'Arabic',
    'French',
    'German',
    'Mandarin Chinese',
  ],
  'Arts and Sports Science': [
    'Sports and Recreation',
    'Physical Education',
    'Music and Dance',
    'Theatre and Film',
    'Fine Art',
  ],
};

export function gradeBand(grade) {
  const g = Number(grade);
  if (g >= 1 && g <= 3) return 'lower-primary';
  if (g >= 4 && g <= 6) return 'upper-primary';
  if (g >= 7 && g <= 9) return 'junior-school';
  if (g >= 10 && g <= 12) return 'senior-school';
  return null;
}

/**
 * Returns the CBC subject structure for a grade.
 * Grades 1-9: { band, subjects: [...] }
 * Grades 10-12: { band, subjects: [...core], core: [...], pathways: { name: [...] } }
 */
export function subjectsForGrade(grade) {
  const band = gradeBand(grade);
  if (!band) return null;

  if (band === 'lower-primary') return { band, subjects: LOWER_PRIMARY };
  if (band === 'upper-primary') return { band, subjects: UPPER_PRIMARY };
  if (band === 'junior-school') return { band, subjects: JUNIOR_SCHOOL };

  const pathwaySubjects = Object.values(SENIOR_PATHWAYS).flat();
  return {
    band,
    subjects: [...new Set([...SENIOR_CORE, ...pathwaySubjects])],
    core: SENIOR_CORE,
    pathways: SENIOR_PATHWAYS,
  };
}

export function isValidSubject(grade, subject) {
  const info = subjectsForGrade(grade);
  if (!info) return false;
  return info.subjects.includes(subject);
}

/** Full catalogue, for the frontend to cache on load. */
export function fullCatalogue() {
  const out = {};
  for (const g of GRADES) out[g] = subjectsForGrade(g);
  return out;
}
