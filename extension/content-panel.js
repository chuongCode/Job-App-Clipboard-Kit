"use strict";

(() => {
  const panelId = "job-app-clipboard-kit-panel";
  const cleanupEventName = "job-app-clipboard-kit-cleanup";
  const existingPanel = document.getElementById(panelId);

  if (existingPanel) {
    window.dispatchEvent(new Event(cleanupEventName));
    document.getElementById("job-app-clipboard-kit-resume-overlay")?.remove();
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

  let resumeOverlay = null;

  const closeResumePreview = () => {
    if (!resumeOverlay) return;
    document.removeEventListener("keydown", handleResumePreviewKeydown, true);
    resumeOverlay.classList.remove("is-open");
  };

  const destroyResumePreview = () => {
    if (!resumeOverlay) return;
    closeResumePreview();
    resumeOverlay.remove();
    resumeOverlay = null;
  };

  const handleResumePreviewKeydown = (event) => {
    if (event.key === "Escape") closeResumePreview();
  };

  const prepareResumePreview = () => {
    if (resumeOverlay) return;
    resumeOverlay = document.createElement("div");
    resumeOverlay.id = "job-app-clipboard-kit-resume-overlay";
    resumeOverlay.setAttribute("role", "presentation");

    const resumeModal = document.createElement("div");
    resumeModal.className = "job-app-clipboard-kit-resume-modal";

    const previewFrame = document.createElement("iframe");
    previewFrame.className = "job-app-clipboard-kit-resume-frame";
    previewFrame.src = `${browser.runtime.getURL("popup.html")}?view=resume`;
    previewFrame.title = "Resume preview";

    const previewClose = document.createElement("button");
    previewClose.className = "job-app-clipboard-kit-resume-close";
    previewClose.type = "button";
    previewClose.textContent = "×";
    previewClose.title = "Close resume preview";
    previewClose.setAttribute("aria-label", "Close resume preview");
    previewClose.addEventListener("click", closeResumePreview);

    resumeOverlay.addEventListener("click", (event) => {
      if (event.target === resumeOverlay) closeResumePreview();
    });
    resumeModal.append(previewFrame, previewClose);
    resumeOverlay.append(resumeModal);
    document.documentElement.append(resumeOverlay);
  };

  const openResumePreview = () => {
    prepareResumePreview();
    resumeOverlay.classList.add("is-open");
    document.addEventListener("keydown", handleResumePreviewKeydown, true);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      resumeOverlay?.querySelector("iframe")?.contentWindow?.postMessage({
        source: "job-app-clipboard-kit",
        action: "reset-resume-preview"
      }, "*");
    }));
  };

  const handleWindowMessage = (event) => {
    if (event.source === frame.contentWindow
      && event.data?.source === "job-app-clipboard-kit"
      && event.data.action === "open-resume-preview") {
      openResumePreview();
    }

    if (resumeOverlay
      && event.source === resumeOverlay.querySelector("iframe")?.contentWindow
      && event.data?.source === "job-app-clipboard-kit"
      && event.data.action === "resume-preview-layout") {
      resumeOverlay.querySelector(".job-app-clipboard-kit-resume-modal")
        ?.classList.toggle("has-multiple-pages", event.data.multiplePages === true);
    }

    if (resumeOverlay
      && event.source === resumeOverlay.querySelector("iframe")?.contentWindow
      && event.data?.source === "job-app-clipboard-kit"
      && event.data.action === "resume-preview-ready") {
      resumeOverlay.classList.add("is-ready");
      if (resumeOverlay.classList.contains("is-open")) {
        resumeOverlay.querySelector(".job-app-clipboard-kit-resume-close")?.focus({ preventScroll: true });
      }
    }

    if (event.source === frame.contentWindow
      && event.data?.source === "job-app-clipboard-kit"
      && event.data.action === "resume-updated") {
      destroyResumePreview();
      prepareResumePreview();
    }

  };
  window.addEventListener("message", handleWindowMessage);

  const closeButton = document.createElement("button");
  closeButton.className = "job-app-clipboard-kit-close";
  closeButton.type = "button";
  closeButton.textContent = "×";
  closeButton.title = "Close";
  closeButton.setAttribute("aria-label", "Close Job App Clipboard Kit");
  closeButton.addEventListener("click", () => {
    cleanupPanel();
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

  const cleanupPanel = () => {
    window.removeEventListener("message", handleWindowMessage);
    window.removeEventListener("resize", keepPanelInViewport);
    window.removeEventListener(cleanupEventName, cleanupPanel);
    browser.storage.onChanged.removeListener(handleSettingsChange);
    destroyResumePreview();
    panel.remove();
  };
  window.addEventListener(cleanupEventName, cleanupPanel, { once: true });

  panel.append(frame, dragRegion, closeButton);
  document.documentElement.append(panel);
  prepareResumePreview();
})();
