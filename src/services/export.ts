import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Profile, DailyLog } from '../db/database';
import { PeriodRecord } from '../utils/predictions';

interface ExportOptions {
  startDate: string;
  endDate: string;
}

/**
 * Exports health history to a beautifully styled medical PDF report.
 */
export async function exportToPDF(
  profile: Profile,
  cycles: PeriodRecord[],
  logs: DailyLog[],
  options: ExportOptions
): Promise<void> {
  const filteredLogs = logs
    .filter(log => log.date >= options.startDate && log.date <= options.endDate)
    .sort((a, b) => b.date.localeCompare(a.date));

  const filteredCycles = cycles
    .filter(c => c.start_date >= options.startDate && c.start_date <= options.endDate)
    .sort((a, b) => b.start_date.localeCompare(a.start_date));

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>CycleSync Doctor Report - ${profile.name}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #333;
            line-height: 1.4;
            padding: 24px;
          }
          .header {
            border-bottom: 2px solid #B388FF;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .header h1 {
            color: #7C4DFF;
            margin: 0 0 8px 0;
            font-size: 28px;
          }
          .header p {
            margin: 0;
            color: #666;
            font-size: 14px;
          }
          .patient-info {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            background-color: #F8F6FC;
            padding: 16px;
            border-radius: 12px;
            margin-bottom: 24px;
          }
          .info-item {
            font-size: 14px;
          }
          .info-item strong {
            color: #555;
          }
          h2 {
            color: #7C4DFF;
            font-size: 18px;
            border-bottom: 1px solid #E5E0EC;
            padding-bottom: 6px;
            margin-top: 24px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
            font-size: 13px;
          }
          th, td {
            text-align: left;
            padding: 8px 10px;
            border-bottom: 1px solid #E5E0EC;
          }
          th {
            background-color: #F3EDFA;
            color: #7C4DFF;
            font-weight: 600;
          }
          .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .badge-menstrual { background-color: #F2B8B5; color: #5B2C2A; }
          .badge-heavy { background-color: #F2B8B5; color: #5B2C2A; }
          .badge-medium { background-color: #FFE4E1; color: #5B2C2A; }
          .badge-light { background-color: #E8DEF8; color: #2C1A4D; }
          .badge-spotting { background-color: #FAF6FC; color: #625B71; }
          
          .symptom-tag {
            background-color: #FAF6FC;
            border: 1px solid #E8DEF8;
            padding: 1px 4px;
            border-radius: 4px;
            margin-right: 4px;
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>CycleSync Medical Export</h1>
          <p>Generated on ${new Date().toLocaleDateString()} | Report Range: ${options.startDate} to ${options.endDate}</p>
        </div>

        <div class="patient-info">
          <div class="info-item"><strong>Patient Name:</strong> ${profile.name}</div>
          <div class="info-item"><strong>Primary Goal:</strong> ${profile.goal}</div>
          <div class="info-item"><strong>Average Cycle Length:</strong> ${profile.average_cycle_length} Days</div>
          <div class="info-item"><strong>Average Period Length:</strong> ${profile.average_period_length} Days</div>
          <div class="info-item"><strong>Contraception:</strong> ${profile.birth_control_type}</div>
          <div class="info-item"><strong>Fertility Monitoring:</strong> ${profile.fertility_mode ? 'Enabled' : 'Disabled'}</div>
        </div>

        <h2>Period History</h2>
        ${
          filteredCycles.length === 0
            ? '<p>No periods logged in this date range.</p>'
            : `
          <table>
            <thead>
              <tr>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Duration (Days)</th>
              </tr>
            </thead>
            <tbody>
              ${filteredCycles
                .map(c => {
                  const duration = c.end_date
                    ? Math.round(
                        (new Date(c.end_date).getTime() - new Date(c.start_date).getTime()) /
                          (1000 * 60 * 60 * 24)
                      ) + 1
                    : 'Ongoing';
                  return `
                  <tr>
                    <td><strong>${c.start_date}</strong></td>
                    <td>${c.end_date || 'N/A'}</td>
                    <td>${duration}</td>
                  </tr>
                `;
                })
                .join('')}
            </tbody>
          </table>
        `
        }

        <h2>Daily Log Details</h2>
        ${
          filteredLogs.length === 0
            ? '<p>No daily health logs found in this date range.</p>'
            : `
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Flow</th>
                <th>Symptoms</th>
                <th>Moods</th>
                <th>BBT (°C)</th>
                <th>Ovulation Test</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${filteredLogs
                .map(l => {
                  const flowBadge =
                    l.flow !== 'NONE'
                      ? `<span class="badge badge-${l.flow.toLowerCase()}">${l.flow}</span>`
                      : 'None';
                  
                  const symptomsTags = l.symptoms
                    ? l.symptoms.split(',').map(s => `<span class="symptom-tag">${s}</span>`).join('')
                    : 'None';
                    
                  const moodsTags = l.moods
                    ? l.moods.split(',').map(m => `<span class="symptom-tag">${m}</span>`).join('')
                    : 'None';

                  return `
                  <tr>
                    <td><strong>${l.date}</strong></td>
                    <td>${flowBadge}</td>
                    <td>${symptomsTags}</td>
                    <td>${moodsTags}</td>
                    <td>${l.bbt ? l.bbt.toFixed(2) + ' °C' : 'N/A'}</td>
                    <td>${l.ovulation_test !== 'NONE' ? l.ovulation_test : 'N/A'}</td>
                    <td>${l.notes || ''}</td>
                  </tr>
                `;
                })
                .join('')}
            </tbody>
          </table>
        `
        }
      </body>
    </html>
  `;

  // Print to PDF file
  const { uri } = await Print.printToFileAsync({ html: htmlContent });
  
  // Share via native share sheet
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `CycleSync Report - ${profile.name}`,
      UTI: 'com.adobe.pdf',
    });
  }
}

/**
 * Exports health history to a standard CSV file.
 */
export async function exportToCSV(
  profile: Profile,
  logs: DailyLog[],
  options: ExportOptions
): Promise<void> {
  const filteredLogs = logs
    .filter(log => log.date >= options.startDate && log.date <= options.endDate)
    .sort((a, b) => b.date.localeCompare(a.date));

  // Construct CSV String
  let csvContent = 'Date,Flow,Symptoms,Moods,Discharge,Sleep Quality,Sex Drive,BBT,Ovulation Test,Pill Taken,Notes\n';
  
  for (const log of filteredLogs) {
    const safeNotes = log.notes ? `"${log.notes.replace(/"/g, '""')}"` : '';
    const safeSymptoms = log.symptoms ? `"${log.symptoms}"` : '';
    const safeMoods = log.moods ? `"${log.moods}"` : '';
    
    csvContent += `${log.date},${log.flow},${safeSymptoms},${safeMoods},${log.discharge},${log.sleep_quality},${log.sex_drive},${log.bbt || ''},${log.ovulation_test},${log.pill_taken},${safeNotes}\n`;
  }

  // Write to temporary local file
  const fileUri = `${(FileSystem as any).cacheDirectory}CycleSync_${profile.name.replace(/\s+/g, '_')}_Report.csv`;
  await FileSystem.writeAsStringAsync(fileUri, csvContent, {
    encoding: 'utf8',
  });

  // Share via native share sheet
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: `CycleSync CSV Report - ${profile.name}`,
      UTI: 'public.comma-separated-values-text',
    });
  }
}
