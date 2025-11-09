import { google, sheets_v4 } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

const columnToLetter = (column: number): string => {
  let temp = column;
  let letter = "";
  while (temp > 0) {
    const modulo = (temp - 1) % 26;
    letter = String.fromCharCode(65 + modulo) + letter;
    temp = Math.floor((temp - modulo) / 26);
  }
  return letter;
};

export class SheetsClient {
  private auth: sheets_v4.Options["auth"];

  private sheets: sheets_v4.Sheets;

  private ensuredSheets = new Set<string>();

  private sheetIds = new Map<string, number>();

  constructor(
    private readonly spreadsheetId: string,
    clientEmail: string,
    privateKey: string,
  ) {
    this.auth = new google.auth.JWT(clientEmail, undefined, privateKey, SCOPES);
    this.sheets = google.sheets({ version: "v4", auth: this.auth });
  }

  private async ensureSheetExists(sheetName: string, headers: string[]): Promise<void> {
    if (this.ensuredSheets.has(sheetName)) {
      return;
    }

    const spreadsheet = await this.sheets.spreadsheets.get({
      spreadsheetId: this.spreadsheetId,
      includeGridData: false,
    });

    const targetSheet = spreadsheet.data.sheets?.find(
      (sheet) => sheet.properties?.title === sheetName,
    );

    let sheetId = targetSheet?.properties?.sheetId ?? null;

    if (!sheetId) {
      const response = await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                },
              },
            },
          ],
        },
      });
      sheetId = response.data.replies?.[0]?.addSheet?.properties?.sheetId ?? null;
    }

    if (sheetId != null) {
      this.sheetIds.set(sheetName, sheetId);
    }

    const headerRange = `${sheetName}!1:1`;
    const headerValues = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: headerRange,
    });

    const existingHeaders = headerValues.data.values?.[0] ?? [];
    const headersDiffer =
      headers.length !== existingHeaders.length ||
      headers.some((header, index) => existingHeaders[index] !== header);

    if (headersDiffer) {
      const lastColumn = columnToLetter(headers.length);
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A1:${lastColumn}1`,
        valueInputOption: "RAW",
        requestBody: {
          values: [headers],
        },
      });
    }

    this.ensuredSheets.add(sheetName);
  }

  async getRows(sheetName: string, headers: string[]): Promise<string[][]> {
    await this.ensureSheetExists(sheetName, headers);
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A:C`,
      majorDimension: "ROWS",
    });
    return response.data.values ?? [];
  }

  async appendRow(sheetName: string, headers: string[], row: string[]): Promise<void> {
    await this.ensureSheetExists(sheetName, headers);
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A:C`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [row],
      },
    });
  }

  async updateRow(
    sheetName: string,
    headers: string[],
    rowIndex: number,
    row: string[],
  ): Promise<void> {
    await this.ensureSheetExists(sheetName, headers);
    const lastColumn = columnToLetter(row.length);
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A${rowIndex}:${lastColumn}${rowIndex}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [row],
      },
    });
  }

  async deleteRows(sheetName: string, headers: string[], rowIndices: number[]): Promise<void> {
    await this.ensureSheetExists(sheetName, headers);
    if (rowIndices.length === 0) {
      return;
    }

    const sorted = [...rowIndices].sort((a, b) => b - a);
    const sheetId = this.sheetIds.get(sheetName);
    if (sheetId == null) {
      throw new Error(`Unable to determine sheetId for sheet ${sheetName}`);
    }

    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: {
        requests: sorted.map((rowIndex) => ({
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowIndex - 1,
              endIndex: rowIndex,
            },
          },
        })),
      },
    });
  }
}

