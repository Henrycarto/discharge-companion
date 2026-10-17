import type { Lang } from '../companion/plan';

/** Interface words, in English and Austrian German. */
export const UI = {
  going: { en: 'Going home', de: 'Wieder zu Hause' },
  sub: { en: 'Your plan after pneumonia, from Ward 4B', de: 'Ihr Plan nach der Lungenentzündung, von Station 4B' },
  textSize: { en: 'Text size', de: 'Schriftgröße' },
  print: { en: 'Print for the fridge', de: 'Für den Kühlschrank drucken' },
  dim: { en: 'Dim', de: 'Dunkel' },
  bright: { en: 'Bright', de: 'Hell' },
  listen: { en: 'Read aloud', de: 'Vorlesen' },
  stop: { en: 'Stop', de: 'Stopp' },
  today: { en: 'Your medicines', de: 'Ihre Medikamente' },
  day: { en: 'Day', de: 'Tag' },
  morning: { en: 'Morning', de: 'Morgens' },
  afternoon: { en: 'Afternoon', de: 'Nachmittags' },
  night: { en: 'Night', de: 'Abends' },
  taken: { en: 'Taken', de: 'Genommen' },
  last: { en: 'Last one', de: 'Die letzte' },
  course: { en: 'Antibiotic course at home', de: 'Antibiotikum zu Hause' },
  of: { en: 'of', de: 'von' },
  doses: { en: 'doses taken', de: 'Dosen genommen' },
  courseDone: { en: 'Course finished. Well done.', de: 'Fertig eingenommen. Sehr gut.' },
  nothing: { en: 'No medicines due.', de: 'Keine Medikamente fällig.' },
  changed: { en: 'What changed with your medicines', de: 'Was sich bei Ihren Medikamenten geändert hat' },
  new: { en: 'New', de: 'Neu' },
  restart: { en: 'Start again tonight', de: 'Heute Abend wieder beginnen' },
  same: { en: 'Same as before', de: 'Wie vorher' },
  until: { en: 'Last dose', de: 'Letzte Dosis' },
  feeling: { en: 'How are you feeling?', de: 'Wie geht es Ihnen?' },
  feelingSub: { en: 'Tick anything that is true today.', de: 'Kreuzen Sie an, was heute zutrifft.' },
  call: { en: 'Call', de: 'Anrufen' },
  expect: { en: 'What to expect, and when', de: 'Was Sie wann erwarten können' },
  since: { en: 'Days since you came home', de: 'Tage seit der Heimkehr' },
  week: { en: 'week', de: 'Woche' },
  weeks: { en: 'weeks', de: 'Wochen' },
  months: { en: 'months', de: 'Monate' },
  next: { en: 'Your next appointment', de: 'Ihr nächster Termin' },
  around: { en: 'Around', de: 'Um den' },
  source: { en: 'Recovery times from NICE guidance for people with pneumonia.', de: 'Genesungszeiten aus der NICE-Leitlinie für Menschen mit Lungenentzündung.' },
  numbers: { en: 'Useful numbers', de: 'Wichtige Nummern' },
  ambulance: { en: 'Ambulance, in an emergency', de: 'Rettung, im Notfall' },
  advice: { en: 'Health advice line, day and night', de: 'Gesundheitsnummer, rund um die Uhr' },
  ward: { en: 'Ward 4B: the number is on your discharge letter', de: 'Station 4B: die Nummer steht auf Ihrem Entlassungsbrief' },
  foot: {
    en: 'A fictional patient and a demonstration of interface design. Not medical advice and not a medical device.',
    de: 'Eine erfundene Patientin und eine Demonstration von Interface-Design. Keine medizinische Beratung und kein Medizinprodukt.',
  },
} as const satisfies Record<string, Record<Lang, string>>;

export const WEEKDAY: Record<Lang, string[]> = {
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  de: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
};
export const MONTH: Record<Lang, string[]> = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  de: ['Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
};
