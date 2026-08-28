"use strict";

browser.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  try {
    await browser.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ["content-panel.css"]
    });
    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content-panel.js"]
    });
  } catch (error) {
    console.error("Could not toggle Job App Profile Kit:", error);
  }
});
