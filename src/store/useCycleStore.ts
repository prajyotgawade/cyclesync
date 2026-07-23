import { create } from 'zustand';
import {
  Profile,
  DailyLog,
  saveProfile,
  getProfile,
  getProfiles,
  saveCycle,
  getCycles,
  deleteCycle,
  saveDailyLog,
  getDailyLog,
  getDailyLogs,
  deleteDailyLog,
  initializeDatabase,
  wipeDatabase
} from '../db/database';
import {
  calculatePredictions,
  PredictionResult,
  PeriodRecord,
  formatLocalDate,
  addDaysToDate,
  getDaysDifference
} from '../utils/predictions';
import { seedMockData } from '../db/seed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';

interface AuthSession {
  user: {
    id: string;
    email: string;
    name?: string;
    avatarUrl?: string;
  };
  accessToken: string;
}

interface CycleState {
  // Authentication
  session: AuthSession | null;
  isAuthenticated: boolean;
  isInitialized: boolean;

  // App Lock
  pinCode: string | null;
  isAppLocked: boolean;

  // Profile and Data
  profiles: Profile[];
  currentProfile: Profile | null;
  cycles: PeriodRecord[];
  dailyLogs: DailyLog[];
  predictions: PredictionResult | null;
  theme: 'light' | 'dark' | 'system';

  // Core Actions
  initializeApp: () => Promise<void>;
  seedDemo: () => void;
  clearAllData: () => void;
  loginWithRealGoogle: (id: string, name: string, email: string, avatarUrl: string, token: string) => Promise<void>;
  logout: () => Promise<void>;

  // App Lock Actions
  setPinCode: (pin: string | null) => Promise<void>;
  unlockApp: () => void;
  lockApp: () => void;

  // Profile Actions
  createOrUpdateProfile: (profile: Partial<Profile>) => void;
  switchProfile: (profileId: string) => void;

  // Logging & Period Actions
  saveDailyLogEntry: (log: Partial<DailyLog> & { date: string }) => void;
  deleteDailyLogEntry: (date: string) => void;
  addPeriodRecord: (startDate: string, endDate?: string) => void;
  updatePeriodRecord: (cycleId: string, startDate: string, endDate?: string) => void;
  deletePeriodRecord: (cycleId: string) => void;
  setThemeSetting: (theme: 'light' | 'dark' | 'system') => Promise<void>;
}

