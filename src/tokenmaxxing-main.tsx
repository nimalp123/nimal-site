import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/syne/latin-600.css";
import "@fontsource/syne/latin-700.css";
import "@fontsource/syne/latin-800.css";
import "@fontsource-variable/manrope";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "./styles.css";
import TokenMaxxing from "./TokenMaxxing";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TokenMaxxing />
  </React.StrictMode>,
);
