import json
from typing import Generic, TypeVar, Optional, Callable

from sheets_client import SheetsClient

T = TypeVar("T", bound=dict)


class TableRepository(Generic[T]):
    HEADERS = ["id", "clinicId", "data"]

    def __init__(self, sheets: SheetsClient, sheet_name: str):
        self.sheets = sheets
        self.sheet_name = sheet_name

    def _read_rows(self) -> list[tuple[int, T]]:
        """Read all rows and return as (row_index, item) tuples"""
        rows = self.sheets.get_rows(self.sheet_name, self.HEADERS)
        if len(rows) <= 1:
            return []

        records = rows[1:]
        parsed = []

        for index, row in enumerate(records):
            data_cell = row[2] if len(row) > 2 else None
            if not data_cell:
                continue

            try:
                item = json.loads(data_cell)
                if not item.get("id"):
                    item["id"] = row[0]
                if not item.get("clinicId") and len(row) > 1 and row[1]:
                    item["clinicId"] = row[1]
                parsed.append((index + 2, item))
            except json.JSONDecodeError as e:
                print(f"Failed to parse row {index + 2} in sheet {self.sheet_name}: {e}")

        return parsed

    def list(self, filter_func: Optional[Callable[[T], bool]] = None) -> list[T]:
        """List all items, optionally filtered"""
        rows = self._read_rows()
        items = [item for _, item in rows]
        if filter_func:
            items = [item for item in items if filter_func(item)]
        return items

    def find(self, predicate: Callable[[T], bool]) -> Optional[T]:
        """Find first item matching predicate"""
        rows = self._read_rows()
        for _, item in rows:
            if predicate(item):
                return item
        return None

    def upsert(self, item: T) -> T:
        """Insert or update an item"""
        rows = self._read_rows()
        existing_row = next(
            ((idx, it) for idx, it in rows if it.get("id") == item.get("id")), None
        )

        serialized = json.dumps(item, ensure_ascii=False)
        clinic_id = item.get("clinicId", "")
        row_data = [item.get("id", ""), clinic_id, serialized]

        if existing_row:
            row_index, _ = existing_row
            self.sheets.update_row(self.sheet_name, self.HEADERS, row_index, row_data)
        else:
            self.sheets.append_row(self.sheet_name, self.HEADERS, row_data)

        return item

    def delete_where(self, predicate: Callable[[T], bool]) -> None:
        """Delete items matching predicate"""
        rows = self._read_rows()
        matching_rows = [(idx, item) for idx, item in rows if predicate(item)]
        if not matching_rows:
            return

        row_indices = [idx for idx, _ in matching_rows]
        self.sheets.delete_rows(self.sheet_name, self.HEADERS, row_indices)

