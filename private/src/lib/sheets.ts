import { google } from "googleapis";

function getAuth() {
  const credentials = JSON.parse(
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "{}"
  );
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || "";
const SHEET_NAME = "2026 planning";

export interface DayRow {
  rowIndex: number;
  date: string;
  weekday: string;
  event: string;
  gamePlan: string;
  fundingDeadline: string;
  fundingEligibility: string;
}

export async function readAllRows(): Promise<DayRow[]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SHEET_NAME}'!A1:G600`,
  });

  const rows = response.data.values || [];

  // Skip header row (row 0)
  return rows.slice(1).map((row, index) => ({
    rowIndex: index + 2, // 1-indexed, skip header
    date: row[0] || "",
    weekday: row[1] || "",
    event: row[2] || "",
    gamePlan: row[3] || "",
    fundingDeadline: row[4] || "",
    fundingEligibility: row[5] || "",
  }));
}

export async function readRowsForMonth(month: string): Promise<DayRow[]> {
  const allRows = await readAllRows();
  return allRows.filter((row) =>
    row.date.toLowerCase().includes(month.toLowerCase())
  );
}

export async function updateCell(
  rowIndex: number,
  column: string,
  value: string
): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SHEET_NAME}'!${column}${rowIndex}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[value]],
    },
  });
}

export async function updateRow(
  rowIndex: number,
  data: Partial<{
    event: string;
    gamePlan: string;
    fundingDeadline: string;
    fundingEligibility: string;
  }>
): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  // Read current row first to preserve existing data
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SHEET_NAME}'!A${rowIndex}:G${rowIndex}`,
  });

  const currentRow = response.data.values?.[0] || [];

  const updatedRow = [
    currentRow[0] || "", // date - don't change
    currentRow[1] || "", // weekday - don't change
    data.event !== undefined ? data.event : currentRow[2] || "",
    data.gamePlan !== undefined ? data.gamePlan : currentRow[3] || "",
    data.fundingDeadline !== undefined
      ? data.fundingDeadline
      : currentRow[4] || "",
    data.fundingEligibility !== undefined
      ? data.fundingEligibility
      : currentRow[5] || "",
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SHEET_NAME}'!A${rowIndex}:F${rowIndex}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [updatedRow],
    },
  });
}
