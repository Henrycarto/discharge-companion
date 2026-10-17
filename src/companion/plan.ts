/**
 * Margarete's plan for home, derived from her record: which medicines, when, what changed and why,
 * when to get help, what recovery looks like, and her follow-up. Every patient-facing sentence
 * exists in English and German (she lives in Austria), and the English is tested for plain language.
 */
import { byId, dosesOf } from './record';
import { DAY, DISCHARGED, at } from '../record/time';

export type Lang = 'en' | 'de';
export type Text = Record<Lang, string>;

export interface HomeMed {
  id: string;
  name: string;
  nameDe: string; // the name on an Austrian pack
  dose: Text;
  purpose: Text;
  change: 'new' | 'restart' | 'same';
  why: Text;
  times: string[]; // clock times each day
  from: number; // first dose at home, minutes in the record's clock
  until?: number; // last dose, for a course
}

/** The antibiotic course: 7 days from the first intravenous dose; the last day is the one the discharge note names. */
export const COURSE_START = byId.get('coamoxiclav@2-00:55')!.t;
export const LAST_DOSE = at(8, '22:00'); // Tuesday 13 October, the last of three doses that day

/** Her medicines before she came in, from the triage note. */
export const BEFORE = ['amlodipine', 'atorvastatin'];

export const MEDS: HomeMed[] = [
  {
    id: 'coamoxiclav', name: 'Co-amoxiclav', nameDe: 'Amoxicillin/Clavulansäure',
    dose: { en: '625 mg tablet', de: '625-mg-Tablette' },
    purpose: { en: 'Antibiotic for the chest infection.', de: 'Antibiotikum gegen die Lungenentzündung.' },
    change: 'new',
    why: { en: 'New. Take it until the course is finished, even when you feel better.', de: 'Neu. Bis zum Ende einnehmen, auch wenn es Ihnen besser geht.' },
    times: ['08:00', '14:00', '22:00'],
    from: at(5, '14:00'),
    until: LAST_DOSE,
  },
  {
    id: 'atorvastatin', name: 'Atorvastatin', nameDe: 'Atorvastatin',
    dose: { en: '40 mg tablet', de: '40-mg-Tablette' },
    purpose: { en: 'For cholesterol.', de: 'Gegen hohes Cholesterin.' },
    change: 'restart',
    why: { en: 'Paused in hospital because it does not mix with one of the antibiotics. Start again tonight.', de: 'Im Spital pausiert, weil es sich mit einem Antibiotikum nicht verträgt. Heute Abend wieder beginnen.' },
    times: ['22:00'],
    from: at(5, '22:00'),
  },
  {
    id: 'amlodipine', name: 'Amlodipine', nameDe: 'Amlodipin',
    dose: { en: '5 mg tablet', de: '5-mg-Tablette' },
    purpose: { en: 'For blood pressure.', de: 'Gegen hohen Blutdruck.' },
    change: 'same',
    why: { en: 'Same as before. It was paused for a few days when your blood pressure was low.', de: 'Wie vorher. Es war ein paar Tage pausiert, als Ihr Blutdruck niedrig war.' },
    times: ['08:00'],
    from: at(6, '08:00'),
  },
];

export interface Dose {
  med: HomeMed;
  t: number;
  clock: string;
  last: boolean; // the last dose of a course
}

/** The doses due on one day at home. */
export function dosesOn(day: number): Dose[] {
  const out: Dose[] = [];
  for (const med of MEDS) {
    for (const clock of med.times) {
      const t = at(day, clock);
      if (t < med.from || (med.until !== undefined && t > med.until)) continue;
      out.push({ med, t, clock, last: med.until === t });
    }
  }
  return out.sort((a, b) => a.t - b.t || a.med.name.localeCompare(b.med.name));
}

export const medName = (m: HomeMed, lang: Lang) => (lang === 'de' ? m.nameDe : m.name);


/** Every antibiotic dose to take at home. */
export function courseAtHome(): number[] {
  const out: number[] = [];
  for (let d = Math.floor(DISCHARGED / DAY); d <= Math.floor(LAST_DOSE / DAY); d++) for (const x of dosesOn(d)) if (x.med.id === 'coamoxiclav') out.push(x.t);
  return out;
}

/** Days of antibiotic in total: hospital and home together. */
export const courseDays = () => (LAST_DOSE - COURSE_START) / DAY;

/** Doses given in hospital, for checking the plan joins up with the record. */
export const hospitalDoses = (drug: string) => dosesOf(drug).filter((d) => d.status === 'given');

// ---- when to get help ---------------------------------------------------------------

export type Level = 'emergency' | 'urgent' | 'expected';

export interface Question {
  id: string;
  level: Level;
  text: Text;
}

