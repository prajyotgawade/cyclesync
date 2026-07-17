export interface PeriodRecord {
  id: string;
  start_date: string; // YYYY-MM-DD
  end_date?: string;   // YYYY-MM-DD
  is_predicted?: boolean;
}

export interface PredictionResult {
  averageCycleLength: number;
  averagePeriodLength: number;
  predictedPeriodStart: string; // YYYY-MM-DD
  predictedOvulation: string;   // YYYY-MM-DD
  fertileWindowStart: string;   // YYYY-MM-DD
  fertileWindowEnd: string;     // YYYY-MM-DD
  confidence: 'high' | 'low';
}

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export interface DatePhaseInfo {
  date: string;
  phase: CyclePhase;
  fertilityLevel: 'low' | 'high' | 'peak';
  dayOfCycle: number;
}

// Helper: Parse date string to Date object (local timezone-safe)
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Helper: Format Date object to YYYY-MM-DD
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Helper: Calculate difference in days between two YYYY-MM-DD dates
export function getDaysDifference(d1Str: string, d2Str: string): number {
  const d1 = parseLocalDate(d1Str);
  const d2 = parseLocalDate(d2Str);
  const diffTime = d1.getTime() - d2.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

// Helper: Add days to date string, returning YYYY-MM-DD
export function addDaysToDate(dateStr: string, days: number): string {
  const date = parseLocalDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}

/**
 * Predicts the next period details based on historical data.
 */
export function calculatePredictions(
  periods: PeriodRecord[],
  defaultCycle: number = 28,
  defaultPeriod: number = 5
): PredictionResult {
  // Sort periods ascending by start date
  const sortedPeriods = [...periods]
    .filter(p => !p.is_predicted)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  let averageCycleLength = defaultCycle;
  let averagePeriodLength = defaultPeriod;
  let confidence: 'high' | 'low' = 'low';

  const cycleLengths: number[] = [];
  const periodDurations: number[] = [];

  // 1. Calculate actual cycle lengths (difference between consecutive start dates)
  for (let i = 0; i < sortedPeriods.length - 1; i++) {
    const cycleLen = getDaysDifference(sortedPeriods[i + 1].start_date, sortedPeriods[i].start_date);
    // Filter anomalies (e.g. cycles should reasonably be between 15 and 90 days)
    if (cycleLen >= 15 && cycleLen <= 90) {
      cycleLengths.push(cycleLen);
    }
  }

  // 2. Calculate actual period durations
  for (const period of sortedPeriods) {
    if (period.end_date) {
      const duration = getDaysDifference(period.end_date, period.start_date) + 1;
      if (duration > 0 && duration <= 15) {
        periodDurations.push(duration);
      }
    }
  }

  // Determine averages if we have sufficient data
  if (cycleLengths.length >= 3) {
    // Average of the last 6 cycles
    const recentCycles = cycleLengths.slice(-6);
    averageCycleLength = Math.round(recentCycles.reduce((a, b) => a + b, 0) / recentCycles.length);
    confidence = 'high';
  }

  if (periodDurations.length >= 3) {
    const recentDurations = periodDurations.slice(-6);
    averagePeriodLength = Math.round(recentDurations.reduce((a, b) => a + b, 0) / recentDurations.length);
  }

  // Default fallback if we don't have any periods logged at all
  if (sortedPeriods.length === 0) {
    const today = formatLocalDate(new Date());
    const predictedStart = addDaysToDate(today, 10);
    const predictedOvulation = addDaysToDate(predictedStart, -14);
    return {
      averageCycleLength,
      averagePeriodLength,
      predictedPeriodStart: predictedStart,
      predictedOvulation,
      fertileWindowStart: addDaysToDate(predictedOvulation, -5),
      fertileWindowEnd: predictedOvulation,
      confidence: 'low',
    };
  }

  // Predict based on last period start date
  const lastPeriod = sortedPeriods[sortedPeriods.length - 1];
  const predictedPeriodStart = addDaysToDate(lastPeriod.start_date, averageCycleLength);
  const predictedOvulation = addDaysToDate(predictedPeriodStart, -14);
  const fertileWindowStart = addDaysToDate(predictedOvulation, -5);
  const fertileWindowEnd = predictedOvulation;

  return {
    averageCycleLength,
    averagePeriodLength,
    predictedPeriodStart,
    predictedOvulation,
    fertileWindowStart,
    fertileWindowEnd,
    confidence,
  };
}

/**
 * Calculates phase, fertility level, and day of cycle for a specific date.
 */
export function getPhaseForDate(
  targetDateStr: string,
  lastPeriodStartStr: string,
  predictions: PredictionResult
): DatePhaseInfo {
  const daysSinceStart = getDaysDifference(targetDateStr, lastPeriodStartStr) + 1;
  const cycleLength = predictions.averageCycleLength;
  const periodLength = predictions.averagePeriodLength;

  // Wrap or determine relative cycle day
  let dayOfCycle = daysSinceStart;
  if (daysSinceStart <= 0) {
    // Date is before last period, compute a relative negative day or handle gracefully
    dayOfCycle = ((daysSinceStart % cycleLength) + cycleLength) % cycleLength;
    if (dayOfCycle === 0) dayOfCycle = cycleLength;
  } else if (daysSinceStart > cycleLength) {
    // User is "late" or we are predicting future cycles
    dayOfCycle = ((daysSinceStart - 1) % cycleLength) + 1;
  }

  // Calculate specific days relative to predicted start date of the *current* cycle
  const currentCycleStartStr = daysSinceStart > 0 && daysSinceStart <= cycleLength
    ? lastPeriodStartStr
    : addDaysToDate(lastPeriodStartStr, Math.floor((daysSinceStart - 1) / cycleLength) * cycleLength);

  const predictedNextStartStr = addDaysToDate(currentCycleStartStr, cycleLength);
  const ovulationStr = addDaysToDate(predictedNextStartStr, -14);
  const fertileStartStr = addDaysToDate(ovulationStr, -5);
  const fertileEndStr = ovulationStr;

  let phase: CyclePhase = 'follicular';
  let fertilityLevel: 'low' | 'high' | 'peak' = 'low';

  // 1. Menstrual Phase (Days 1 to average period length)
  if (dayOfCycle <= periodLength) {
    phase = 'menstrual';
    fertilityLevel = 'low';
  }
  // 2. Ovulation Phase / Fertile Window
  else if (targetDateStr >= fertileStartStr && targetDateStr <= fertileEndStr) {
    phase = 'ovulation';
    if (targetDateStr === ovulationStr) {
      fertilityLevel = 'peak';
    } else {
      fertilityLevel = 'high';
    }
  }
  // 3. Luteal or Follicular
  else if (targetDateStr > ovulationStr && targetDateStr < predictedNextStartStr) {
    phase = 'luteal';
    fertilityLevel = 'low';
  } else {
    phase = 'follicular';
    fertilityLevel = 'low';
  }

  return {
    date: targetDateStr,
    phase,
    fertilityLevel,
    dayOfCycle,
  };
}
