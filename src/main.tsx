import React from "react";
import ReactDOM from "react-dom/client";
import App, { resolveWindowKind } from "./App";
import "./styles/base.css";

const windowKind = resolveWindowKind();
document.documentElement.dataset.window = windowKind;

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App kind={windowKind} />
  </React.StrictMode>,
);