export const QUESTIONS: Question[] = [
  { id: 'breath', level: 'emergency', text: { en: 'Very short of breath, even sitting still', de: 'Sehr kurzatmig, auch im Sitzen' } },
  { id: 'chest', level: 'emergency', text: { en: 'Chest pain', de: 'Schmerzen in der Brust' } },
  { id: 'confused', level: 'emergency', text: { en: 'Confused or very sleepy', de: 'Verwirrt oder sehr schläfrig' } },
  { id: 'lips', level: 'emergency', text: { en: 'Blue or grey lips', de: 'Blaue oder graue Lippen' } },
  { id: 'fever', level: 'urgent', text: { en: 'A temperature of 38 °C or more', de: 'Fieber von 38 °C oder mehr' } },
  { id: 'worse', level: 'urgent', text: { en: 'Breathing worse than when you left hospital', de: 'Atmung schlechter als beim Verlassen des Spitals' } },
  { id: 'vomit', level: 'urgent', text: { en: 'Being sick, so the tablets do not stay down', de: 'Erbrechen, sodass die Tabletten nicht drinbleiben' } },
  { id: 'muscle', level: 'urgent', text: { en: 'Muscle pain or weakness you cannot explain, or dark urine', de: 'Unerklärliche Muskelschmerzen oder Schwäche, oder dunkler Harn' } },
  { id: 'dizzy', level: 'urgent', text: { en: 'Dizzy or faint when you stand up', de: 'Schwindlig oder schwach beim Aufstehen' } },
  { id: 'rash', level: 'urgent', text: { en: 'A rash or swelling after the antibiotic', de: 'Ausschlag oder Schwellung nach dem Antibiotikum' } },
  { id: 'cough', level: 'expected', text: { en: 'Still coughing', de: 'Noch Husten' } },
  { id: 'tired', level: 'expected', text: { en: 'Tired', de: 'Müde' } },
];

export interface Advice {
  level: Level | 'none';
  title: Text;
  body: Text;
  call?: { number: string; label: Text };
}

/** The most serious answer decides the advice. */
export function advise(yes: Set<string>): Advice {
  const asked = QUESTIONS.filter((q) => yes.has(q.id));
  if (asked.some((q) => q.level === 'emergency')) {
    return {
      level: 'emergency',
      title: { en: 'Call an ambulance now', de: 'Rufen Sie sofort die Rettung' },
      body: { en: 'Call 144. Say you had pneumonia and came home on Saturday.', de: 'Wählen Sie 144. Sagen Sie, dass Sie eine Lungenentzündung hatten und am Samstag heimgekommen sind.' },
      call: { number: '144', label: { en: 'Ambulance', de: 'Rettung' } },
    };
  }
  if (asked.some((q) => q.level === 'urgent')) {
    return {
      level: 'urgent',
      title: { en: 'Get advice today', de: 'Holen Sie sich heute Rat' },
      body: { en: 'Call your GP today. Out of hours, call 1450. Keep taking your medicines unless they tell you to stop.', de: 'Rufen Sie heute Ihre Hausärztin oder Ihren Hausarzt an. Außerhalb der Ordinationszeiten wählen Sie 1450. Nehmen Sie Ihre Medikamente weiter, außer man sagt Ihnen etwas anderes.' },
      call: { number: '1450', label: { en: 'Health advice line', de: 'Gesundheitsnummer' } },
    };
  }
  if (asked.length) {
    return {
      level: 'expected',
      title: { en: 'This is normal after pneumonia', de: 'Das ist nach einer Lungenentzündung normal' },
      body: { en: 'Cough and tiredness can last for weeks. See below for what to expect and when.', de: 'Husten und Müdigkeit können Wochen dauern. Unten sehen Sie, was Sie wann erwarten können.' },
    };
  }
  return {
    level: 'none',
    title: { en: 'Tick anything you notice', de: 'Kreuzen Sie an, was Ihnen auffällt' },
    body: { en: 'The advice will change as you tick.', de: 'Der Rat ändert sich, wenn Sie etwas ankreuzen.' },
  };
}

// ---- recovery and follow-up -----------------------------------------------------------

/** How long symptoms usually last after pneumonia (NICE NG138, information for patients). */
export const RECOVERY: Array<{ days: number; text: Text }> = [
  { days: 7, text: { en: 'Fever should have gone.', de: 'Das Fieber sollte weg sein.' } },
  { days: 28, text: { en: 'Chest pain and mucus should be much less.', de: 'Brustschmerzen und Schleim sollten deutlich weniger sein.' } },
  { days: 42, text: { en: 'Cough and breathlessness should be much less.', de: 'Husten und Atemnot sollten deutlich weniger sein.' } },
  { days: 91, text: { en: 'Most symptoms should have gone. You may still feel tired.', de: 'Die meisten Beschwerden sollten weg sein. Sie können noch müde sein.' } },
  { days: 182, text: { en: 'Most people feel back to normal.', de: 'Die meisten Menschen fühlen sich wieder normal.' } },
];

export const FOLLOW_UP = {
  in: 42, // days after discharge
  text: { en: 'See your GP and have a chest X-ray, to check the infection has cleared.', de: 'Besuchen Sie Ihre Hausärztin oder Ihren Hausarzt und machen Sie ein Lungenröntgen, um zu prüfen, ob die Entzündung ausgeheilt ist.' } as Text,
};
