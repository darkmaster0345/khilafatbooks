import { createRoot } from "react-dom/client";
import { HelmetProvider } from 'react-helmet-async';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import App from "./App.tsx";
import "./index.css";

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";

const container = document.getElementById("root")!;

const Main = () => (
  <HelmetProvider>
    <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
      <App />
    </GoogleReCaptchaProvider>
  </HelmetProvider>
);

if (container.hasChildNodes()) {
  createRoot(container).render(<Main />);
} else {
  createRoot(container).render(<Main />);
}
