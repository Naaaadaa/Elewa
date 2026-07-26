/**
 * Every piece of interface text a user sees, in English, in one flat object.
 *
 * When a parent picks Somali or Oromo this whole object is sent once to
 * POST /agent { action: "translate_ui" } and the translated copy is held in
 * React context (see LanguageContext.jsx). Nothing here is translated in the
 * browser and nothing is hardcoded in a screen — every screen reads from t().
 *
 * Rules for adding a key:
 *   - keep it flat and one level deep, so the shape survives the round trip
 *   - keep {placeholders} in curly braces; the model preserves them
 *   - no emoji anywhere (icons are outline SVGs, see icons.jsx)
 */

export const STRINGS = {
  // --- app + sign in ---
  app_name: 'Elewa',
  app_tagline: "Understand your child's homework",
  signin_heading: 'Welcome',
  signin_sub: 'Tell us who you are so we can set up your view.',
  signin_name_label: 'Your name',
  signin_name_placeholder: 'e.g. Amina Hassan',
  signin_phone_label: 'Phone number',
  signin_phone_placeholder: 'e.g. 0733 551 902',
  signin_role_label: 'I am a',
  role_teacher: 'Teacher',
  role_teacher_sub: 'Post homework, message parents',
  role_parent: 'Parent',
  role_parent_sub: 'Understand homework, ask the teacher',
  signin_language_label: 'Read Elewa in',
  language_somali: 'Somali',
  language_oromo: 'Oromo',
  language_english: 'English',
  signin_language_hint: 'Everything in the app will be in the language you pick.',
  signin_continue: 'Continue',
  signin_error_name: 'Please enter your name.',
  signin_error_phone: 'Please enter your phone number.',
  signin_error_language: 'Please pick a language.',

  // --- translating the interface ---
  translating_title: 'Setting up Elewa in {language}',
  translating_body: 'This takes a moment and only happens once.',
  translating_failed: 'We could not switch the language just now. Elewa will stay in English — you can try again from Settings.',
  translating_retry: 'Try again',
  translating_continue_english: 'Continue in English',

  // --- navigation ---
  nav_home: 'Home',
  nav_messages: 'Messages',
  nav_insights: 'Insights',
  nav_classes: 'Classes',
  nav_settings: 'Settings',
  action_back: 'Back',
  action_close: 'Close',
  action_cancel: 'Cancel',
  action_done: 'Done',
  action_save: 'Save',
  action_retry: 'Try again',

  // --- teacher: classes ---
  classes_title: 'My Classes',
  classes_active: 'This year',
  classes_archived: 'Past years',
  classes_archived_note: 'Read only',
  classes_empty: 'You have no classes yet. Create your first one.',
  classes_create: 'Create class',
  classes_homework_count: '{count} homework',
  classes_message_count: '{count} messages',
  classes_join_code: 'Join code',
  classes_join_code_hint: 'Give this code to parents so they can join the class.',

  create_class_title: 'New class',
  create_class_name_label: 'Class name',
  create_class_name_placeholder: 'e.g. Grade 4 Blue',
  create_class_grade_label: 'Grade',
  create_class_subject_label: 'Main subject',
  create_class_year_label: 'Academic year',
  create_class_submit: 'Create class',
  create_class_created: 'Class created',
  create_class_created_sub: 'Share this join code with parents.',
  create_class_go_to_class: 'Go to class',

  // --- homework feed ---
  feed_title: 'Homework',
  feed_empty_teacher: 'No homework posted in this class yet.',
  feed_empty_parent: 'The teacher has not posted any homework yet. It will show up here.',
  feed_post_homework: 'Post homework',
  type_practice: 'Practice',
  type_project: 'Project',
  feed_expectations_label: "Teacher's expectations",
  feed_no_expectations: 'The teacher did not write any expectations for this task.',
  feed_tap_to_open: 'Tap to understand this',

  // --- teacher: post homework ---
  post_title: 'Post homework',
  post_subject_label: 'Subject',
  post_grade_label: 'Grade',
  post_type_label: 'Task type',
  post_photo_label: 'Photo of the task',
  post_photo_hint: 'Take or choose a photo of the exercise book, board or worksheet and we will read the task out of it.',
  post_photo_choose: 'Choose photo',
  post_photo_change: 'Choose a different photo',
  post_photo_reading: 'Reading the task from your photo',
  post_photo_filled: 'We read this from your photo. Check it and fix anything that is wrong.',
  post_photo_nothing_found: 'We could not find a task in that photo. Try a closer, brighter photo, or type the task below.',
  post_photo_failed: 'That photo could not be read. You can still type the task below.',
  post_question_label: 'The task',
  post_question_placeholder: 'What exactly should the learner do?',
  post_expectations_label: 'What you are looking for',
  post_expectations_placeholder: 'What makes this good work? What will you be marking?',
  post_submit: 'Post to class',
  post_posting: 'Posting',
  post_error_question: 'Please write the task, or read it from a photo.',
  post_posted: 'Homework posted',

  // --- parent: join a class ---
  join_title: 'Join your class',
  join_sub: "Enter the code your child's teacher gave you.",
  join_code_label: 'Join code',
  join_code_placeholder: 'e.g. BLUE24',
  join_submit: 'Join class',
  join_joining: 'Joining',
  join_error_empty: 'Please enter the join code.',
  join_joined: 'You joined {className}',
  join_another: 'Join another class',
  join_teacher_label: 'Teacher',

  // --- parent: understanding a task ---
  explain_loading: 'Reading this homework for you',
  explain_failed: 'We could not explain this task just now.',
  explain_what_label: 'What your child has been asked to do',
  explain_good_label: 'What good work looks like',
  explain_rubric_label: 'What the teacher will be marking',
  explain_questions_label: 'Questions you can ask your child',
  explain_another_way: 'Explain another way',
  walkthrough_loading: 'Putting it into steps',
  walkthrough_label: 'Step by step',
  walkthrough_failed: 'We could not build the steps just now.',
  walkthrough_step: 'Step {number}',
  videos_label: 'Videos that might help',
  videos_demo_note: 'Example cards for this demo — video search is not connected yet.',
  ask_teacher: 'Ask the teacher',

  // --- messages ---
  messages_title: 'Messages',
  messages_thread_with: 'With {name}',
  messages_empty_parent: 'No messages yet. Write to the teacher below — we will translate it for them.',
  messages_empty_teacher: 'No messages from parents in this class yet.',
  messages_input_placeholder: 'Write your message',
  messages_send: 'Send',
  messages_sending: 'Sending',
  messages_translating: 'Translating',
  messages_translation_label: 'Translation',
  messages_translation_failed: 'This message was sent, but we could not translate it.',
  messages_you: 'You',
  messages_teacher: 'Teacher',
  messages_parent: 'Parent',
  messages_select_thread: 'Pick a parent to open the conversation.',
  messages_threads_title: 'Conversations',

  // --- teacher: insights ---
  insights_title: 'Insights',
  insights_sub: 'What parents in this class are asking about.',
  insights_loading: 'Reading this class’s messages',
  insights_summary_label: 'Summary',
  insights_themes_label: 'Themes',
  insights_theme_mentions: '{count} messages',
  insights_empty: 'There are no messages in this class yet, so there is nothing to summarise.',
  insights_failed: 'We could not build the insights just now.',
  insights_refresh: 'Refresh',

  // --- settings / general ---
  settings_title: 'Settings',
  settings_language_label: 'Language',
  settings_role_label: 'Signed in as',
  settings_signout: 'Sign out',
  archived_banner: 'This class is from {year} and is read only.',
  loading: 'Loading',
  error_generic: 'Something went wrong. Please try again.',
  error_offline: 'We could not reach Elewa. Check your connection and try again.',
  powered_by_ai: 'Translated and explained by AI. Always check with the teacher if something looks wrong.',
};

export const STRING_KEYS = Object.keys(STRINGS);

/** Fills {placeholders} in a string. */
export function format(template, values = {}) {
  if (typeof template !== 'string') return '';
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
  );
}
