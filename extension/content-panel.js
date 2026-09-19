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

  const applyDarkMode = (enabled) => panel.classList.toggle("dark-mode", enabled);
  browser.storage.local.get("settings").then((saved) => {
    applyDarkMode(saved.settings?.darkMode === true);
  });
  const handleSettingsChange = (changes, areaName) => {
    if (!panel.isConnected) {
      browser.storage.onChanged.removeListener(handleSettingsChange);
      return;
    }
    if (areaName === "local" && changes.settings) {
      applyDarkMode(changes.settings.newValue?.darkMode === true);
    }
  };
  browser.storage.onChanged.addListener(handleSettingsChange);

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
  closeButton.addEventListener("click", () => {
    window.removeEventListener("resize", keepPanelInViewport);
    panel.remove();
  });

  const dragRegion = document.createElement("div");
  dragRegion.className = "job-app-clipboard-kit-drag-region";
  dragRegion.setAttribute("aria-hidden", "true");

  const clampPanelPosition = (left, top) => ({
    left: Math.min(Math.max(0, left), Math.max(0, window.innerWidth - panel.offsetWidth)),
    top: Math.min(Math.max(0, top), Math.max(0, window.innerHeight - panel.offsetHeight))
  });

  const setPanelPosition = (left, top) => {
    const position = clampPanelPosition(left, top);
    panel.style.right = "auto";
    panel.style.left = `${position.left}px`;
    panel.style.top = `${position.top}px`;
  };

  dragRegion.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;

    const bounds = panel.getBoundingClientRect();
    const pointerOffsetX = event.clientX - bounds.left;
    const pointerOffsetY = event.clientY - bounds.top;

    setPanelPosition(bounds.left, bounds.top);
    dragRegion.setPointerCapture(event.pointerId);
    panel.classList.add("is-dragging");
    event.preventDefault();

    const handlePointerMove = (moveEvent) => {
      setPanelPosition(
        moveEvent.clientX - pointerOffsetX,
        moveEvent.clientY - pointerOffsetY
      );
    };

    const finishDragging = () => {
      panel.classList.remove("is-dragging");
      dragRegion.removeEventListener("pointermove", handlePointerMove);
      dragRegion.removeEventListener("pointerup", finishDragging);
      dragRegion.removeEventListener("pointercancel", finishDragging);
    };

    dragRegion.addEventListener("pointermove", handlePointerMove);
    dragRegion.addEventListener("pointerup", finishDragging);
    dragRegion.addEventListener("pointercancel", finishDragging);
  });

  const keepPanelInViewport = () => {
    if (!panel.style.left) return;
    const bounds = panel.getBoundingClientRect();
    setPanelPosition(bounds.left, bounds.top);
  };
  window.addEventListener("resize", keepPanelInViewport);

  panel.append(frame, dragRegion, closeButton);
  document.documentElement.append(panel);
})();
