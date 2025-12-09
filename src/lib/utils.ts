import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Check if running in Tauri desktop app
 * Tauri automatically injects __TAURI__ into the window object
 */
export function isDesktop(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}

/**
 * Check if running in web browser (not Tauri)
 */
export function isWeb(): boolean {
  return !isDesktop();
}
