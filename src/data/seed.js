// tend — seed data for the Artist's Way companion.
// For the prototype this is local mock data; it will be replaced by a real
// backend (per-user tracking + shared circle) in the next phase.

// ── Moods ─────────────────────────────────────────────
export const MOODS = [
  { key: 'energized',   label: 'Energized',   color: '#C98A2B', glyph: 'spark' },
  { key: 'curious',     label: 'Curious',     color: '#6E8B6A', glyph: 'leaf'  },
  { key: 'flowing',     label: 'Flowing',     color: '#5E7E9B', glyph: 'wave'  },
  { key: 'stuck',       label: 'Stuck',       color: '#9A8472', glyph: 'knot'  },
  { key: 'overwhelmed', label: 'Overwhelmed', color: '#B5645C', glyph: 'storm' },
];
export const moodByKey = (k) => MOODS.find((m) => m.key === k) || null;

// ── This week's chapter work (Week 4: Recovering a Sense of Integrity) ──
export const EXERCISES = [
  { id: 'ex1', label: 'Reading deprivation — no reading, all week', prompt: 'How is the quiet changing what you notice? Where did the restless energy go instead?' },
  { id: 'ex2', label: 'List 20 things you enjoy doing', prompt: 'Twenty small pleasures. When did you last do each one?' },
  { id: 'ex3', label: 'Describe your ideal environment in one line', prompt: 'Where do you make your best work? Name the light, the sound, the feeling.' },
  { id: 'ex4', label: 'Write your own artist’s prayer', prompt: 'A few honest lines to the part of you that wants to create.' },
  { id: 'ex5', label: 'Time travel: a champion who believed in you', prompt: 'Who saw you as an artist before you did? Write them a thank-you you’ll never send.' },
];

// ── The circle (4 friends, plus you) ──────────────────
// Each friend can be on a different week of the program.
export const FRIENDS = [
  { id: 'maya',  name: 'Maya',  mono: 'M', week: 4, pages: 5, artistDate: true,  exercises: 3, mood: 'flowing'     },
  { id: 'dev',   name: 'Dev',   mono: 'D', week: 5, pages: 7, artistDate: false, exercises: 5, mood: 'energized'   },
  { id: 'priya', name: 'Priya', mono: 'P', week: 3, pages: 2, artistDate: false, exercises: 1, mood: 'overwhelmed' },
  { id: 'jonah', name: 'Jonah', mono: 'J', week: 4, pages: 4, artistDate: true,  exercises: 2, mood: 'curious'     },
];

// ── Artist Date idea library (the shared "well") ──────
// tags: category · cost (Free / Low / $$) · setting (Indoor / Outdoor) · social (Solo / Group)
export const IDEA_CATEGORIES = ['Nature', 'Culture', 'Making', 'Music', 'Food', 'Quiet']
export const IDEA_COSTS = ['Free', 'Low', '$$']
export const IDEA_SETTINGS = ['Indoor', 'Outdoor']
export const IDEA_SOCIAL = ['Solo', 'Group']

export const IDEAS = [
  { id: 'garden',    title: 'Visit a botanical garden at opening time', by: 'Maya',  tags: { category: 'Nature',  cost: 'Free', setting: 'Outdoor', social: 'Solo' } },
  { id: 'rec',       title: 'Thrift-store record digging downtown',     by: 'you',   tags: { category: 'Music',   cost: 'Low',  setting: 'Indoor',  social: 'Solo' } },
  { id: 'pottery',   title: 'Take a drop-in pottery class',             by: 'Dev',   tags: { category: 'Making',  cost: '$$',   setting: 'Indoor',  social: 'Group' } },
  { id: 'sketch',    title: 'Sketch strangers at a busy café',          by: 'Priya', tags: { category: 'Making',  cost: 'Free', setting: 'Indoor',  social: 'Solo' } },
  { id: 'sunrise',   title: 'Watch the sunrise from a rooftop',         by: 'Jonah', tags: { category: 'Nature',  cost: 'Free', setting: 'Outdoor', social: 'Solo' } },
  { id: 'museum',    title: 'Wander a museum wing you always skip',     by: 'Maya',  tags: { category: 'Culture', cost: 'Low',  setting: 'Indoor',  social: 'Solo' } },
  { id: 'cook',      title: 'Buy one strange ingredient and cook it',   by: 'you',   tags: { category: 'Food',    cost: 'Low',  setting: 'Indoor',  social: 'Solo' } },
  { id: 'film',      title: 'A long walk with a film camera',           by: 'Dev',   tags: { category: 'Nature',  cost: 'Low',  setting: 'Outdoor', social: 'Solo' } },
  { id: 'cathedral', title: 'Sit in a cathedral and just listen',       by: 'Priya', tags: { category: 'Quiet',   cost: 'Free', setting: 'Indoor',  social: 'Solo' } },
]

// ── You (today / this week) ───────────────────────────
// pages = 7 booleans (Mon..Sun); today is index 3 (Thursday).
export const ME = {
  id: 'you', name: 'Ren', mono: 'R',
  todayIndex: 3,
  pages: [true, true, true, false, false, false, false],
  artistDate: { done: false, plan: '', note: '' },
  exercises: { ex1: false, ex2: true, ex3: false, ex4: false, ex5: false },
  exerciseNotes: {},
  pastEdits: {},
  checkin: { mood: '', forward: '', win: '', shared: false },
  // Artist date ideas: per-idea state for the shared pool, plus ideas you added.
  ideas: {
    garden: { saved: true, done: false },
    rec: { saved: true, done: true },
  },
  addedIdeas: [],   // ideas you contribute: { id, title, by:'you', shared, tags }
};

// ── Your journey so far (weeks 1–3 history; week 4 is live) ──
export const JOURNEY = {
  moods: { 1: 'overwhelmed', 2: 'stuck', 3: 'curious' },
  artistDates: [
    { week: 3, place: 'Watercolors by the river, alone', done: true },
    { week: 2, place: 'Thrift-store record digging downtown', done: true },
    { week: 1, place: 'A slow morning in the glass conservatory', done: true },
  ],
  reflections: [
    { id: 'r3', week: 3, title: 'Describe your ideal environment in one line', answer: 'A wide wooden table, north light, one plant, a door I can close — quiet enough to hear the pen move.' },
    { id: 'r2', week: 2, title: 'List 20 things you enjoy doing', answer: 'Long walks, used bookstores, rain on the window, cooking for people, that first cup of coffee, sketching strangers on the train, sleeping with the window open…' },
    { id: 'r1', week: 1, title: 'A champion who believed in you', answer: 'Mr. Alvarez, ninth-grade art. He pinned my worst drawings up anyway and said the wanting was the talent.' },
  ],
};

export const WEEK = { n: 4, total: 12, title: 'Recovering a Sense of Integrity' };
export const DATE = { weekday: 'Thursday', day: 'June 11', dayShort: 'Thu' };
export const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const seed = { MOODS, moodByKey, EXERCISES, FRIENDS, ME, JOURNEY, WEEK, DATE, DAY_LETTERS, IDEAS };
export default seed;
