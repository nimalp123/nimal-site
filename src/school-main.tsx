import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/syne/latin-600.css";
import "@fontsource/syne/latin-700.css";
import "@fontsource/syne/latin-800.css";
import "@fontsource-variable/manrope";
import "@fontsource/ibm-plex-mono/latin-400.css";
import School from "./School";
import "./school.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <School />
  </React.StrictMode>,
);
