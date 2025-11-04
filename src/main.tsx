import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Set a visible background immediately to debug blue screen
document.body.style.backgroundColor = "#0f172a";
document.body.style.margin = "0";
document.body.style.padding = "0";

// Error boundary for app initialization
try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  
  // Show loading immediately
  rootElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100vh; color: white; font-family: sans-serif;"><p>Loading application...</p></div>';
  
  const root = createRoot(rootElement);
  root.render(<App />);
} catch (error) {
  console.error("Failed to initialize app:", error);
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; font-family: sans-serif; background: #0f172a; color: white;">
        <h1 style="color: red; margin-bottom: 20px;">Application Error</h1>
        <p style="color: #ccc;">${error instanceof Error ? error.message : 'Unknown error'}</p>
        <p style="color: #999; margin-top: 10px; font-size: 12px;">Check the browser console (F12) for details</p>
        <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">Reload Page</button>
      </div>
    `;
  }
}
