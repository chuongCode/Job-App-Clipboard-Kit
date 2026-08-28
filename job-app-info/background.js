"use strict";

const WINDOW_ID_KEY = "profileWindowId";

async function toggleProfileWindow() {
  const saved = await browser.storage.local.get(WINDOW_ID_KEY);
  const existingWindowId = saved[WINDOW_ID_KEY];

  if (Number.isInteger(existingWindowId)) {
    try {
      await browser.windows.remove(existingWindowId);
      await browser.storage.local.remove(WINDOW_ID_KEY);
      return;
    } catch (error) {
      await browser.storage.local.remove(WINDOW_ID_KEY);
    }
  }

  const profileWindow = await browser.windows.create({
    url: browser.runtime.getURL("popup.html"),
    type: "popup",
    width: 380,
    height: 630,
    focused: true,
    allowScriptsToClose: true
  });

  await browser.storage.local.set({ [WINDOW_ID_KEY]: profileWindow.id });
}

browser.action.onClicked.addListener(() => {
  toggleProfileWindow().catch((error) => {
    console.error("Could not toggle profile window:", error);
  });
});

browser.windows.onRemoved.addListener(async (windowId) => {
  const saved = await browser.storage.local.get(WINDOW_ID_KEY);
  if (saved[WINDOW_ID_KEY] === windowId) {
    await browser.storage.local.remove(WINDOW_ID_KEY);
  }
});
