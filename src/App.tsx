import { Fragment, useEffect, useMemo, useState } from 'react';
import { FOLLOW_UP, LAST_DOSE, MEDS, QUESTIONS, RECOVERY, advise, courseAtHome, dosesOn, medName, type HomeMed, type Lang } from './companion/plan';
import { PATIENT } from './companion/record';
import { DAY, DISCHARGED, clock, dateOf } from './record/time';
import { MONTH, UI, WEEKDAY } from './ui/strings';

const FIRST_DAY = Math.floor(DISCHARGED / DAY); // Saturday
const DAYS = [0, 1, 2, 3, 4].map((i) => FIRST_DAY + i);
const SIZES = [1, 1.15, 1.3];

const store = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, v: string) {
    try {
      window.localStorage.setItem(key, v);
    } catch {
      /* private mode or storage blocked: ticks just are not remembered */
    }
  },
};

function dayName(day: number, lang: Lang) {
  const d = dateOf(day * DAY);
  return lang === 'de' ? `${WEEKDAY.de[day % 7]} ${d.getUTCDate()}. ${MONTH.de[d.getUTCMonth()].slice(0, 3)}.` : `${WEEKDAY.en[day % 7]} ${d.getUTCDate()} ${MONTH.en[d.getUTCMonth()].slice(0, 3)}`;
}

function fullDate(t: number, lang: Lang) {
  const d = dateOf(t);
  return lang === 'de' ? `${d.getUTCDate()}. ${MONTH.de[d.getUTCMonth()]}` : `${d.getUTCDate()} ${MONTH.en[d.getUTCMonth()]}`;
}

/** A medicine name that may break after a slash, so Amoxicillin/Clavulansäure fits a narrow column. */
function Name({ med, lang }: { med: HomeMed; lang: Lang }) {
  const parts = medName(med, lang).split('/');
  return (
    <b>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && <>/<wbr /></>}
          {p}
        </Fragment>
      ))}
    </b>
  );
}

function Pill({ med }: { med: HomeMed }) {
  const shape = med.id === 'coamoxiclav' ? <rect x={3} y={8} width={26} height={14} rx={7} /> : med.id === 'atorvastatin' ? <circle cx={16} cy={15} r={9} /> : <rect x={7} y={7} width={18} height={16} rx={4} />;
  return <svg className={`pill ${med.id}`} width={32} height={30} viewBox="0 0 32 30" aria-hidden>{shape}</svg>;
}

const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

function Listen({ text, lang }: { text: string; lang: Lang }) {
  const [on, setOn] = useState(false);
  if (!canSpeak()) return null;
  return (
    <button
      className="listen"
      onClick={() => {
        const s = window.speechSynthesis;
        s.cancel();
        if (on) return setOn(false);
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang === 'de' ? 'de-AT' : 'en-GB';
        u.rate = 0.95;
        u.onend = () => setOn(false);
        s.speak(u);
        setOn(true);
      }}
      aria-pressed={on}
    >
      {on ? UI.stop[lang] : UI.listen[lang]}
    </button>
  );
}

