import { calculatePredictions, getPhaseForDate, PeriodRecord } from './predictions';

function runTests() {
  console.log('=== Running CycleSync Prediction Engine Tests ===\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, message: string) => {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  };

  // Test Case 1: Empty history (default fallback)
  try {
    const predictions = calculatePredictions([], 28, 5);
    assert(predictions.confidence === 'low', 'Empty history should yield low confidence');
    assert(predictions.averageCycleLength === 28, 'Empty history should fallback to default cycle length');
    assert(predictions.averagePeriodLength === 5, 'Empty history should fallback to default period length');
  } catch (err) {
    console.error('Test 1 failed with error', err);
    failed++;
  }

  // Test Case 2: Under 3 cycles logged (low confidence)
  try {
    const mockPeriods: PeriodRecord[] = [
      { id: '1', start_date: '2026-01-01', end_date: '2026-01-05' },
      { id: '2', start_date: '2026-01-29', end_date: '2026-02-02' }, // Cycle length = 28 days
    ];
    const predictions = calculatePredictions(mockPeriods, 30, 6);
    assert(predictions.confidence === 'low', 'Fewer than 3 cycle intervals should yield low confidence');
    assert(predictions.averageCycleLength === 30, 'Fewer than 3 cycle intervals should fallback to default (30)');
    assert(predictions.predictedPeriodStart === '2026-02-28', 'Predicted period start should be 2026-01-29 + 30 days = 2026-02-28');
  } catch (err) {
    console.error('Test 2 failed with error', err);
    failed++;
  }

  // Test Case 3: Sidelined calculations with >= 3 logged cycles (high confidence)
  try {
    const mockPeriods: PeriodRecord[] = [
      { id: '1', start_date: '2026-01-01', end_date: '2026-01-05' }, // 5 days
      { id: '2', start_date: '2026-01-30', end_date: '2026-02-03' }, // 5 days (Jan 30, 31, Feb 1, 2, 3)
      { id: '3', start_date: '2026-02-27', end_date: '2026-03-03' }, // 5 days (Feb 27, 28, Mar 1, 2, 3)
      { id: '4', start_date: '2026-03-27', end_date: '2026-03-31' }, // 5 days (Mar 27, 28, 29, 30, 31)
    ];
    const predictions = calculatePredictions(mockPeriods, 30, 6);
    // We have 3 cycle intervals: 29, 28, 28. Average should be Math.round((29+28+28)/3) = 28
    assert(predictions.confidence === 'high', '3 or more cycles should yield high confidence');
    assert(predictions.averageCycleLength === 28, `Average cycle length should be calculated as 28 (got ${predictions.averageCycleLength})`);
    assert(predictions.averagePeriodLength === 5, `Average period length should be calculated as 5 (got ${predictions.averagePeriodLength})`);
    assert(predictions.predictedPeriodStart === '2026-04-24', 'Predicted period start should be 2026-03-27 + 28 days = 2026-04-24');
    assert(predictions.predictedOvulation === '2026-04-10', 'Ovulation should be 2026-04-24 - 14 days = 2026-04-10');
    assert(predictions.fertileWindowStart === '2026-04-05', 'Fertile window start should be 2026-04-10 - 5 days = 2026-04-05');
    assert(predictions.fertileWindowEnd === '2026-04-10', 'Fertile window end should be 2026-04-10');
  } catch (err) {
    console.error('Test 3 failed with error', err);
    failed++;
  }

  // Test Case 4: Phase calculations
  try {
    const mockPeriods: PeriodRecord[] = [
      { id: '1', start_date: '2026-01-01', end_date: '2026-01-05' },
      { id: '2', start_date: '2026-01-29', end_date: '2026-02-02' },
      { id: '3', start_date: '2026-02-26', end_date: '2026-03-02' },
      { id: '4', start_date: '2026-03-26', end_date: '2026-03-31' },
    ];
    const predictions = calculatePredictions(mockPeriods, 28, 5);
    // Cycle length is 28, period length is 5.
    // Last start: 2026-03-26. Next predicted: 2026-04-23.
    // Ovulation: 2026-04-09. Fertile: 2026-04-04 to 2026-04-09.

    // Check Menstrual phase
    const day2Phase = getPhaseForDate('2026-03-27', '2026-03-26', predictions);
    assert(day2Phase.phase === 'menstrual', 'Day 2 of cycle should be menstrual phase');
    assert(day2Phase.dayOfCycle === 2, 'Day 2 of cycle should report dayOfCycle = 2');

    // Check Follicular phase (Day 6-9)
    const day7Phase = getPhaseForDate('2026-04-01', '2026-03-26', predictions);
    assert(day7Phase.phase === 'follicular', 'Day 7 of cycle should be follicular phase');

    // Check Fertile/Ovulation phase (Day 10-15, where ovulation is 2026-04-09)
    const day14Phase = getPhaseForDate('2026-04-09', '2026-03-26', predictions);
    assert(day14Phase.phase === 'ovulation', 'Ovulation day should report ovulation phase');
    assert(day14Phase.fertilityLevel === 'peak', 'Ovulation day should report peak fertility');

    const day11Phase = getPhaseForDate('2026-04-06', '2026-03-26', predictions);
    assert(day11Phase.phase === 'ovulation', 'Fertile window day should report ovulation phase');
    assert(day11Phase.fertilityLevel === 'high', 'Fertile window day should report high fertility');

    // Check Luteal phase (Day 16+)
    const day20Phase = getPhaseForDate('2026-04-15', '2026-03-26', predictions);
    assert(day20Phase.phase === 'luteal', 'Day 20 of cycle should be luteal phase');
  } catch (err) {
    console.error('Test 4 failed with error', err);
    failed++;
  }

  console.log(`\n=== Tests Summary: ${passed} passed, ${failed} failed ===`);
}

runTests();
