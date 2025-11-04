import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Error boundary for app initialization
try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  const root = createRoot(rootElement);
  root.render(<App />);
} catch (error) {
  console.error("Failed to initialize app:", error);
  document.body.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; font-family: sans-serif;">
      <h1 style="color: red; margin-bottom: 20px;">Application Error</h1>
      <p style="color: #666;">${error instanceof Error ? error.message : 'Unknown error'}</p>
      <p style="color: #999; margin-top: 10px; font-size: 12px;">Check the console for details</p>
    </div>
  `;
}
