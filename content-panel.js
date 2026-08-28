"use strict";

(() => {
  const panelId = "job-app-clipboard-kit-panel";
  const existingPanel = document.getElementById(panelId);

  if (existingPanel) {
    existingPanel.remove();
    return;
  }

  const panel = document.createElement("aside");
  panel.id = panelId;
  panel.setAttribute("aria-label", "Job App Clipboard Kit");

  const frame = document.createElement("iframe");
  frame.src = browser.runtime.getURL("popup.html");
  frame.title = "Job App Clipboard Kit";
  frame.allow = "clipboard-write";

  const closeButton = document.createElement("button");
  closeButton.className = "job-app-clipboard-kit-close";
  closeButton.type = "button";
  closeButton.textContent = "×";
  closeButton.title = "Close";
  closeButton.setAttribute("aria-label", "Close Job App Clipboard Kit");
  closeButton.addEventListener("click", () => panel.remove());

  panel.append(frame, closeButton);
  document.documentElement.append(panel);
})();
