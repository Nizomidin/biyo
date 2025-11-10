import json
from typing import Any
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


def column_to_letter(column: int) -> str:
    """Convert column number to letter (1 -> A, 27 -> AA, etc.)"""
    temp = column
    letter = ""
    while temp > 0:
        modulo = (temp - 1) % 26
        letter = chr(65 + modulo) + letter
        temp = (temp - modulo) // 26
    return letter


class SheetsClient:
    def __init__(self, spreadsheet_id: str, client_email: str, private_key: str):
        self.spreadsheet_id = spreadsheet_id
        self.ensured_sheets = set()
        self.sheet_ids = {}
        
        credentials = service_account.Credentials.from_service_account_info(
            {
                "type": "service_account",
                "client_email": client_email,
                "private_key": private_key.replace("\\n", "\n"),
                "token_uri": "https://oauth2.googleapis.com/token",
            },
            scopes=["https://www.googleapis.com/auth/spreadsheets"],
        )
        
        self.service = build("sheets", "v4", credentials=credentials)
        self.sheets = self.service.spreadsheets()

    def _ensure_sheet_exists(self, sheet_name: str, headers: list[str]) -> None:
        """Ensure sheet exists and has correct headers"""
        if sheet_name in self.ensured_sheets:
            return

        try:
            spreadsheet = self.sheets.get(spreadsheetId=self.spreadsheet_id).execute()
            sheets = spreadsheet.get("sheets", [])
            target_sheet = next(
                (s for s in sheets if s["properties"]["title"] == sheet_name), None
            )

            sheet_id = target_sheet["properties"]["sheetId"] if target_sheet else None

            if sheet_id is None:
                batch_update = self.sheets.batchUpdate(
                    spreadsheetId=self.spreadsheet_id,
                    body={
                        "requests": [
                            {
                                "addSheet": {
                                    "properties": {
                                        "title": sheet_name,
                                    }
                                }
                            }
                        ]
                    },
                ).execute()
                sheet_id = batch_update["replies"][0]["addSheet"]["properties"]["sheetId"]

            self.sheet_ids[sheet_name] = sheet_id

            header_range = f"{sheet_name}!1:1"
            header_values = (
                self.sheets.values()
                .get(spreadsheetId=self.spreadsheet_id, range=header_range)
                .execute()
            )

            existing_headers = header_values.get("values", [[]])[0]
            headers_differ = (
                len(headers) != len(existing_headers)
                or any(headers[i] != existing_headers[i] for i in range(len(headers)))
            )

            if headers_differ:
                last_column = column_to_letter(len(headers))
                self.sheets.values().update(
                    spreadsheetId=self.spreadsheet_id,
                    range=f"{sheet_name}!A1:{last_column}1",
                    valueInputOption="RAW",
                    body={"values": [headers]},
                ).execute()

            self.ensured_sheets.add(sheet_name)

        except HttpError as error:
            raise Exception(f"Error ensuring sheet exists: {error}")

    def get_rows(self, sheet_name: str, headers: list[str]) -> list[list[str]]:
        """Get all rows from a sheet"""
        self._ensure_sheet_exists(sheet_name, headers)
        try:
            # Get all rows (no specific range limit for large datasets)
            response = (
                self.sheets.values()
                .get(
                    spreadsheetId=self.spreadsheet_id,
                    range=f"{sheet_name}!A:Z",
                    majorDimension="ROWS",
                )
                .execute()
            )
            return response.get("values", [])
        except HttpError as error:
            raise Exception(f"Error getting rows: {error}")

    def append_row(self, sheet_name: str, headers: list[str], row: list[str]) -> None:
        """Append a row to a sheet"""
        self._ensure_sheet_exists(sheet_name, headers)
        try:
            # Append to the full range to handle dynamic column count
            last_column = column_to_letter(len(headers))
            self.sheets.values().append(
                spreadsheetId=self.spreadsheet_id,
                range=f"{sheet_name}!A:{last_column}",
                valueInputOption="RAW",
                insertDataOption="INSERT_ROWS",
                body={"values": [row]},
            ).execute()
        except HttpError as error:
            raise Exception(f"Error appending row: {error}")

    def update_row(
        self, sheet_name: str, headers: list[str], row_index: int, row: list[str]
    ) -> None:
        """Update a row in a sheet"""
        self._ensure_sheet_exists(sheet_name, headers)
        try:
            last_column = column_to_letter(len(row))
            self.sheets.values().update(
                spreadsheetId=self.spreadsheet_id,
                range=f"{sheet_name}!A{row_index}:{last_column}{row_index}",
                valueInputOption="RAW",
                body={"values": [row]},
            ).execute()
        except HttpError as error:
            raise Exception(f"Error updating row: {error}")

    def delete_rows(self, sheet_name: str, headers: list[str], row_indices: list[int]) -> None:
        """Delete rows from a sheet"""
        self._ensure_sheet_exists(sheet_name, headers)
        if not row_indices:
            return

        try:
            sheet_id = self.sheet_ids.get(sheet_name)
            if sheet_id is None:
                raise Exception(f"Unable to determine sheetId for sheet {sheet_name}")

            sorted_indices = sorted(row_indices, reverse=True)
            requests = [
                {
                    "deleteDimension": {
                        "range": {
                            "sheetId": sheet_id,
                            "dimension": "ROWS",
                            "startIndex": idx - 1,
                            "endIndex": idx,
                        }
                    }
                }
                for idx in sorted_indices
            ]

            self.sheets.batchUpdate(
                spreadsheetId=self.spreadsheet_id, body={"requests": requests}
            ).execute()
        except HttpError as error:
            raise Exception(f"Error deleting rows: {error}")

