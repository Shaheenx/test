import { readFileSync } from 'node:fs';

const DAY_NAME_TO_NUMBER = new Map([
  ['sunday', 0],
  ['monday', 1],
  ['tuesday', 2],
  ['wednesday', 3],
  ['thursday', 4],
  ['friday', 5],
  ['saturday', 6],
]);

const LEGACY_CLASS_TO_CANONICAL = new Map([
  ['S_CHAIR', 'SHOVON_CHAIR'],
  ['SNIGDHA', 'SNIGDHA'],
  ['F_BERTH', 'FIRST_BERTH'],
  ['F_SEAT', 'FIRST_SEAT'],
  ['AC_B', 'AC_BERTH'],
  ['AC_S', 'AC_SEAT'],
  ['AC_S_CHAIR', 'AC_S_CHAIR'],
  ['SHOVON', 'SHOVON'],
]);

const TRAIN_TYPE_MAP = new Map([
  ['intercity', 'Intercity'],
  ['commuter', 'Local'],
  ['special', 'Express'],
  ['mail', 'Mail'],
  ['local', 'Local'],
  ['express', 'Express'],
]);

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

export function unwrapCollection(payload, key) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && Array.isArray(payload[key])) {
    return payload[key];
  }

  throw new Error(`Expected array payload for "${key}"`);
}

export function invertOffDays(offDays) {
  const blockedDays = new Set(
    (offDays ?? []).map((value) => {
      const normalized = String(value).trim().toLowerCase();
      const dayNumber = DAY_NAME_TO_NUMBER.get(normalized);
      if (dayNumber === undefined) {
        throw new Error(`Unsupported off-day value: ${value}`);
      }
      return dayNumber;
    }),
  );

  return ALL_DAYS.filter((day) => !blockedDays.has(day));
}

/**
 * Resolve a train's canonical days_of_week (inclusion list, Sunday=0).
 *
 * trains_fixed.json already stores `days_of_week` directly (computed
 * upstream) for every current record — this is the preferred source and
 * must be used as-is, never recomputed. `off_days` (exclusion list of day
 * names) is kept ONLY as a fallback for older/legacy source records that
 * predate that conversion. Silently defaulting to "runs every day" when
 * neither field is present is not acceptable — that's wrong data, not
 * missing data, so this throws instead of guessing.
 */
export function resolveDaysOfWeek(train) {
  if (Array.isArray(train.days_of_week)) {
    const days = train.days_of_week
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6);
    if (days.length !== train.days_of_week.length) {
      throw new Error(`Train ${train.number} has an invalid days_of_week entry: ${JSON.stringify(train.days_of_week)}`);
    }
    return [...new Set(days)].sort((a, b) => a - b);
  }

  if (Array.isArray(train.off_days)) {
    return invertOffDays(train.off_days);
  }

  throw new Error(`Train ${train.number} has neither days_of_week nor off_days — refusing to default to "runs every day".`);
}

export function toCanonicalTrainType(value) {
  const canonical = TRAIN_TYPE_MAP.get(String(value).trim().toLowerCase());
  if (!canonical) {
    throw new Error(`Unsupported train type: ${value}`);
  }

  return canonical;
}

export function toCanonicalFareClass(value) {
  const canonical = LEGACY_CLASS_TO_CANONICAL.get(String(value).trim().toUpperCase());
  if (!canonical) {
    throw new Error(`Unsupported fare class: ${value}`);
  }

  return canonical;
}

export function sqlQuote(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  return `'${String(value).replaceAll("'", "''")}'`;
}

export function sqlDate(value) {
  if (!value) {
    return 'NULL';
  }

  return `DATE ${sqlQuote(value)}`;
}

export function sqlTime(value) {
  if (!value) {
    return 'NULL';
  }

  return `TIME ${sqlQuote(value.length === 5 ? `${value}:00` : value)}`;
}

export function sqlBoolean(value) {
  return value ? 'true' : 'false';
}

export function sqlIntArray(values) {
  return `ARRAY[${values.join(', ')}]::SMALLINT[]`;
}