export const useCycleStore = create<CycleState>((set, get) => ({
  session: null,
  isAuthenticated: false,
  isInitialized: false,
  pinCode: null,
  isAppLocked: false,
  profiles: [],
  currentProfile: null,
  cycles: [],
  dailyLogs: [],
  predictions: null,
  theme: 'system',

  initializeApp: async () => {
    try {
      // 1. Initialize SQLite Database Tables
      initializeDatabase();

      // 2. Load Auth Session from AsyncStorage (Persisted Auth)
      const storedSession = await AsyncStorage.getItem('@cyclesync_session');
      const storedTheme = await AsyncStorage.getItem('@cyclesync_theme') as 'light' | 'dark' | 'system' | null;
      const storedPin = await AsyncStorage.getItem('@cyclesync_pincode');

      const themeSetting = storedTheme || 'system';
      const pinSetting = storedPin || null;

      set({
        theme: themeSetting,
        pinCode: pinSetting,
        isAppLocked: pinSetting !== null, // lock on app launch if PIN exists
      });

      if (storedSession) {
        const session: AuthSession = JSON.parse(storedSession);
        set({ session, isAuthenticated: true });

        // Load data for active profile
        const profileId = session.user.id || 'primary_user'; // use authenticated user id
        let profile = getProfile(profileId);

        if (!profile) {
          // Create default profile if none exists
          profile = {
            id: profileId,
            name: session.user.name || 'User',
            goal: 'TRACK',
            average_cycle_length: 28,
            average_period_length: 5,
            birth_control_type: 'NONE',
            birth_control_reminder_time: '21:00',
            fertility_mode: 0,
            created_at: formatLocalDate(new Date()),
          };
          saveProfile(profile);
        }

        const profiles = getProfiles();
        const cycles = getCycles(profileId);
        const dailyLogs = getDailyLogs(profileId);

        const predictions = calculatePredictions(
          cycles,
          profile.average_cycle_length,
          profile.average_period_length
        );

        set({
          profiles,
          currentProfile: profile,
          cycles,
          dailyLogs,
          predictions,
        });
      }
    } catch (error) {
      console.error('Error during app initialization:', error);
    } finally {
      set({ isInitialized: true });
    }
  },

  seedDemo: () => {
    const profileId = 'primary_user';
    seedMockData();

    // Re-load data from database
    const profile = getProfile(profileId);
    const profiles = getProfiles();
    const cycles = getCycles(profileId);
    const dailyLogs = getDailyLogs(profileId);

    const predictions = profile ? calculatePredictions(
      cycles,
      profile.average_cycle_length,
      profile.average_period_length
    ) : null;

    set({
      currentProfile: profile,
      profiles,
      cycles,
      dailyLogs,
      predictions,
    });
  },

  clearAllData: () => {
    wipeDatabase();
    set({
      currentProfile: null,
      profiles: [],
      cycles: [],
      dailyLogs: [],
      predictions: null,
    });
  },

  loginWithRealGoogle: async (id: string, name: string, email: string, avatarUrl: string, token: string) => {
    const userId = id;

    const mockSession: AuthSession = {
      user: {
        id: userId,
        email,
        name,
        avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
      },
      accessToken: token,
    };

    await AsyncStorage.setItem('@cyclesync_session', JSON.stringify(mockSession));

    set({
      session: mockSession,
      isAuthenticated: true,
    });

    // Hydrate tables for new profile
    const profileId = userId;
    let profile = getProfile(profileId);
    if (!profile) {
      profile = {
        id: profileId,
        name,
        goal: 'TRACK',
        average_cycle_length: 28,
        average_period_length: 5,
        birth_control_type: 'NONE',
        birth_control_reminder_time: '21:00',
        fertility_mode: 0,
        created_at: formatLocalDate(new Date()),
      };
      saveProfile(profile);
    }

    const profiles = getProfiles();
    const cycles = getCycles(profileId);
    const dailyLogs = getDailyLogs(profileId);
    const predictions = calculatePredictions(
      cycles,
      profile.average_cycle_length,
      profile.average_period_length
    );

    set({
      profiles,
      currentProfile: profile,
      cycles,
      dailyLogs,
      predictions,
    });
  },

  logout: async () => {
    await AsyncStorage.removeItem('@cyclesync_session');
    set({
      session: null,
      isAuthenticated: false,
      currentProfile: null,
      cycles: [],
      dailyLogs: [],
      predictions: null,
    });
  },

  setPinCode: async (pin: string | null) => {
    if (pin) {
      await AsyncStorage.setItem('@cyclesync_pincode', pin);
    } else {
      await AsyncStorage.removeItem('@cyclesync_pincode');
    }
    set({ pinCode: pin });
  },

  unlockApp: () => set({ isAppLocked: false }),
  lockApp: () => set({ isAppLocked: true }),

  createOrUpdateProfile: (updatedProfileFields: Partial<Profile>) => {
    const { currentProfile } = get();
    if (!currentProfile) return;

    const updated: Profile = {
      ...currentProfile,
      ...updatedProfileFields,
    };

    saveProfile(updated);

    // Refresh calculations using new averages
    const cycles = getCycles(updated.id);
    const predictions = calculatePredictions(
      cycles,
      updated.average_cycle_length,
      updated.average_period_length
    );

    set({
      currentProfile: updated,
      profiles: getProfiles(),
      predictions,
    });
  },

  switchProfile: (profileId: string) => {
    const profile = getProfile(profileId);
    if (!profile) return;

    const cycles = getCycles(profileId);
    const dailyLogs = getDailyLogs(profileId);
    const predictions = calculatePredictions(
      cycles,
      profile.average_cycle_length,
      profile.average_period_length
    );

    set({
      currentProfile: profile,
      cycles,
      dailyLogs,
      predictions,
    });
  },

  saveDailyLogEntry: (logFields: Partial<DailyLog> & { date: string }) => {
    const { currentProfile, dailyLogs, cycles } = get();
    if (!currentProfile) return;

    // Check if log already exists
    const existingLog = dailyLogs.find(l => l.date === logFields.date);

    const newLog: DailyLog = {
      date: logFields.date,
      profile_id: currentProfile.id,
      flow: logFields.flow !== undefined ? logFields.flow : (existingLog ? existingLog.flow : 'NONE'),
      symptoms: logFields.symptoms !== undefined ? logFields.symptoms : (existingLog ? existingLog.symptoms : ''),
      moods: logFields.moods !== undefined ? logFields.moods : (existingLog ? existingLog.moods : ''),
      discharge: logFields.discharge !== undefined ? logFields.discharge : (existingLog ? existingLog.discharge : 'NONE'),
      sleep_quality: logFields.sleep_quality !== undefined ? logFields.sleep_quality : (existingLog ? existingLog.sleep_quality : 0.8),
      sex_drive: logFields.sex_drive !== undefined ? logFields.sex_drive : (existingLog ? existingLog.sex_drive : 0.5),
      bbt: logFields.bbt !== undefined ? logFields.bbt : (existingLog ? existingLog.bbt : undefined),
      ovulation_test: logFields.ovulation_test !== undefined ? logFields.ovulation_test : (existingLog ? existingLog.ovulation_test : 'NONE'),
      pill_taken: logFields.pill_taken !== undefined ? logFields.pill_taken : (existingLog ? existingLog.pill_taken : 0),
      notes: logFields.notes !== undefined ? logFields.notes : (existingLog ? existingLog.notes : ''),
    };

    saveDailyLog(newLog);

    // Smart Auto-Linking Period Data:
    // If the user logs flow (HEAVY, MEDIUM, LIGHT, SPOTTING) on a date, check if a cycle record contains/covers this date.
    // If not, we check if there's a period start date within +/- 4 days of this date.
    // If there is, we extend that period start/end. If not, we create a new period record.
    if (newLog.flow !== 'NONE') {
      const targetDate = newLog.date;
      const sortedCycles = [...cycles].filter(c => !c.is_predicted)
        .sort((a, b) => a.start_date.localeCompare(b.start_date));

      let associated = false;

      for (const cycle of sortedCycles) {
        const startDiff = getDaysDifference(targetDate, cycle.start_date);

        // Date is inside or very close to an existing cycle
        if (cycle.end_date) {
          if (targetDate >= cycle.start_date && targetDate <= cycle.end_date) {
            associated = true;
            break;
          }

          // Close to end date -> extend end date
          const endDiff = getDaysDifference(targetDate, cycle.end_date);
          if (endDiff > 0 && endDiff <= 3) {
            cycle.end_date = targetDate;
            saveCycle(cycle, currentProfile.id);
            associated = true;
            break;
          }
        } else {
          // Cycle has no end date yet
          if (startDiff >= 0 && startDiff <= 7) {
            // within 7 days of start date, mark as end date if it is after start date
            if (startDiff > 0) {
              cycle.end_date = targetDate;
              saveCycle(cycle, currentProfile.id);
            }
            associated = true;
            break;
          }
        }
      }

      if (!associated) {
        // Create new period record
        const newCycle: PeriodRecord = {
          id: `cycle_${Date.now()}`,
          start_date: targetDate,
          end_date: targetDate, // initially single day
          is_predicted: false,
        };
        saveCycle(newCycle, currentProfile.id);
      }
    }

    // Refresh store arrays
    const updatedCycles = getCycles(currentProfile.id);
    const updatedLogs = getDailyLogs(currentProfile.id);
    const predictions = calculatePredictions(
      updatedCycles,
      currentProfile.average_cycle_length,
      currentProfile.average_period_length
    );

    set({
      cycles: updatedCycles,
      dailyLogs: updatedLogs,
      predictions,
    });
  },

  deleteDailyLogEntry: (date: string) => {
    const { currentProfile } = get();
    if (!currentProfile) return;

    deleteDailyLog(date, currentProfile.id);
    const updatedLogs = getDailyLogs(currentProfile.id);

    set({
      dailyLogs: updatedLogs,
    });
  },

  addPeriodRecord: (startDate: string, endDate?: string) => {
    const { currentProfile } = get();
    if (!currentProfile) return;

    const newCycle: PeriodRecord = {
      id: `cycle_${Date.now()}`,
      start_date: startDate,
      end_date: endDate,
      is_predicted: false,
    };

    saveCycle(newCycle, currentProfile.id);

    const updatedCycles = getCycles(currentProfile.id);
    const predictions = calculatePredictions(
      updatedCycles,
      currentProfile.average_cycle_length,
      currentProfile.average_period_length
    );

    set({
      cycles: updatedCycles,
      predictions,
    });
  },

  updatePeriodRecord: (cycleId: string, startDate: string, endDate?: string) => {
    const { currentProfile } = get();
    if (!currentProfile) return;

    const cycle: PeriodRecord = {
      id: cycleId,
      start_date: startDate,
      end_date: endDate,
      is_predicted: false,
    };

    saveCycle(cycle, currentProfile.id);

    const updatedCycles = getCycles(currentProfile.id);
    const predictions = calculatePredictions(
      updatedCycles,
      currentProfile.average_cycle_length,
      currentProfile.average_period_length
    );

    set({
      cycles: updatedCycles,
      predictions,
    });
  },

  deletePeriodRecord: (cycleId: string) => {
    const { currentProfile } = get();
    if (!currentProfile) return;

    deleteCycle(cycleId);

    const updatedCycles = getCycles(currentProfile.id);
    const predictions = calculatePredictions(
      updatedCycles,
      currentProfile.average_cycle_length,
      currentProfile.average_period_length
    );

    set({
      cycles: updatedCycles,
      predictions,
    });
  },

  setThemeSetting: async (newTheme: 'light' | 'dark' | 'system') => {
    await AsyncStorage.setItem('@cyclesync_theme', newTheme);
    set({ theme: newTheme });
  },
}));
