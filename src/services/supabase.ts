import { createClient } from '@supabase/supabase-js';
import { Profile, DailyLog } from '../db/database';
import { PeriodRecord } from '../utils/predictions';

// Load Expo environment variables
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

if (!supabase) {
  console.log('Supabase credentials missing. Running in local-only / mock authentication mode.');
}

/**
 * Backs up profile, cycle records, and daily logs to Supabase database.
 */
export async function backupDataToCloud(
  profile: Profile,
  cycles: PeriodRecord[],
  logs: DailyLog[]
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User is not logged in' };
    }

    // 1. Sync Profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id, // Tie to Supabase authenticated user id
        name: profile.name,
        goal: profile.goal,
        average_cycle_length: profile.average_cycle_length,
        average_period_length: profile.average_period_length,
        birth_control_type: profile.birth_control_type,
        birth_control_reminder_time: profile.birth_control_reminder_time,
        fertility_mode: profile.fertility_mode,
        created_at: profile.created_at,
      });

    if (profileError) throw profileError;

    // 2. Sync Cycles
    const formattedCycles = cycles.map(c => ({
      id: c.id,
      profile_id: user.id,
      start_date: c.start_date,
      end_date: c.end_date || null,
      is_predicted: c.is_predicted ? 1 : 0,
    }));

    if (formattedCycles.length > 0) {
      const { error: cyclesError } = await supabase
        .from('cycles')
        .upsert(formattedCycles);
      if (cyclesError) throw cyclesError;
    }

    // 3. Sync Daily Logs
    const formattedLogs = logs.map(l => ({
      date: l.date,
      profile_id: user.id,
      flow: l.flow,
      symptoms: l.symptoms,
      moods: l.moods,
      discharge: l.discharge,
      sleep_quality: l.sleep_quality,
      sex_drive: l.sex_drive,
      bbt: l.bbt || null,
      ovulation_test: l.ovulation_test,
      pill_taken: l.pill_taken,
      notes: l.notes,
    }));

    if (formattedLogs.length > 0) {
      const { error: logsError } = await supabase
        .from('daily_logs')
        .upsert(formattedLogs);
      if (logsError) throw logsError;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Cloud backup failed:', error);
    return { success: false, error: error.message || 'Unknown sync error' };
  }
}

/**
 * Downloads profile, cycle records, and daily logs from Supabase.
 */
export async function downloadDataFromCloud(): Promise<{
  success: boolean;
  profile?: Profile;
  cycles?: PeriodRecord[];
  logs?: DailyLog[];
  error?: string;
}> {
  if (!supabase) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User is not logged in' };
    }

    // 1. Fetch Profile
    const { data: profileRow, error: pError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (pError && pError.code !== 'PGRST116') throw pError; // PGRST116 is code for "no rows returned"

    if (!profileRow) {
      return { success: true }; // Nothing to restore, but operation succeeded
    }

    // 2. Fetch Cycles
    const { data: cycleRows, error: cError } = await supabase
      .from('cycles')
      .select('*')
      .eq('profile_id', user.id);

    if (cError) throw cError;

    // 3. Fetch Daily Logs
    const { data: logRows, error: lError } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('profile_id', user.id);

    if (lError) throw lError;

    const profile: Profile = {
      id: profileRow.id,
      name: profileRow.name,
      goal: profileRow.goal,
      average_cycle_length: profileRow.average_cycle_length,
      average_period_length: profileRow.average_period_length,
      birth_control_type: profileRow.birth_control_type,
      birth_control_reminder_time: profileRow.birth_control_reminder_time,
      fertility_mode: profileRow.fertility_mode,
      created_at: profileRow.created_at,
    };

    const cycles: PeriodRecord[] = (cycleRows || []).map(r => ({
      id: r.id,
      start_date: r.start_date,
      end_date: r.end_date || undefined,
      is_predicted: r.is_predicted === 1,
    }));

    const logs: DailyLog[] = (logRows || []).map(r => ({
      date: r.date,
      profile_id: r.profile_id,
      flow: r.flow,
      symptoms: r.symptoms || '',
      moods: r.moods || '',
      discharge: r.discharge || 'NONE',
      sleep_quality: r.sleep_quality || 0.8,
      sex_drive: r.sex_drive || 0.5,
      bbt: r.bbt !== null ? r.bbt : undefined,
      ovulation_test: r.ovulation_test || 'NONE',
      pill_taken: r.pill_taken === 1 ? 1 : 0,
      notes: r.notes || '',
    }));

    return {
      success: true,
      profile,
      cycles,
      logs,
    };
  } catch (error: any) {
    console.error('Cloud restore failed:', error);
    return { success: false, error: error.message || 'Unknown restore error' };
  }
}
