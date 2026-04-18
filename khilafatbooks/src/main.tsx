import { createRoot } from "react-dom/client";
import { HelmetProvider } from 'react-helmet-async';
import App from "./App.tsx";
import "./index.css";

// Check if we are in SSG mode
const container = document.getElementById("root")!;

if (container.hasChildNodes()) {
  // If we have children, it's pre-rendered
  createRoot(container).render(
    <HelmetProvider>
      <App />
    </HelmetProvider>
  );
} else {
  createRoot(container).render(
    <HelmetProvider>
      <App />
    </HelmetProvider>
  );
}
