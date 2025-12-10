import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import config from "../../public/config.json";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Check if running in Tauri desktop app
 * Reads from config.json which is set at build time via set-platform.mjs
 */
export function isDesktop(): boolean {
  return config.platform === "desktop";
}

/**
 * Check if running in web browser (not Tauri)
 */
export function isWeb(): boolean {
  return config.platform === "web";
}
