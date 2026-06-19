const CHAT_CONTEXT_PICKER_VERSION = "2.0.2-no-hover-mirror";

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

async function patchLoadedPicker(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    args: [CHAT_CONTEXT_PICKER_VERSION],
    func: (version) => {
      window.__chatContextPickerVersion = version;

      const styleId = "chat-context-picker-runtime-patch-style";
      if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
          [data-chat-context-picker-ui="true"][style*="z-index: 2147483645"],
          [data-chat-context-picker-ui="true"][style*="z-index:2147483645"] {
            display: none !important;
          }
        `;
        document.documentElement.appendChild(style);
      }

      const cleanupMirrors = () => {
        try {
          if (typeof endHoverLock === "function") {
            endHoverLock();
          }
        } catch (error) {
          // Ignore stale runtime cleanup failures.
        }

        try {
          if (typeof clearHoverLockSnapshot === "function") {
            clearHoverLockSnapshot();
          }
        } catch (error) {
          // Ignore stale runtime cleanup failures.
        }

        document.querySelectorAll('[data-chat-context-picker-ui="true"]').forEach((element) => {
          if (element instanceof HTMLElement && element.style.zIndex === "2147483645") {
            element.remove();
          }
        });

        try {
          if (typeof state === "object" && state) {
            [state.adjustTarget, state.hoveredTarget, state.hoveredSelectedTarget, ...(state.selectedTargets || [])].forEach((target) => {
              if (target) {
                target.adjustPreserveMirror = null;
              }
            });
          }
        } catch (error) {
          // Ignore stale runtime cleanup failures.
        }
      };

      cleanupMirrors();

      try {
        createHoverLockMirror = () => null;
      } catch (error) {
        // Ignore if the old runtime has not declared this function.
      }
      try {
        createHoverLockMirrorEntry = () => null;
      } catch (error) {
        // Ignore if the old runtime has not declared this function.
      }
      try {
        getHoverLockFloatingMirrorCandidates = () => [];
      } catch (error) {
        // Ignore if the old runtime has not declared this function.
      }
      try {
        prepareHoverLockSnapshot = () => {
          cleanupMirrors();
        };
      } catch (error) {
        // Ignore if the old runtime has not declared this function.
      }

      return {
        loaded: Boolean(window.__chatContextPickerLoaded),
        version: window.__chatContextPickerVersion,
        mirrorCount: [...document.querySelectorAll('[data-chat-context-picker-ui="true"]')].filter(
          (element) => element instanceof HTMLElement && element.style.zIndex === "2147483645"
        ).length
      };
    }
  });
}

async function ensurePickerInjected(tabId) {
  const [{ result: status }] = await chrome.scripting.executeScript({
    target: { tabId },
    args: [CHAT_CONTEXT_PICKER_VERSION],
    func: (version) => ({
      loaded: Boolean(window.__chatContextPickerLoaded),
      version: window.__chatContextPickerVersion || null,
      expectedVersion: version
    })
  });

  if (status?.loaded) {
    await patchLoadedPicker(tabId);
    return;
  }

  await chrome.scripting.insertCSS({
    target: { tabId },
    files: ["content.css"]
  });

  // Inject the picker runtime in dependency order without changing behavior.
  await chrome.scripting.executeScript({
    target: { tabId },
    files: [
      "content/00-bootstrap.js",
      "content/10-ui.js",
      "content/20-core.js",
      "content/30-selection-layout.js",
      "content/40-adjust.js",
      "content/50-runtime.js"
    ]
  });

  await patchLoadedPicker(tabId);
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
