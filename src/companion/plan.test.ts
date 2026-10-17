import { describe, expect, it } from 'vitest';
import { byId } from '../record/record';
import { DAY, DISCHARGED, at, stamp } from '../record/time';
import { longestSentence, readingEase, syllables } from './plain';
import {
  medName,
  BEFORE, FOLLOW_UP, LAST_DOSE, MEDS, QUESTIONS, RECOVERY, advise, courseAtHome, dosesOn, hospitalDoses, type Text,
} from './plan';

describe('the plan joins up with the record', () => {
  it('ends the antibiotic on Tuesday 13 October, as the discharge summary says', () => {
    expect(stamp(LAST_DOSE)).toBe('Tue 13 Oct, 22:00');
    expect(byId.get('discharge')!.detail).toContain('last dose Tuesday 13 October');
  });

  it('gives seven calendar days of co-amoxiclav from the first intravenous dose', () => {
    const first = Math.floor(byId.get('coamoxiclav@2-00:55')!.t / DAY);
    expect(Math.floor(LAST_DOSE / DAY) - first + 1).toBe(7);
  });

  it('starts the home doses where the hospital doses stop, with no double dose and no gap', () => {
    const lastInHospital = Math.max(...hospitalDoses('coamoxiclav').map((d) => d.t));
    const home = courseAtHome();
    expect(stamp(lastInHospital)).toBe('Sat 10 Oct, 08:00');
    expect(home[0] - lastInHospital).toBe(6 * 60); // the next dose at 14:00, as on the ward
    expect(home.every((t) => t > DISCHARGED)).toBe(true);
    expect(home).toHaveLength(11);
  });

  it('restarts atorvastatin on the evening of discharge, the dose the record plans', () => {
    const planned = byId.get('atorvastatin@5-22:00')!;
    expect(planned.status).toBe('planned');
    expect(MEDS.find((m) => m.id === 'atorvastatin')!.from).toBe(planned.t);
  });

  it('continues amlodipine the morning after it was restarted on the ward', () => {
    const restarted = byId.get('amlodipine@5-08:00')!;
    expect(restarted.status).toBe('given');
    expect(MEDS.find((m) => m.id === 'amlodipine')!.from).toBe(restarted.t + DAY);
  });

  it('marks each medicine as new, restarted or the same, against what she took before', () => {
    for (const m of MEDS) expect(m.change === 'new').toBe(!BEFORE.includes(m.id));
  });
});

describe('the daily schedule', () => {
  it('shows three antibiotic doses on a full day and marks the very last one', () => {
    const tue = dosesOn(8);
    expect(tue.filter((d) => d.med.id === 'coamoxiclav').map((d) => d.clock)).toEqual(['08:00', '14:00', '22:00']);
    expect(tue.filter((d) => d.last).map((d) => d.clock)).toEqual(['22:00']);
  });

  it('shows only the regular medicines once the course is over', () => {
    expect(dosesOn(9).map((d) => d.med.id)).toEqual(['amlodipine', 'atorvastatin']);
  });

  it('on the day of discharge shows only what is left after 11:30', () => {
    const sat = dosesOn(5);
    expect(sat.every((d) => d.t > DISCHARGED)).toBe(true);
    expect(sat.map((d) => `${d.clock} ${d.med.id}`)).toEqual(['14:00 coamoxiclav', '22:00 atorvastatin', '22:00 coamoxiclav']);
  });
});

describe('when to get help', () => {
  it('sends any emergency sign to 144, whatever else is ticked', () => {
    expect(advise(new Set(['tired', 'fever', 'chest'])).level).toBe('emergency');
    expect(advise(new Set(['lips'])).call?.number).toBe('144');
  });

  it('sends urgent signs to the GP or 1450, including the ones her medicines make likely', () => {
    for (const id of ['fever', 'vomit', 'muscle', 'dizzy', 'rash', 'worse']) {
      expect(advise(new Set([id])).level, id).toBe('urgent');
    }
    expect(advise(new Set(['muscle'])).call?.number).toBe('1450');
  });

  it('reassures about cough and tiredness, and asks for ticks when nothing is ticked', () => {
    expect(advise(new Set(['cough', 'tired'])).level).toBe('expected');
    expect(advise(new Set()).level).toBe('none');
  });

  it('asks every emergency question first in the list', () => {
    const levels = QUESTIONS.map((q) => q.level);
    expect(levels.indexOf('urgent')).toBeGreaterThan(levels.lastIndexOf('emergency'));
    expect(levels.indexOf('expected')).toBeGreaterThan(levels.lastIndexOf('urgent'));
  });
});

describe('recovery and follow-up', () => {
  it('dates the follow-up across the month boundary', () => {
    expect(stamp(at(0, '09:00') + 27 * DAY)).toBe('Sun 1 Nov, 09:00');
  });

  it('follows the NICE milestones in order, from one week to six months', () => {
    expect(RECOVERY.map((r) => r.days)).toEqual([7, 28, 42, 91, 182]);
    expect(stamp(DISCHARGED + FOLLOW_UP.in * DAY).slice(0, 10)).toBe('Sat 21 Nov');
    expect(at(5, '11:30')).toBe(DISCHARGED);
  });
});

describe('plain language, in both languages', () => {
  const texts: Text[] = [
    ...MEDS.flatMap((m) => [m.purpose, m.why, m.dose]),
    ...QUESTIONS.map((q) => q.text),
    ...RECOVERY.map((r) => r.text),
    FOLLOW_UP.text,
    ...(['breath', 'fever', 'cough'] as const).flatMap((id) => {
      const a = advise(new Set([id]));
      return [a.title, a.body];
    }),
  ];

  it('has every sentence in English and German', () => {
    for (const t of texts) {
      expect(t.en.length, JSON.stringify(t)).toBeGreaterThan(0);
      expect(t.de.length, JSON.stringify(t)).toBeGreaterThan(0);
      expect(t.de).not.toBe(t.en);
    }
  });

  it('reads as plain English: reading ease of 70 or more, no sentence over 15 words', () => {
    const all = texts.map((t) => t.en).join(' ');
    expect(readingEase(all)).toBeGreaterThanOrEqual(70);
    for (const t of texts) expect(longestSentence(t.en), t.en).toBeLessThanOrEqual(15);
  });

  it('counts syllables well enough to rank text', () => {
    expect(['cat', 'table', 'medicine', 'tablet', 'breathlessness'].map(syllables)).toEqual([1, 2, 3, 2, 3]);
  });

  it('uses Austrian terms in the German, for a patient in Austria', () => {
    const de = texts.map((t) => t.de).join(' ');
    expect(de).toContain('Spital');
    expect(de).toContain('Rettung');
    expect(de).not.toMatch(/Krankenhaus/);
  });

  it('names the medicines as an Austrian pack does', () => {
    expect(MEDS.map((m) => medName(m, 'de'))).toEqual(['Amoxicillin/Clavulansäure', 'Atorvastatin', 'Amlodipin']);
    expect(MEDS.map((m) => medName(m, 'en'))).toEqual(['Co-amoxiclav', 'Atorvastatin', 'Amlodipine']);
  });

  it('contains no em dashes', () => {
    for (const t of texts) expect(`${t.en} ${t.de}`).not.toMatch(/\u2014/);
  });
});
