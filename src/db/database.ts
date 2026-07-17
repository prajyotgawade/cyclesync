import * as SQLite from 'expo-sqlite';
import { PeriodRecord } from '../utils/predictions';

const DB_NAME = 'cyclesync.db';

export interface Profile {
  id: string;
  name: string;
  goal: 'TRACK' | 'AVOID' | 'CONCEIVE' | 'MENOPAUSE';
  average_cycle_length: number;
  average_period_length: number;
  birth_control_type: 'PILL' | 'IUD' | 'PATCH' | 'RING' | 'INJECTION' | 'NONE' | 'OTHER';
  birth_control_reminder_time: string; // HH:MM format
  fertility_mode: number; // 0 or 1
  created_at: string;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  profile_id: string;
  flow: 'NONE' | 'SPOTTING' | 'LIGHT' | 'MEDIUM' | 'HEAVY';
  symptoms: string; // comma-separated (e.g. 'cramps,bloating')
  moods: string; // comma-separated (e.g. 'happy,calm')
  discharge: 'DRY' | 'STICKY' | 'CREAMY' | 'WATERY' | 'EGG_WHITE' | 'NONE';
  sleep_quality: number; // 0.0 to 1.0
  sex_drive: number; // 0.0 to 1.0
  bbt?: number; // Basal Body Temperature
  ovulation_test: 'POSITIVE' | 'NEGATIVE' | 'NONE';
  pill_taken: number; // 0 or 1
  notes: string;
}

let dbInstance: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync(DB_NAME);
  }
  return dbInstance;
}

/**
 * Initializes the SQLite database schemas.
 */
export function initializeDatabase() {
  const db = getDatabase();

  db.execSync(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT,
      goal TEXT,
      average_cycle_length INTEGER,
      average_period_length INTEGER,
      birth_control_type TEXT,
      birth_control_reminder_time TEXT,
      fertility_mode INTEGER,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS cycles (
      id TEXT PRIMARY KEY,
      profile_id TEXT,
      start_date TEXT,
      end_date TEXT,
      is_predicted INTEGER
    );

    CREATE TABLE IF NOT EXISTS daily_logs (
      date TEXT PRIMARY KEY,
      profile_id TEXT,
      flow TEXT,
      symptoms TEXT,
      moods TEXT,
      discharge TEXT,
      sleep_quality REAL,
      sex_drive REAL,
      bbt REAL,
      ovulation_test TEXT,
      pill_taken INTEGER,
      notes TEXT
    );
  `);
  console.log('SQLite Database schema initialized.');
}

// === Profile CRUD Operations ===

export function saveProfile(profile: Profile): void {
  const db = getDatabase();
  db.runSync(
    `INSERT OR REPLACE INTO profiles 
     (id, name, goal, average_cycle_length, average_period_length, birth_control_type, birth_control_reminder_time, fertility_mode, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      profile.id,
      profile.name,
      profile.goal,
      profile.average_cycle_length,
      profile.average_period_length,
      profile.birth_control_type,
      profile.birth_control_reminder_time,
      profile.fertility_mode,
      profile.created_at,
    ]
  );
}

export function getProfile(id: string): Profile | null {
  const db = getDatabase();
  const row = db.getFirstSync<Profile>(
    'SELECT * FROM profiles WHERE id = ?',
    [id]
  );
  return row || null;
}

export function getProfiles(): Profile[] {
  const db = getDatabase();
  return db.getAllSync<Profile>('SELECT * FROM profiles');
}

// === Cycle CRUD Operations ===

export function saveCycle(cycle: PeriodRecord, profileId: string): void {
  const db = getDatabase();
  db.runSync(
    `INSERT OR REPLACE INTO cycles (id, profile_id, start_date, end_date, is_predicted)
     VALUES (?, ?, ?, ?, ?)`,
    [
      cycle.id,
      profileId,
      cycle.start_date,
      cycle.end_date || null,
      cycle.is_predicted ? 1 : 0,
    ]
  );
}

export function getCycles(profileId: string): PeriodRecord[] {
  const db = getDatabase();
  const rows = db.getAllSync<{
    id: string;
    profile_id: string;
    start_date: string;
    end_date: string | null;
    is_predicted: number;
  }>('SELECT * FROM cycles WHERE profile_id = ? ORDER BY start_date ASC', [profileId]);

  return rows.map(r => ({
    id: r.id,
    start_date: r.start_date,
    end_date: r.end_date || undefined,
    is_predicted: r.is_predicted === 1,
  }));
}

export function deleteCycle(cycleId: string): void {
  const db = getDatabase();
  db.runSync('DELETE FROM cycles WHERE id = ?', [cycleId]);
}

// === Daily Log CRUD Operations ===

export function saveDailyLog(log: DailyLog): void {
  const db = getDatabase();
  db.runSync(
    `INSERT OR REPLACE INTO daily_logs 
     (date, profile_id, flow, symptoms, moods, discharge, sleep_quality, sex_drive, bbt, ovulation_test, pill_taken, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      log.date,
      log.profile_id,
      log.flow,
      log.symptoms,
      log.moods,
      log.discharge,
      log.sleep_quality,
      log.sex_drive,
      log.bbt !== undefined ? log.bbt : null,
      log.ovulation_test,
      log.pill_taken,
      log.notes,
    ]
  );
}

export function getDailyLog(date: string, profileId: string): DailyLog | null {
  const db = getDatabase();
  const row = db.getFirstSync<any>(
    'SELECT * FROM daily_logs WHERE date = ? AND profile_id = ?',
    [date, profileId]
  );
  if (!row) return null;
  return {
    ...row,
    bbt: row.bbt !== null ? row.bbt : undefined,
    pill_taken: row.pill_taken === 1 ? 1 : 0,
  };
}

export function getDailyLogs(profileId: string): DailyLog[] {
  const db = getDatabase();
  const rows = db.getAllSync<any>(
    'SELECT * FROM daily_logs WHERE profile_id = ? ORDER BY date DESC',
    [profileId]
  );
  return rows.map(r => ({
    ...r,
    bbt: r.bbt !== null ? r.bbt : undefined,
    pill_taken: r.pill_taken === 1 ? 1 : 0,
  }));
}

export function deleteDailyLog(date: string, profileId: string): void {
  const db = getDatabase();
  db.runSync('DELETE FROM daily_logs WHERE date = ? AND profile_id = ?', [date, profileId]);
}

// === Cleanup Operations ===

export function wipeDatabase(): void {
  const db = getDatabase();
  db.execSync(`
    DELETE FROM profiles;
    DELETE FROM cycles;
    DELETE FROM daily_logs;
  `);
  console.log('Database wiped successfully.');
}
