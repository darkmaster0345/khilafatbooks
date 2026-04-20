import { createRoot } from "react-dom/client";
import { HelmetProvider } from 'react-helmet-async';
import App from "./App.tsx";
import "./index.css";

const container = document.getElementById("root")!;

const Main = () => (
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

if (container.hasChildNodes()) {
  createRoot(container).render(<Main />);
} else {
  createRoot(container).render(<Main />);
}
