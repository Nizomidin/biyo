import { config } from "dotenv";

config();

const required = (value: string | undefined, name: string): string => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const env = {
  port: Number.parseInt(process.env.BACKEND_PORT || process.env.PORT || "4000", 10),
  spreadsheetId: required(process.env.GOOGLE_SHEETS_ID, "GOOGLE_SHEETS_ID"),
  clientEmail: required(process.env.GOOGLE_CLIENT_EMAIL, "GOOGLE_CLIENT_EMAIL"),
  privateKey: required(process.env.GOOGLE_PRIVATE_KEY, "GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
};

