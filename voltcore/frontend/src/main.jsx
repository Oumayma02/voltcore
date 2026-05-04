import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(<App />);

function removeSplineWatermark(root = document) {
  const candidates = [
    ...root.querySelectorAll?.('a[href*="spline"], [aria-label*="Spline"], [title*="Spline"], [class*="spline"], [id*="spline"]') || []
  ];
  candidates.forEach((node) => {
    const text = node.textContent || "";
    const label = node.getAttribute?.("aria-label") || "";
    const title = node.getAttribute?.("title") || "";
    const href = node.href || "";
    if (/spline/i.test(text) || /spline/i.test(href) || /spline/i.test(label) || /spline/i.test(title)) {
      node.remove();
    }
  });
  root.querySelectorAll?.("spline-viewer").forEach((viewer) => {
    if (viewer.shadowRoot) removeSplineWatermark(viewer.shadowRoot);
  });
}

window.addEventListener("load", () => {
  removeSplineWatermark();
  window.setInterval(removeSplineWatermark, 1200);
});

requestAnimationFrame(async () => {
  await import("./legacy/dashboard.js");
  await import("./legacy/settings.js");
  await import("./legacy/admin.js");
  await import("./legacy/app.js");
});
