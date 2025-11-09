import { SheetsClient } from "./sheetsClient";

interface SheetRow<T> {
  rowIndex: number;
  item: T;
}

const HEADERS = ["id", "clinicId", "data"];

export class TableRepository<T extends { id: string }> {
  constructor(
    private readonly sheets: SheetsClient,
    private readonly sheetName: string,
  ) {}

  private async readRows(): Promise<SheetRow<T>[]> {
    const rows = await this.sheets.getRows(this.sheetName, HEADERS);
    if (rows.length <= 1) {
      return [];
    }

    const [, ...records] = rows;
    const parsed: SheetRow<T>[] = [];

    records.forEach((row, index) => {
      const dataCell = row[2];
      if (!dataCell) {
        return;
      }

      try {
        const item = JSON.parse(dataCell) as T & { clinicId?: string };
        if (!item.id) {
          item.id = row[0];
        }
        if (!item.clinicId && row[1]) {
          item.clinicId = row[1];
        }
        parsed.push({
          rowIndex: index + 2,
          item: item as T,
        });
      } catch (error) {
        console.warn(`Failed to parse row ${index + 2} in sheet ${this.sheetName}:`, error);
      }
    });

    return parsed;
  }

  async list(filter?: (item: T) => boolean): Promise<T[]> {
    const rows = await this.readRows();
    const items = rows.map((row) => row.item);
    if (!filter) {
      return items;
    }
    return items.filter(filter);
  }

  async find(predicate: (item: T) => boolean): Promise<T | null> {
    const rows = await this.readRows();
    const match = rows.find((row) => predicate(row.item));
    return match ? match.item : null;
  }

  async upsert(item: T): Promise<T> {
    const rows = await this.readRows();
    const existing = rows.find((row) => row.item.id === item.id);
    const serialized = JSON.stringify(item);
    const clinicId = (item as unknown as { clinicId?: string }).clinicId ?? "";
    const rowData = [item.id, clinicId, serialized];

    if (existing) {
      await this.sheets.updateRow(this.sheetName, HEADERS, existing.rowIndex, rowData);
    } else {
      await this.sheets.appendRow(this.sheetName, HEADERS, rowData);
    }

    return item;
  }

  async deleteWhere(predicate: (item: T) => boolean): Promise<void> {
    const rows = await this.readRows();
    const matchingRows = rows.filter((row) => predicate(row.item));
    if (matchingRows.length === 0) {
      return;
    }
    const rowIndices = matchingRows.map((row) => row.rowIndex);
    await this.sheets.deleteRows(this.sheetName, HEADERS, rowIndices);
  }
}