export default function App() {
  const [lang, setLang] = useState<Lang>(() => (store.get('lang') as Lang) || (navigator.language?.startsWith('de') ? 'de' : 'en'));
  const [size, setSize] = useState(() => Number(store.get('size') ?? 0));
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);
  const [day, setDay] = useState(FIRST_DAY);
  const [taken, setTaken] = useState<Set<string>>(() => new Set(JSON.parse(store.get('taken') ?? '[]') as string[]));
  const [yes, setYes] = useState<Set<string>>(new Set());
  const [since, setSince] = useState(3);

  useEffect(() => store.set('lang', lang), [lang]);
  useEffect(() => store.set('size', String(size)), [size]);
  useEffect(() => store.set('taken', JSON.stringify([...taken])), [taken]);
  useEffect(() => {
    document.documentElement.style.setProperty('--scale', String(SIZES[size]));
    document.documentElement.lang = lang === 'de' ? 'de-AT' : 'en-GB';
  }, [size, lang]);
  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme;
  }, [theme]);
  const dimmed = theme ? theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;

  const doses = dosesOn(day);
  const slots: Array<[string, string]> = [['08:00', UI.morning[lang]], ['14:00', UI.afternoon[lang]], ['22:00', UI.night[lang]]];
  const course = courseAtHome();
  const courseTaken = course.filter((t) => taken.has(`coamoxiclav@${t}`)).length;
  const a = useMemo(() => advise(yes), [yes]);
  const t = <K extends keyof typeof UI>(k: K) => UI[k][lang];
  const followUp = DISCHARGED + FOLLOW_UP.in * DAY;

  const toggle = (set: Set<string>, id: string) => {
    const n = new Set(set);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    return n;
  };

  const medsText = doses.map((d) => `${d.clock}, ${medName(d.med, lang)}, ${d.med.dose[lang]}. ${d.med.purpose[lang]}`).join(' ');

  return (
    <div className="shell">
      <header className="top">
        <div className="hello">
          <span className="kicker">{PATIENT.name}</span>
          <h1>{t('going')}</h1>
          <p>{t('sub')}</p>
        </div>
        <div className="tools">
          <div className="seg" role="radiogroup" aria-label="Language / Sprache">
            {(['en', 'de'] as const).map((l) => (
              <button key={l} role="radio" aria-checked={lang === l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>{l === 'en' ? 'English' : 'Deutsch'}</button>
            ))}
          </div>
          <div className="seg" role="radiogroup" aria-label={t('textSize')}>
            {SIZES.map((_, i) => (
              <button key={i} role="radio" aria-checked={size === i} className={size === i ? 'on' : ''} onClick={() => setSize(i)} style={{ fontSize: `${15 + i * 3}px` }} aria-label={`${t('textSize')} ${i + 1}`}>A</button>
            ))}
          </div>
          <button className="btn" onClick={() => window.print()}>{t('print')}</button>
          <button className="btn" onClick={() => setTheme(dimmed ? 'light' : 'dark')} aria-pressed={dimmed}>{dimmed ? t('bright') : t('dim')}</button>
        </div>
      </header>

      <main className="grid">
        <section className="card meds" aria-labelledby="h-meds">
          <div className="head">
            <h2 id="h-meds">{t('today')}</h2>
            <Listen text={medsText} lang={lang} />
          </div>
          <div className="days" role="tablist" aria-label={t('day')}>
            {DAYS.map((d) => (
              <button key={d} role="tab" aria-selected={day === d} className={day === d ? 'on' : ''} onClick={() => setDay(d)}>{dayName(d, lang)}</button>
            ))}
          </div>
          {doses.length === 0 && <p className="muted">{t('nothing')}</p>}
          {slots.map(([c, label]) => {
            const due = doses.filter((d) => d.clock === c);
            if (!due.length) return null;
            return (
              <div className="slot" key={c}>
                <div className="when"><b>{label}</b><span>{c}</span></div>
                <ul>
                  {due.map((d) => {
                    const id = `${d.med.id}@${d.t}`;
                    const done = taken.has(id);
                    return (
                      <li key={id} className={done ? 'done' : ''}>
                        <label>
                          <input type="checkbox" checked={done} onChange={() => setTaken((s) => toggle(s, id))} />
                          <Pill med={d.med} />
                          <span className="what">
                            <Name med={d.med} lang={lang} /> {d.med.dose[lang]}
                            <small>{d.med.purpose[lang]}</small>
                          </span>
                          {d.last && <span className="lastone">{t('last')}</span>}
                          {done && <span className="tick">{t('taken')}</span>}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
          <div className="course">
            <span>{t('course')}: <b>{courseTaken} {t('of')} {course.length}</b> {t('doses')}</span>
            <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={course.length} aria-valuenow={courseTaken}>
              {course.map((c) => <i key={c} className={taken.has(`coamoxiclav@${c}`) ? 'on' : ''} />)}
            </div>
            {courseTaken === course.length && <b className="done-msg">{t('courseDone')}</b>}
          </div>
        </section>

        <section className="card changed" aria-labelledby="h-changed">
          <div className="head">
            <h2 id="h-changed">{t('changed')}</h2>
            <Listen text={MEDS.map((m) => `${medName(m, lang)}. ${m.why[lang]}`).join(' ')} lang={lang} />
          </div>
          {(['new', 'restart', 'same'] as const).map((kind) => (
            <div className={`change ${kind}`} key={kind}>
              <h3>{t(kind)}</h3>
              {MEDS.filter((m) => m.change === kind).map((m) => (
                <div className="cmed" key={m.id}>
                  <Pill med={m} />
                  <div>
                    <Name med={m} lang={lang} /> <span className="muted">{m.dose[lang]}, {m.times.join(', ')}</span>
                    <p>{m.why[lang]}</p>
                    {m.until && <p className="until">{t('until')}: <b>{dayName(Math.floor(LAST_DOSE / DAY), lang)}, {clock(LAST_DOSE)}</b></p>}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </section>

        <section className={`card feeling ${a.level}`} aria-labelledby="h-feel">
          <div className="head">
            <h2 id="h-feel">{t('feeling')}</h2>
          </div>
          <p className="muted">{t('feelingSub')}</p>
          <ul className="qs">
            {QUESTIONS.map((q) => (
              <li key={q.id} className={q.level}>
                <label>
                  <input type="checkbox" checked={yes.has(q.id)} onChange={() => setYes((s) => toggle(s, q.id))} />
                  <span>{q.text[lang]}</span>
                </label>
              </li>
            ))}
          </ul>
          <div className={`advice ${a.level}`} aria-live="polite">
            <b>{a.title[lang]}</b>
            <p>{a.body[lang]}</p>
            {a.call && <a className="callbtn" href={`tel:${a.call.number}`}>{t('call')} {a.call.number}<small>{a.call.label[lang]}</small></a>}
          </div>
        </section>

        <section className="card expect" aria-labelledby="h-expect">
          <div className="head">
            <h2 id="h-expect">{t('expect')}</h2>
            <Listen text={RECOVERY.map((r) => r.text[lang]).join(' ')} lang={lang} />
          </div>
          <label className="since">
            <span>{t('since')}: <b>{since}</b></span>
            <input type="range" min={0} max={182} value={since} onChange={(e) => setSince(Number(e.target.value))} />
          </label>
          <ol className="milestones">
            {RECOVERY.map((r) => {
              const label = r.days < 28 ? `1 ${t('week')}` : r.days < 90 ? `${Math.round(r.days / 7)} ${t('weeks')}` : `${Math.round(r.days / 30.4)} ${t('months')}`;
              const pct = Math.min(1, since / r.days);
              return (
                <li key={r.days} className={since >= r.days ? 'past' : ''}>
                  <span className="by">{label}</span>
                  <span className="txt">{r.text[lang]}</span>
                  <span className="track"><i style={{ width: `${pct * 100}%` }} /></span>
                </li>
              );
            })}
          </ol>
          <p className="src">{t('source')}</p>
        </section>

        <section className="card next" aria-labelledby="h-next">
          <h2 id="h-next">{t('next')}</h2>
          <p className="big">{t('around')} {fullDate(followUp, lang)}</p>
          <p>{FOLLOW_UP.text[lang]}</p>
        </section>

        <section className="card numbers" aria-labelledby="h-num">
          <h2 id="h-num">{t('numbers')}</h2>
          <ul>
            <li><a href="tel:144"><b>144</b></a> {t('ambulance')}</li>
            <li><a href="tel:1450"><b>1450</b></a> {t('advice')}</li>
            <li><b>4B</b> {t('ward')}</li>
          </ul>
        </section>
      </main>
      <footer className="foot">{t('foot')}</footer>
    </div>
  );
}
