import { saveProfile, saveCycle, saveDailyLog, wipeDatabase, Profile, DailyLog } from './database';
import { PeriodRecord, addDaysToDate, formatLocalDate, parseLocalDate, getDaysDifference } from '../utils/predictions';

export function seedMockData() {
  console.log('Seeding mock database...');
  wipeDatabase();

  const profileId = 'primary_user';
  
  // 1. Save Profile
  const profile: Profile = {
    id: profileId,
    name: 'Jane Doe',
    goal: 'TRACK',
    average_cycle_length: 28,
    average_period_length: 5,
    birth_control_type: 'NONE',
    birth_control_reminder_time: '21:00',
    fertility_mode: 1, // Enabled to showcase BBT charts and ovulation testing
    created_at: '2026-01-01',
  };
  saveProfile(profile);

  // 2. Setup 7 Cycles over the last 6 months
  // Current date in prompt: July 13, 2026
  // Let's create periods starting at:
  // Cycle 1: Jan 05 - Jan 09 (len 5)
  // Cycle 2: Feb 02 - Feb 06 (len 5, cycle interval 28)
  // Cycle 3: Mar 02 - Mar 06 (len 5, cycle interval 28)
  // Cycle 4: Mar 30 - Apr 03 (len 5, cycle interval 28)
  // Cycle 5: Apr 27 - May 01 (len 5, cycle interval 28)
  // Cycle 6: May 25 - May 29 (len 5, cycle interval 28)
  // Cycle 7: Jun 22 - Jun 26 (len 5, cycle interval 28)
  // Predicted Cycle 8: Jul 20 (since Jun 22 + 28 days = Jul 20)
  
  const periodStarts = [
    '2026-01-05',
    '2026-02-02',
    '2026-03-02',
    '2026-03-30',
    '2026-04-27',
    '2026-05-25',
    '2026-06-22',
  ];

  const cycleRecords: PeriodRecord[] = periodStarts.map((start, index) => {
    const record: PeriodRecord = {
      id: `cycle_mock_${index + 1}`,
      start_date: start,
      end_date: addDaysToDate(start, 4), // 5 days total duration
      is_predicted: false,
    };
    saveCycle(record, profileId);
    return record;
  });

  // 3. Generate Daily Logs for every single day from Jan 1, 2026 to July 13, 2026
  const startDate = parseLocalDate('2026-01-01');
  const endDate = parseLocalDate('2026-07-13');
  
  let current = new Date(startDate);
  
  while (current <= endDate) {
    const dateStr = formatLocalDate(current);
    
    // Find which cycle this date belongs to or is closest to
    // Find the latest start date before or on this date
    let lastStartStr = periodStarts[0];
    let nextStartStr = periodStarts[1];
    
    for (let i = 0; i < periodStarts.length; i++) {
      if (periodStarts[i] <= dateStr) {
        lastStartStr = periodStarts[i];
        nextStartStr = periodStarts[i + 1] || addDaysToDate(lastStartStr, 28);
      }
    }

    const dayOfCycle = getDaysDifference(dateStr, lastStartStr) + 1;
    
    // Log variables
    let flow: 'NONE' | 'SPOTTING' | 'LIGHT' | 'MEDIUM' | 'HEAVY' = 'NONE';
    let symptomsList: string[] = [];
    let moodsList: string[] = [];
    let discharge: 'DRY' | 'STICKY' | 'CREAMY' | 'WATERY' | 'EGG_WHITE' | 'NONE' = 'NONE';
    let sleepQuality = 0.7 + Math.random() * 0.3; // mostly good sleep
    let sexDrive = 0.2 + Math.random() * 0.8;
    let bbt: number | undefined = undefined;
    let ovulationTest: 'POSITIVE' | 'NEGATIVE' | 'NONE' = 'NONE';
    let pillTaken = 0;
    let notes = '';

    // Menstrual Phase (Days 1 to 5)
    if (dayOfCycle >= 1 && dayOfCycle <= 5) {
      if (dayOfCycle === 1) flow = 'HEAVY';
      else if (dayOfCycle === 2) flow = 'HEAVY';
      else if (dayOfCycle === 3) flow = 'MEDIUM';
      else if (dayOfCycle === 4) flow = 'LIGHT';
      else flow = 'SPOTTING';

      symptomsList = ['cramps', 'fatigue'];
      if (Math.random() > 0.4) symptomsList.push('backache');
      moodsList = ['sad', 'irritable'];
      discharge = 'NONE';
      sleepQuality = 0.5 + Math.random() * 0.3;
      sexDrive = 0.1 + Math.random() * 0.3;
      
      // Basal body temperature is lower during menstruation
      bbt = 36.1 + (dayOfCycle * 0.05); // 36.1 to 36.3
    }
    // Follicular Phase (Days 6 to 9)
    else if (dayOfCycle >= 6 && dayOfCycle <= 9) {
      flow = 'NONE';
      if (Math.random() > 0.7) symptomsList = ['headache'];
      moodsList = ['calm', 'energetic'];
      discharge = dayOfCycle <= 7 ? 'DRY' : 'STICKY';
      sexDrive = 0.4 + Math.random() * 0.4;
      bbt = 36.3 + (Math.random() * 0.1);
    }
    // Fertile Window / Ovulation Phase (Days 10 to 15, Ovulation on Day 14)
    else if (dayOfCycle >= 10 && dayOfCycle <= 15) {
      flow = 'NONE';
      moodsList = ['happy', 'energetic'];
      
      if (dayOfCycle === 14) {
        discharge = 'EGG_WHITE';
        ovulationTest = 'POSITIVE';
        sexDrive = 0.9;
        bbt = 36.1; // BBT dip on ovulation day
        notes = 'Felt mild ovulation pain on right side. High energy!';
      } else {
        discharge = 'WATERY';
        ovulationTest = dayOfCycle === 13 ? 'POSITIVE' : 'NEGATIVE';
        sexDrive = 0.7 + Math.random() * 0.2;
        bbt = 36.2 + (Math.random() * 0.1);
      }
    }
    // Luteal Phase (Days 16 to 28)
    else {
      flow = 'NONE';
      // Progesterone rise pushes BBT up
      bbt = 36.6 + ((dayOfCycle - 15) * 0.02) + (Math.random() * 0.08); // 36.6 to 36.85
      
      if (dayOfCycle >= 24) {
        // Late luteal (PMS)
        symptomsList = ['bloating', 'tender breasts'];
        if (Math.random() > 0.5) symptomsList.push('acne');
        moodsList = ['irritable', 'anxious'];
        discharge = 'CREAMY';
        sleepQuality = 0.6 + Math.random() * 0.2;
        sexDrive = 0.2 + Math.random() * 0.3;
      } else {
        // Early luteal
        discharge = 'STICKY';
        moodsList = ['calm', 'happy'];
      }
    }

    const log: DailyLog = {
      date: dateStr,
      profile_id: profileId,
      flow,
      symptoms: symptomsList.join(','),
      moods: moodsList.join(','),
      discharge,
      sleep_quality: parseFloat(sleepQuality.toFixed(2)),
      sex_drive: parseFloat(sexDrive.toFixed(2)),
      bbt: bbt ? parseFloat(bbt.toFixed(2)) : undefined,
      ovulation_test: ovulationTest,
      pill_taken: pillTaken,
      notes,
    };

    saveDailyLog(log);

    // Increment day
    current.setDate(current.getDate() + 1);
  }

  console.log('Seed completed successfully. Seeded 7 cycles and daily logs up to July 13, 2026.');
}
