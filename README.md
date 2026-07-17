# CycleSync 🌸

CycleSync is a production-ready, offline-first cross-platform period and fertility tracker built from scratch using React Native (Expo SDK 57), Zustand, SQLite, and Reanimated. 

The app features premium designs, smooth micro-animations, and a highly customizable user flow (matching elite platforms like Flo or Clue).

---

## 🚀 Key Features Included

1. **Dashboard Widget (`CycleRing`):** SVG circular countdown ring showing cycle day, current phase (menstrual, follicular, ovulation, luteal), and days remaining.
2. **Custom Calendar Grid:** Color-coded layout showing historical flow dates, predicted period starts, high-fertility ranges, and ovulation days.
3. **Advanced Prediction Engine:** Pure TypeScript logic calculating average cycle boundaries across 6 months, predicting periods, ovulation date (next predicted period - 14 days), and fertile window (5 days prior to ovulation). Includes a **Low Confidence** warning if less than 3 cycles are logged.
4. **Daily Logger:** Interactive flow selectors, physical symptoms, emoji-based mood multi-select, sleep and libido trackers, Basal Body Temperature (BBT) logs, LH ovulation tests, and birth control pill taken states. Includes a satisfying success animation and haptic clicks on save.
5. **Insights Dashboard:** Custom, highly responsive SVG Line and Bar charts showing cycle length trends, symptom distribution, mood frequencies, and daily BBT temperature curves.
6. **Contraception & Reminders:** Set pill reminder times and receive daily local push notification alerts.
7. **Privacy App Lock:** Secure 4-digit PIN access check protecting sensitive health profiles.
8. **Doctor PDF & CSV Report Exporter:** Serializes 6 months of historical cycles and logs into a beautifully styled document or CSV grid, launching the OS native sharing sheets.

---

## 🛠️ Tech Stack & Directory Structure

- **Core Framework:** React Native / Expo (Blank TypeScript template)
- **State Store:** Zustand (persisted state sync with database)
- **Local Engine:** SQLite via `expo-sqlite` (for offline reliability)
- **Animations:** `react-native-reanimated` + native spring physics
- **Icons:** Ionicons / Expo Vector Icons
- **Gradients:** `expo-linear-gradient`

### Folder Layout
```
/cyclesync
├── App.tsx                     # Main Entry Point
├── index.ts                    # Root Registration
├── src
│   ├── components              # Custom, animated UI Components
│   │   ├── Button.tsx          # Reanimated Button with haptic clicks
│   │   ├── Card.tsx            # Theme-aware responsive card containers
│   │   ├── CycleRing.tsx       # SVG Circular Progress ring
│   │   ├── CustomCalendar.tsx  # Optimized calendar month grid
│   │   └── CustomChart.tsx     # Custom responsive SVG charts
│   ├── screens                 # Screen UI layouts
│   │   ├── SplashScreen.tsx    # App Lock checking / PIN entry pad
│   │   ├── AuthScreen.tsx      # Google OAuth login interface
│   │   ├── OnboardingScreen.tsx# Swipeable registration wizard
│   │   ├── HomeScreen.tsx      # Core Dashboard
│   │   ├── CalendarScreen.tsx  # Detailed history browser
│   │   ├── LogScreen.tsx       # Daily symptom & mood editor sheet
│   │   ├── InsightsScreen.tsx  # Bar & Line trends visualizer
│   │   └── SettingsScreen.tsx  # Averages, PIN settings, reports export
│   ├── db                      # Database layer
│   │   ├── database.ts         # SQLite Schema definitions and CRUD
│   │   └── seed.ts             # 6-Month synthetic data generator
│   ├── services                # External Services
│   │   ├── export.ts           # PDF / CSV file sharing
│   │   ├── notifications.ts    # local Push Notifications scheduler
│   │   └── supabase.ts         # Optional cloud backup sync
│   ├── store                   # Zustand global store hook
│   └── utils                   # Pure business logic & predictions
```

---

## 💻 Local Setup & Development

### 1. Installation
Clone the workspace and install the node dependencies:
```bash
cd cyclesync
npm install
```

### 2. Configure Environment Variables (Optional)
To activate Supabase cloud sync backups, create a `.env` file at the root of the project:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```
*Note: If these variables are omitted, CycleSync runs in a fully functional offline-first mode, preserving all records inside the secure local SQLite database.*

### 3. Running the App
Start the Expo Metro bundler:
```bash
npx expo start
```
From the interactive terminal menu, press:
- `a` to run on an Android emulator/device.
- `i` to run on an iOS simulator.
- `w` to run on web.

---

## 📊 Run Prediction Unit Tests
Verify the business prediction formulas, cycle boundary calculations, and fertility indicators:
```bash
npx tsx src/utils/run-tests.ts
```
All unit tests are executed immediately, printing a summary of results.

---

## 🔒 Security & Medical Privacy
- **Offline-First:** All symptoms and temperatures are recorded locally first. No third-party ad networks or analytic pixels are bundled.
- **Biometric / PIN Shield:** Restricts app startup until a user enters their configured code.
- **Row-Level Security:** When backup is active, PostgreSQL RLS restricts cloud query rows exclusively to the Google OAuth session owner.
