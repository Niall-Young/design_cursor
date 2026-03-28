async function withActiveTab(callback) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    return;
  }
  await callback(tab.id);
}

function sendToggleMessage(tabId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, { type: "CHAT_CONTEXT_PICKER_TOGGLE" }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve();
    });
  });
}

async function ensurePickerInjected(tabId) {
  const [{ result: isLoaded }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => Boolean(window.__chatContextPickerLoaded)
  });

  if (isLoaded) {
    return;
  }

  await chrome.scripting.insertCSS({
    target: { tabId },
    files: ["content.css"]
  });

  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content.js"]
  });
}

async function togglePickerOnActiveTab(tabId) {
  try {
    await ensurePickerInjected(tabId);
    await sendToggleMessage(tabId);
  } catch (injectionError) {
    // Injection is expected to fail on internal browser pages where extensions cannot run.
    console.warn("Failed to inject Design Cursor into the active tab.", injectionError);
  }
}

chrome.action.onClicked.addListener(async () => {
  await withActiveTab(togglePickerOnActiveTab);
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-picker") {
    return;
  }
  await withActiveTab(togglePickerOnActiveTab);
});
