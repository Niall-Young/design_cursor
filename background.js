async function withActiveTab(callback) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    return;
  }
  callback(tab.id);
}

function sendToggleMessage(tabId) {
  chrome.tabs.sendMessage(tabId, { type: "CHAT_CONTEXT_PICKER_TOGGLE" }, () => {
    if (chrome.runtime.lastError) {
      // The content script is declared in the manifest, so this is expected only
      // on internal browser pages where extensions cannot run.
    }
  });
}

chrome.action.onClicked.addListener(async () => {
  await withActiveTab(sendToggleMessage);
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-picker") {
    return;
  }
  await withActiveTab(sendToggleMessage);
});
