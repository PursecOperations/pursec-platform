// Regla de la prueba gratuita del plan mensual (determinista, sin IA).
//
// La prueba termina en el MÁS TARDÍO de:
//   a) inicio + 7 días
//   b) el lunes siguiente a la próxima carrera, a las 23:59:59 hora de Madrid
// Así la prueba siempre incluye un fin de semana de carrera completo.
// Si no hay ninguna carrera futura en el calendario, se usa solo (a).
// maxTrialDays (opcional) pone un tope; sin él no hay tope.

export const TRIAL_MIN_DAYS = 7;
export const TRIAL_TIMEZONE = "Europe/Madrid";

const DAY_MS = 24 * 60 * 60 * 1000;

// "2026-10-04" -> "2026-10-05" (lunes siguiente; si la carrera es en lunes, el lunes de la semana después)
export function mondayAfter(raceDate) {
  const [y, m, d] = raceDate.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  const isoDow = utc.getUTCDay() === 0 ? 7 : utc.getUTCDay(); // lunes=1 … domingo=7
  const monday = new Date(utc.getTime() + (8 - isoDow) * DAY_MS);
  return monday.toISOString().slice(0, 10);
}

// Diferencia (ms) entre la hora local de `timeZone` y UTC en el instante `date`
function tzOffsetMs(date, timeZone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).formatToParts(date).map((p) => [p.type, p.value])
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

// Fecha local "YYYY-MM-DD" + hora local -> instante UTC (Date)
export function localToUtc(dateStr, hh, mm, ss, timeZone = TRIAL_TIMEZONE) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm, ss));
  // Dos pasadas para cubrir el cambio de horario
  let result = new Date(guess.getTime() - tzOffsetMs(guess, timeZone));
  result = new Date(guess.getTime() - tzOffsetMs(result, timeZone));
  return result;
}

/**
 * @param {Date} now                 momento del alta
 * @param {string[]} raceDates       fechas "YYYY-MM-DD" de carreras (cualquier orden)
 * @param {{maxTrialDays?: number}} opts
 * @returns {{trialEnd: Date, rule: string, nextRace: string|null}}
 */
export function computeTrialEnd(now, raceDates, opts = {}) {
  const minEnd = new Date(now.getTime() + TRIAL_MIN_DAYS * DAY_MS);

  // Fecha de hoy en Madrid, para decidir qué carreras son "próximas"
  const todayMadrid = new Intl.DateTimeFormat("en-CA", { timeZone: TRIAL_TIMEZONE }).format(now);
  const upcoming = raceDates.filter((d) => d >= todayMadrid).sort();
  const nextRace = upcoming[0] || null;

  let trialEnd = minEnd;
  let rule = nextRace ? "7_dias" : "7_dias_sin_calendario";

  if (nextRace) {
    const raceEnd = localToUtc(mondayAfter(nextRace), 23, 59, 59);
    if (raceEnd > minEnd) {
      trialEnd = raceEnd;
      rule = "lunes_tras_carrera";
    }
  }

  if (opts.maxTrialDays) {
    const cap = new Date(now.getTime() + opts.maxTrialDays * DAY_MS);
    if (trialEnd > cap) {
      trialEnd = cap;
      rule += "_con_tope";
    }
  }

  return { trialEnd, rule, nextRace };
}
