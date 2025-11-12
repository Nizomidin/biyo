from __future__ import annotations

import json
from typing import Callable, Generic, Optional, TypeVar

from sheets_client import SheetsClient

T = TypeVar("T", bound=dict)


class TableRepository(Generic[T]):
    HEADERS = ["id", "clinicId", "data"]

    def __init__(self, sheets: SheetsClient, sheet_name: str) -> None:
        self.sheets = sheets
        self.sheet_name = sheet_name

    def _read_rows(self) -> list[tuple[int, T]]:
        rows = self.sheets.get_rows(self.sheet_name, self.HEADERS)
        if len(rows) <= 1:
            return []

        parsed: list[tuple[int, T]] = []
        for index, row in enumerate(rows[1:], start=2):
            if len(row) < 3:
                continue
            data_cell = row[2]
            if not data_cell:
                continue
            try:
                item = json.loads(data_cell)
            except json.JSONDecodeError:
                continue

            if not item.get("id"):
                item["id"] = row[0]
            if not item.get("clinicId") and len(row) > 1 and row[1]:
                item["clinicId"] = row[1]
            parsed.append((index, item))
        return parsed

    def list(self, filter_func: Optional[Callable[[T], bool]] = None) -> list[T]:
        items = [item for _, item in self._read_rows()]
        if filter_func:
            items = [item for item in items if filter_func(item)]
        return items

    def find(self, predicate: Callable[[T], bool]) -> Optional[T]:
        for _, item in self._read_rows():
            if predicate(item):
                return item
        return None

    def upsert(self, item: T) -> T:
        rows = self._read_rows()
        existing_row = next(((idx, row_item) for idx, row_item in rows if row_item.get("id") == item.get("id")), None)

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
        rows = self._read_rows()
        to_delete = [idx for idx, item in rows if predicate(item)]
        if to_delete:
            self.sheets.delete_rows(self.sheet_name, self.HEADERS, to_delete)
