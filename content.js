(function initChatContextPicker() {
  if (window.__chatContextPickerLoaded) {
    return;
  }
  window.__chatContextPickerLoaded = true;

  const state = {
    active: false,
    listOpen: false,
    highlightsVisible: false,
    hoveredTarget: null,
    hoveredSelectedTarget: null,
    selectedTargets: [],
    selectionMode: "select",
    toolbar: null,
    list: null,
    countLabel: null,
    countBadge: null,
    listTrigger: null,
    copyButton: null,
    clearButton: null,
    modeButtons: [],
    overlayLayer: null,
    promptPopover: null,
    promptTextarea: null,
    promptChips: null,
    promptTarget: null,
    promptDraftValue: "",
    promptSavedSelectionMode: null,
    dragSession: null,
    suppressClickUntil: 0,
    toastTimer: null
  };

  const ICONS = {
    browse: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M4 4L11.5 20L14 13.5L20 11L4 4Z" />
      </svg>
    `,
    select: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M12 8V16" />
        <path d="M8 12H16" />
      </svg>
    `,
    layout: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <path d="M9 4V20" />
        <path d="M9 10H21" />
      </svg>
    `,
    list: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M10 6H21" />
        <path d="M10 12H21" />
        <path d="M10 18H21" />
        <path d="M3.5 6L5 7.5L7.5 5" />
        <path d="M3.5 12L5 13.5L7.5 11" />
        <path d="M3.5 18L5 19.5L7.5 17" />
      </svg>
    `,
    close: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M18 6L6 18" />
        <path d="M6 6L18 18" />
      </svg>
    `,
    copy: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="9" y="9" width="11" height="11" rx="2" />
        <path d="M5 15H4A2 2 0 0 1 2 13V4A2 2 0 0 1 4 2H13A2 2 0 0 1 15 4V5" />
      </svg>
    `,
    trash: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 6H21" />
        <path d="M8 6V4A2 2 0 0 1 10 2H14A2 2 0 0 1 16 4V6" />
        <path d="M19 6L18 19A2 2 0 0 1 16 21H8A2 2 0 0 1 6 19L5 6" />
        <path d="M10 11V17" />
        <path d="M14 11V17" />
      </svg>
    `,
    clear: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 6H21" />
        <path d="M8 6V4A2 2 0 0 1 10 2H14A2 2 0 0 1 16 4V6" />
        <path d="M19 6L18 19A2 2 0 0 1 16 21H8A2 2 0 0 1 6 19L5 6" />
        <path d="M10 11V17" />
        <path d="M14 11V17" />
      </svg>
    `,
    empty: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <path d="M7 8H17" />
        <path d="M7 12H13" />
        <path d="M7 16H11" />
      </svg>
    `,
    inbox: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M22 12H16L14 15H10L8 12H2" />
        <path d="M5.45 5.11L2 12V19A2 2 0 0 0 4 21H20A2 2 0 0 0 22 19V12L18.55 5.11A2 2 0 0 0 16.76 4H7.24A2 2 0 0 0 5.45 5.11Z" />
      </svg>
    `,
    plus: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 5V19" />
        <path d="M5 12H19" />
      </svg>
    `
  };

  const MODE_LABELS = {
    browse: "浏览模式",
    select: "选择模式",
    layout: "布局调整模式"
  };

  function icon(name) {
    return ICONS[name] || "";
  }

  function ensureToolbar() {
    if (state.toolbar) {
      return;
    }

    const toolbar = document.createElement("div");
    toolbar.id = "chat-context-picker-toolbar";
    toolbar.dataset.hidden = "true";
    toolbar.dataset.listOpen = "false";
    toolbar.innerHTML = `
      <div class="chat-context-picker-popover">
        <div class="chat-context-picker-popover-header">
          <div>
            <div class="chat-context-picker-popover-title">调整清单</div>
          </div>
          <div class="chat-context-picker-popover-count" id="chat-context-picker-count">已选 0 个</div>
        </div>
        <div class="chat-context-picker-list-shell">
          <div class="chat-context-picker-list" id="chat-context-picker-list"></div>
        </div>
        <div class="chat-context-picker-popover-actions">
          <button class="chat-context-picker-action-button chat-context-picker-action-button-secondary" type="button" data-action="clear">
            <span>清空选择</span>
          </button>
          <button class="chat-context-picker-action-button chat-context-picker-action-button-primary" type="button" data-action="copy">
            <span>复制全部</span>
          </button>
        </div>
      </div>
      <div class="chat-context-picker-toolbar-shell" role="toolbar" aria-label="Design cursor toolbar">
        <button class="chat-context-picker-tool-button" type="button" data-action="set-mode" data-mode="browse" aria-label="浏览模式" title="浏览模式">
          <span class="chat-context-picker-tool-icon">${icon("browse")}</span>
        </button>
        <button class="chat-context-picker-tool-button" type="button" data-action="set-mode" data-mode="select" aria-label="选择模式" title="选择模式">
          <span class="chat-context-picker-tool-icon">${icon("select")}</span>
        </button>
        <button class="chat-context-picker-tool-button" type="button" data-action="set-mode" data-mode="layout" aria-label="布局选择" title="布局选择">
          <span class="chat-context-picker-tool-icon">${icon("layout")}</span>
        </button>
        <button class="chat-context-picker-tool-button chat-context-picker-tool-button-list" type="button" data-action="toggle-list" aria-label="查看选择列表" title="查看选择列表">
          <span class="chat-context-picker-tool-icon">${icon("list")}</span>
          <span class="chat-context-picker-count-badge" id="chat-context-picker-count-badge">0</span>
        </button>
        <div class="chat-context-picker-toolbar-separator" aria-hidden="true"></div>
        <button class="chat-context-picker-tool-button" type="button" data-action="close" aria-label="关闭" title="关闭">
          <span class="chat-context-picker-tool-icon">${icon("close")}</span>
        </button>
      </div>
    `;

    toolbar.addEventListener("click", async (event) => {
      event.stopPropagation();

      const actionTarget = event.target?.closest?.("[data-action]");
      const action = actionTarget?.dataset?.action;
      if (!action) {
        return;
      }

      if (action === "copy") {
        await copySelection();
        return;
      }

      if (action === "clear") {
        clearSelection();
        return;
      }

      if (action === "toggle-list") {
        setListOpen(!state.listOpen);
        return;
      }

      if (action === "remove-item") {
        removeSelectionAtIndex(Number(actionTarget.dataset.index));
        return;
      }

      if (action === "copy-item") {
        await copySelectionItem(Number(actionTarget.dataset.index));
        return;
      }

      if (action === "set-mode") {
        setSelectionMode(actionTarget.dataset.mode);
        return;
      }

      if (action === "close") {
        deactivatePicker();
      }
    });

    document.documentElement.appendChild(toolbar);
    state.toolbar = toolbar;
    state.list = toolbar.querySelector("#chat-context-picker-list");
    state.countLabel = toolbar.querySelector("#chat-context-picker-count");
    state.countBadge = toolbar.querySelector("#chat-context-picker-count-badge");
    state.listTrigger = toolbar.querySelector('[data-action="toggle-list"]');
    state.copyButton = toolbar.querySelector('[data-action="copy"]');
    state.clearButton = toolbar.querySelector('[data-action="clear"]');
    state.modeButtons = [...toolbar.querySelectorAll('[data-action="set-mode"]')];

    renderSelection();
    setSelectionMode(state.selectionMode, false);
    setListOpen(false);
  }

  function ensurePromptPopover() {
    if (state.promptPopover) {
      return;
    }

    const popover = document.createElement("div");
    popover.className = "chat-context-picker-prompt-popover";
    popover.dataset.open = "false";
    popover.dataset.chatContextPickerUi = "true";
    popover.innerHTML = `
      <div class="chat-context-picker-prompt-header">
        <div class="chat-context-picker-prompt-title">添加修改</div>
        <button class="chat-context-picker-prompt-close" type="button" data-action="close-prompt" aria-label="关闭" title="关闭">
          <span class="chat-context-picker-prompt-close-icon">${icon("close")}</span>
        </button>
      </div>
      <div class="chat-context-picker-prompt-input-shell">
        <textarea class="chat-context-picker-prompt-input" placeholder="在此输入调整方案提示词"></textarea>
      </div>
      <div class="chat-context-picker-prompt-divider">
        <span>快捷短语</span>
      </div>
      <div class="chat-context-picker-prompt-chips"></div>
    `;

    popover.addEventListener("click", (event) => {
      event.stopPropagation();
      const actionTarget = event.target?.closest?.("[data-action]");
      const action = actionTarget?.dataset?.action;
      if (!action) {
        return;
      }

      if (action === "close-prompt") {
        discardPromptChanges();
        return;
      }

      if (action === "insert-prompt") {
        insertPromptText(actionTarget.dataset.value || "");
      }
    });

    document.documentElement.appendChild(popover);
    state.promptPopover = popover;
    state.promptTextarea = popover.querySelector(".chat-context-picker-prompt-input");
    state.promptChips = popover.querySelector(".chat-context-picker-prompt-chips");
    state.promptTextarea.addEventListener("input", autoResizePromptTextarea);
    autoResizePromptTextarea();
  }

  function ensureOverlayLayer() {
    if (state.overlayLayer) {
      return;
    }

    const layer = document.createElement("div");
    layer.id = "chat-context-picker-overlay-layer";
    document.documentElement.appendChild(layer);
    state.overlayLayer = layer;
  }

  function showToast(message) {
    const existing = document.querySelector(".chat-context-picker-toast");
    if (existing) {
      existing.remove();
    }

    const toast = document.createElement("div");
    toast.className = "chat-context-picker-toast";
    toast.textContent = message;
    document.documentElement.appendChild(toast);
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(() => toast.remove(), 2200);
  }

  function getElementDescriptor(element) {
    const tag = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : "";
    const classes = [...element.classList].slice(0, 3).map((item) => `.${item}`).join("");
    return `${tag}${id}${classes}`;
  }

  function getTargetElement(target) {
    return target.kind === "text" ? target.parentElement : target.element;
  }

  function getTargetNode(target) {
    return target.kind === "text" ? target.node : target.element;
  }

  function getTargetLabel(target) {
    if (target.kind === "text") {
      return `文本 · ${getElementDescriptor(target.parentElement)}`;
    }

    return getElementDescriptor(target.element);
  }

  function getPromptSuggestions(target) {
    const element = getTargetElement(target);
    const tag = element.tagName.toLowerCase();

    if (target.kind === "text" || /^(span|p|label|strong|em|small|h1|h2|h3|h4|h5|h6|li|a)$/.test(tag)) {
      return [
        "修改文案为",
        "修改字号为",
        "修改字重为",
        "修改颜色为",
        "修改行高为",
        "修改对齐方式为"
      ];
    }

    if (/^(button|a)$/.test(tag) || element.getAttribute("role") === "button") {
      return [
        "修改按钮文案为",
        "修改按钮圆角为",
        "修改按钮背景色为",
        "修改按钮边框为",
        "修改按钮高度为",
        "修改按钮宽度为"
      ];
    }

    if (/^(img|svg|picture)$/.test(tag)) {
      return [
        "调整图片尺寸为",
        "修改图片圆角为",
        "增加阴影效果",
        "替换为新图标",
        "修改图片位置为",
        "增加描边效果"
      ];
    }

    if (/^(input|textarea|select)$/.test(tag)) {
      return [
        "修改输入框文案为",
        "修改 placeholder 为",
        "修改输入框高度为",
        "修改边框颜色为",
        "修改圆角为",
        "修改背景色为"
      ];
    }

    return [
      "修改内边距为",
      "修改外边距为",
      "修改背景色为",
      "修改圆角为",
      "去掉该元素",
      "修改边框为"
    ];
  }

  function renderPromptSuggestions(target) {
    if (!state.promptChips) {
      return;
    }

    const suggestions = getPromptSuggestions(target);
    state.promptChips.innerHTML = suggestions
      .map((label) => `
        <button class="chat-context-picker-prompt-chip" type="button" data-action="insert-prompt" data-value="${escapeHtml(label)}">${escapeHtml(label)}</button>
      `)
      .join("");
  }

  function truncate(value, maxLength = 140) {
    const normalized = (value || "").replace(/\s+/g, " ").trim();
    if (normalized.length <= maxLength) {
      return normalized;
    }

    return `${normalized.slice(0, maxLength - 1)}…`;
  }

  function cssPath(element) {
    const parts = [];
    let current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE && parts.length < 6) {
      let selector = current.tagName.toLowerCase();

      if (current.id) {
        selector += `#${CSS.escape(current.id)}`;
        parts.unshift(selector);
        break;
      }

      const classNames = [...current.classList].slice(0, 2);
      if (classNames.length) {
        selector += classNames.map((name) => `.${CSS.escape(name)}`).join("");
      } else if (current.parentElement) {
        const siblings = [...current.parentElement.children].filter(
          (node) => node.tagName === current.tagName
        );
        if (siblings.length > 1) {
          selector += `:nth-of-type(${siblings.indexOf(current) + 1})`;
        }
      }

      parts.unshift(selector);
      current = current.parentElement;
    }

    return parts.join(" > ");
  }

  function getTextNodeClientRects(textNode) {
    if (!textNode?.isConnected) {
      return [];
    }

    const range = document.createRange();
    range.selectNodeContents(textNode);
    const rects = [...range.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0);
    range.detach?.();
    return rects;
  }

  function getTargetClientRects(target) {
    if (target.kind === "text") {
      return getTextNodeClientRects(target.node);
    }

    const rect = target.element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return [];
    }

    return [rect];
  }

  function mergeRects(rects) {
    if (!rects.length) {
      return null;
    }

    const left = Math.min(...rects.map((rect) => rect.left));
    const top = Math.min(...rects.map((rect) => rect.top));
    const right = Math.max(...rects.map((rect) => rect.right));
    const bottom = Math.max(...rects.map((rect) => rect.bottom));

    return {
      left,
      top,
      right,
      bottom,
      width: right - left,
      height: bottom - top,
      x: left,
      y: top
    };
  }

  function getTargetPreviewText(target) {
    if (target.kind === "text") {
      return truncate(target.node.textContent || "", 80) || "空内容";
    }

    const element = target.element;
    return truncate(element.innerText || element.textContent || "", 80) || "空内容";
  }

  function isElementTarget(target) {
    return target?.kind === "element";
  }

  function targetToContext(target, index) {
    const element = getTargetElement(target);
    const styles = window.getComputedStyle(element);
    const rect = mergeRects(getTargetClientRects(target)) || element.getBoundingClientRect();
    const text = truncate(
      target.kind === "text" ? target.node.textContent || "" : element.innerText || element.textContent || "",
      300
    );

    return {
      index,
      kind: target.kind,
      promptText: target.promptText || "",
      selector: cssPath(element),
      label: getTargetLabel(target),
      role: element.getAttribute("role") || "",
      ariaLabel: element.getAttribute("aria-label") || "",
      text,
      html: truncate(element.outerHTML, 1200),
      rect: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      },
      style: {
        color: styles.color,
        backgroundColor: styles.backgroundColor,
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        borderRadius: styles.borderRadius,
        display: styles.display,
        position: styles.position
      }
    };
  }

  function buildClipboardPayload() {
    return buildClipboardPayloadForTargets(state.selectedTargets);
  }

  function renderSelection() {
    ensureToolbar();
    pruneSelectedTargets();

    const count = state.selectedTargets.length;
    state.countLabel.textContent = `已选 ${count} 个`;
    state.countBadge.textContent = String(count);
    state.countBadge.dataset.hidden = count > 0 ? "false" : "true";
    state.listTrigger.dataset.hasSelection = count > 0 ? "true" : "false";
    state.copyButton.disabled = count === 0;
    state.clearButton.disabled = count === 0;

    if (!count) {
      state.list.innerHTML = `
        <div class="chat-context-picker-empty-state">
          <div class="chat-context-picker-empty-icon">${icon("inbox")}</div>
          <div class="chat-context-picker-empty-copy">尚未选择任何元素</div>
        </div>
      `;
      return;
    }

    state.list.innerHTML = state.selectedTargets
      .map((target, index) => {
        const rect = mergeRects(getTargetClientRects(target));
        const displayRect = rect || getTargetElement(target).getBoundingClientRect();
        const kindLabel = target.kind === "text" ? "文本片段" : "元素";
        const previewText = target.promptText || getTargetPreviewText(target);

        return `
          <div class="chat-context-picker-item">
            <div class="chat-context-picker-item-top">
              <div class="chat-context-picker-item-label">${escapeHtml(getTargetLabel(target))}</div>
              <div class="chat-context-picker-item-actions">
                <button class="chat-context-picker-item-icon-button" type="button" data-action="remove-item" data-index="${index}" aria-label="删除条目" title="删除条目">
                  <span class="chat-context-picker-item-icon">${icon("trash")}</span>
                </button>
                <button class="chat-context-picker-item-icon-button" type="button" data-action="copy-item" data-index="${index}" aria-label="复制条目" title="复制条目">
                  <span class="chat-context-picker-item-icon">${icon("copy")}</span>
                </button>
              </div>
            </div>
            <div class="chat-context-picker-item-preview">${escapeHtml(previewText)}</div>
            <div class="chat-context-picker-item-meta">${kindLabel} · ${Math.round(displayRect.width)} × ${Math.round(displayRect.height)}</div>
            <div class="chat-context-picker-item-meta">${escapeHtml(truncate(cssPath(getTargetElement(target)), 180))}</div>
          </div>
        `;
      })
      .join("");
  }

  function escapeHtml(value) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function isSameTarget(a, b) {
    if (!a || !b || a.kind !== b.kind) {
      return false;
    }

    return getTargetNode(a) === getTargetNode(b);
  }

  function hasSelectedTarget(target) {
    return state.selectedTargets.some((item) => isSameTarget(item, target));
  }

  function findSelectedTarget(target) {
    return state.selectedTargets.find((item) => isSameTarget(item, target)) || null;
  }

  function isToolbarElement(node) {
    const element = node instanceof Element ? node : node?.parentElement;
    return Boolean(element?.closest?.('[data-chat-context-picker-ui="true"], #chat-context-picker-toolbar'));
  }

  function isSelectableElement(node) {
    if (!(node instanceof Element)) {
      return false;
    }

    if (isToolbarElement(node)) {
      return false;
    }

    if (node === document.body || node === document.documentElement) {
      return false;
    }

    return true;
  }

  function hasMeaningfulText(textNode) {
    return textNode?.nodeType === Node.TEXT_NODE && /\S/.test(textNode.textContent || "");
  }

  function isLiveTarget(target) {
    if (target.kind === "text") {
      return Boolean(
        target.node?.isConnected &&
          target.parentElement?.isConnected &&
          hasMeaningfulText(target.node) &&
          isSelectableElement(target.parentElement)
      );
    }

    return Boolean(target.element?.isConnected && isSelectableElement(target.element));
  }

  function pruneSelectedTargets() {
    state.selectedTargets = state.selectedTargets.filter(isLiveTarget);

    if (state.hoveredTarget && !isLiveTarget(state.hoveredTarget)) {
      state.hoveredTarget = null;
    }

    if (state.hoveredSelectedTarget && !isLiveTarget(state.hoveredSelectedTarget)) {
      state.hoveredSelectedTarget = null;
    }

    if (state.dragSession) {
      const draggedStillLive = isLiveTarget(state.dragSession.draggedTarget);
      const dropStillLive = !state.dragSession.dropTarget || isLiveTarget(state.dragSession.dropTarget);
      if (!draggedStillLive || !dropStillLive) {
        state.dragSession = null;
      }
    }
  }

  function inflateRect(rect, amount) {
    return {
      left: rect.left - amount,
      top: rect.top - amount,
      width: rect.width + amount * 2,
      height: rect.height + amount * 2
    };
  }

  function drawHighlight(target, variant) {
    const rects = getTargetClientRects(target);
    if (!rects.length) {
      return;
    }

    const element = getTargetElement(target);
    const styles = window.getComputedStyle(element);
    const borderRadius = target.kind === "text" ? "10px" : styles.borderRadius || "12px";

    for (const rect of rects) {
      const inflated = inflateRect(rect, 2);
      const overlay = document.createElement("div");
      overlay.className = `chat-context-picker-overlay-rect chat-context-picker-overlay-${variant}`;
      overlay.style.left = `${inflated.left}px`;
      overlay.style.top = `${inflated.top}px`;
      overlay.style.width = `${inflated.width}px`;
      overlay.style.height = `${inflated.height}px`;
      overlay.style.borderRadius = borderRadius;
      state.overlayLayer.appendChild(overlay);
    }
  }

  function drawPromptTrigger(target) {
    const rect = mergeRects(getTargetClientRects(target));
    if (!rect) {
      return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "chat-context-picker-overlay-add-button";
    button.dataset.chatContextPickerUi = "true";
    button.setAttribute("aria-label", "添加修改");
    button.setAttribute("title", "添加修改");
    button.innerHTML = icon("plus");
    button.style.left = `${rect.right - 8}px`;
    button.style.top = `${rect.bottom - 8}px`;

    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openPromptPopover(target);
    });

    state.overlayLayer.appendChild(button);
  }

  function drawLayoutHandle(target, index) {
    const rect = mergeRects(getTargetClientRects(target));
    if (!rect) {
      return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "chat-context-picker-overlay-layout-handle";
    button.dataset.chatContextPickerUi = "true";
    button.dataset.index = String(index);
    button.setAttribute("aria-label", "拖拽交换位置");
    button.setAttribute("title", "拖拽交换位置");
    button.style.left = `${rect.left + rect.width / 2}px`;
    button.style.top = `${rect.top + rect.height / 2}px`;

    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      startLayoutDrag(index, event);
    });

    state.overlayLayer.appendChild(button);
  }

  function drawDraggingHandle(clientX, clientY) {
    if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) {
      return;
    }

    const handle = document.createElement("div");
    handle.className =
      "chat-context-picker-overlay-layout-handle chat-context-picker-overlay-layout-handle-dragging";
    handle.dataset.chatContextPickerUi = "true";
    handle.style.left = `${clientX}px`;
    handle.style.top = `${clientY}px`;
    state.overlayLayer.appendChild(handle);
  }

  function refreshHighlights() {
    ensureOverlayLayer();
    pruneSelectedTargets();
    state.overlayLayer.replaceChildren();

    if (!state.highlightsVisible) {
      return;
    }

    for (const target of state.selectedTargets) {
      const isDropTarget = isSameTarget(state.dragSession?.dropTarget, target);
      const isDraggedTarget = isSameTarget(state.dragSession?.draggedTarget, target);
      const variant = isDropTarget ? "drop-target" : isDraggedTarget ? "dragging" : "selected";
      drawHighlight(target, variant);
    }

    if (state.active && state.hoveredTarget && !hasSelectedTarget(state.hoveredTarget)) {
      drawHighlight(state.hoveredTarget, "hover");
    }

    if (
      state.selectionMode === "select" &&
      state.active &&
      state.hoveredSelectedTarget &&
      hasSelectedTarget(state.hoveredSelectedTarget)
    ) {
      drawPromptTrigger(state.hoveredSelectedTarget);
    }

    if (state.selectionMode === "layout") {
      state.selectedTargets.forEach((target, index) => {
        if (isElementTarget(target)) {
          drawLayoutHandle(target, index);
        }
      });

      if (state.dragSession) {
        drawDraggingHandle(state.dragSession.clientX, state.dragSession.clientY);
      }
    }
  }

  function clearHover() {
    if (!state.hoveredTarget && !state.hoveredSelectedTarget) {
      return;
    }

    state.hoveredTarget = null;
    state.hoveredSelectedTarget = null;
    refreshHighlights();
  }

  function setSelectedHighlightsVisible(visible) {
    state.highlightsVisible = visible;
    refreshHighlights();
  }

  function setListOpen(open) {
    ensureToolbar();
    state.listOpen = open;
    state.toolbar.dataset.listOpen = open ? "true" : "false";
    state.listTrigger.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function setSelectionMode(mode, shouldNotify = true) {
    if (!MODE_LABELS[mode]) {
      return;
    }

    state.selectionMode = mode;
    state.dragSession = null;

    if (mode === "layout") {
      state.selectedTargets = state.selectedTargets.filter(isElementTarget);
      renderSelection();
    }

    for (const button of state.modeButtons) {
      const isActive = button.dataset.mode === mode;
      button.dataset.state = isActive ? "active" : "inactive";
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    }

    clearHover();
    refreshHighlights();

    if (shouldNotify && state.active) {
      showToast(`已切换为${MODE_LABELS[mode]}`);
    }
  }

  function setHover(target) {
    if (!target) {
      if (state.hoveredTarget || state.hoveredSelectedTarget) {
        clearHover();
      }
      return;
    }

    if (hasSelectedTarget(target)) {
      if (isSameTarget(state.hoveredSelectedTarget, target)) {
        return;
      }
      state.hoveredTarget = null;
      state.hoveredSelectedTarget = target;
      refreshHighlights();
      return;
    }

    if (isSameTarget(state.hoveredTarget, target)) {
      return;
    }

    state.hoveredTarget = target;
    state.hoveredSelectedTarget = null;
    refreshHighlights();
  }

  function getLayoutSwapTarget(clientX, clientY, draggedTarget) {
    const candidates = state.selectedTargets
      .filter((target) => isElementTarget(target) && !isSameTarget(target, draggedTarget))
      .map((target) => {
        const rect = mergeRects(getTargetClientRects(target));
        return rect ? { target, rect, area: rect.width * rect.height } : null;
      })
      .filter(Boolean)
      .filter(({ rect }) => pointInRect(clientX, clientY, rect))
      .sort((a, b) => a.area - b.area);

    return candidates[0]?.target || null;
  }

  function startLayoutDrag(index, event) {
    pruneSelectedTargets();
    const draggedTarget = state.selectedTargets[index];
    if (!isElementTarget(draggedTarget)) {
      return;
    }

    state.dragSession = {
      draggedTarget,
      dropTarget: null,
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY
    };
    state.suppressClickUntil = Date.now() + 400;
    refreshHighlights();
  }

  function swapElementPositions(firstElement, secondElement) {
    if (
      !firstElement ||
      !secondElement ||
      firstElement === secondElement ||
      firstElement.contains(secondElement) ||
      secondElement.contains(firstElement)
    ) {
      return false;
    }

    const firstParent = firstElement.parentNode;
    const secondParent = secondElement.parentNode;
    if (!firstParent || !secondParent) {
      return false;
    }

    const firstPlaceholder = document.createComment("chat-context-picker-first");
    const secondPlaceholder = document.createComment("chat-context-picker-second");

    firstParent.replaceChild(firstPlaceholder, firstElement);
    secondParent.replaceChild(secondPlaceholder, secondElement);
    firstPlaceholder.parentNode.replaceChild(secondElement, firstPlaceholder);
    secondPlaceholder.parentNode.replaceChild(firstElement, secondPlaceholder);
    return true;
  }

  function finishLayoutDrag(event) {
    if (!state.dragSession || (event && event.button !== 0)) {
      return;
    }

    const { draggedTarget, dropTarget } = state.dragSession;
    state.dragSession = null;

    if (!draggedTarget || !dropTarget) {
      refreshHighlights();
      return;
    }

    const swapped = swapElementPositions(
      getTargetElement(draggedTarget),
      getTargetElement(dropTarget)
    );

    if (!swapped) {
      showToast("当前这两个元素暂时不支持互换位置");
      refreshHighlights();
      return;
    }

    renderSelection();
    refreshHighlights();
    showToast("已交换两个元素的位置");
  }

  function openPromptPopover(target) {
    ensurePromptPopover();
    if (isPromptOpen()) {
      discardPromptChanges();
    }
    const persistedTarget = findSelectedTarget(target) || target;
    state.promptTarget = persistedTarget;
    state.promptDraftValue = persistedTarget.promptText || "";
    state.promptSavedSelectionMode = state.selectionMode;
    renderPromptSuggestions(persistedTarget);

    const rect = mergeRects(getTargetClientRects(persistedTarget)) || getTargetElement(persistedTarget).getBoundingClientRect();
    const popoverWidth = Math.min(380, window.innerWidth - 32);
    const popoverHeight = 232;
    const viewportPadding = 16;
    const anchorGap = 20;

    let left = rect.right + anchorGap;
    let top = rect.bottom + anchorGap;

    if (left + popoverWidth > window.innerWidth - viewportPadding) {
      left = rect.left - popoverWidth - anchorGap;
    }

    if (left < viewportPadding) {
      left = Math.max(
        viewportPadding,
        Math.min(window.innerWidth - popoverWidth - viewportPadding, rect.left)
      );
    }

    if (top + popoverHeight > window.innerHeight - viewportPadding) {
      top = rect.top - popoverHeight - anchorGap;
    }

    if (top < viewportPadding) {
      top = Math.max(
        viewportPadding,
        Math.min(window.innerHeight - popoverHeight - viewportPadding, rect.bottom + 12)
      );
    }

    state.promptPopover.style.left = `${left}px`;
    state.promptPopover.style.top = `${top}px`;
    state.promptPopover.dataset.open = "true";
    state.promptTextarea.value = state.promptDraftValue;
    autoResizePromptTextarea();
    state.promptTextarea.focus();
    state.hoveredTarget = null;
    state.hoveredSelectedTarget = null;
    refreshHighlights();
  }

  function closePromptPopover() {
    if (!state.promptPopover) {
      return;
    }

    state.promptPopover.dataset.open = "false";
    state.promptTarget = null;
    state.promptDraftValue = "";
    state.promptSavedSelectionMode = null;
    refreshHighlights();
  }

  function isPromptOpen() {
    return Boolean(state.promptPopover && state.promptPopover.dataset.open === "true");
  }

  function savePromptChanges() {
    if (!isPromptOpen() || !state.promptTarget || !state.promptTextarea) {
      closePromptPopover();
      return;
    }

    const persistedTarget = findSelectedTarget(state.promptTarget) || state.promptTarget;
    persistedTarget.promptText = state.promptTextarea.value.trim();
    state.promptTarget = persistedTarget;
    renderSelection();
    closePromptPopover();
    showToast("已保存修改提示词");
  }

  function discardPromptChanges() {
    if (!isPromptOpen()) {
      closePromptPopover();
      return;
    }

    if (state.promptTextarea) {
      state.promptTextarea.value = state.promptDraftValue || "";
      autoResizePromptTextarea();
    }

    closePromptPopover();
  }

  function insertPromptText(value) {
    if (!state.promptTextarea) {
      return;
    }

    const spacer = state.promptTextarea.value.trim() ? " " : "";
    state.promptTextarea.value += `${spacer}${value}`;
    autoResizePromptTextarea();
    state.promptTextarea.focus();
  }

  function autoResizePromptTextarea() {
    if (!state.promptTextarea) {
      return;
    }

    state.promptTextarea.style.height = "0px";
    state.promptTextarea.style.height = `${Math.max(44, state.promptTextarea.scrollHeight)}px`;
  }

  function resolveElementTarget(node) {
    if (node instanceof Element) {
      return node;
    }

    if (node?.nodeType === Node.TEXT_NODE) {
      return node.parentElement;
    }

    return null;
  }

  function pointInRect(clientX, clientY, rect) {
    return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
  }

  function getTextNodeFromPoint(clientX, clientY) {
    if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) {
      return null;
    }

    let textNode = null;

    if (typeof document.caretRangeFromPoint === "function") {
      const range = document.caretRangeFromPoint(clientX, clientY);
      textNode = range?.startContainer || null;
    } else if (typeof document.caretPositionFromPoint === "function") {
      const position = document.caretPositionFromPoint(clientX, clientY);
      textNode = position?.offsetNode || null;
    }

    if (!hasMeaningfulText(textNode)) {
      return null;
    }

    const rects = getTextNodeClientRects(textNode);
    if (!rects.some((rect) => pointInRect(clientX, clientY, rect))) {
      return null;
    }

    return textNode;
  }

  function createElementTarget(element) {
    return { kind: "element", element };
  }

  function createTextTarget(textNode) {
    return {
      kind: "text",
      node: textNode,
      parentElement: textNode.parentElement
    };
  }

  function isTransparent(color) {
    return color === "transparent" || color === "rgba(0, 0, 0, 0)" || color === "rgba(0,0,0,0)";
  }

  function findLayoutTarget(element) {
    let current = element;
    let bestMatch = element;

    while (current && isSelectableElement(current)) {
      const styles = window.getComputedStyle(current);
      const rect = current.getBoundingClientRect();
      const isContainer = ["flex", "inline-flex", "grid", "block"].includes(styles.display);
      const hasMultipleChildren = current.children.length >= 2;
      const largeEnough = rect.width >= 120 && rect.height >= 44;
      const notPageSized = rect.width <= window.innerWidth * 0.9 && rect.height <= window.innerHeight * 0.72;
      const hasSurface =
        !isTransparent(styles.backgroundColor) ||
        parseFloat(styles.borderTopWidth || "0") > 0 ||
        styles.boxShadow !== "none";

      if (isContainer && largeEnough && notPageSized && (hasMultipleChildren || hasSurface)) {
        bestMatch = current;
      }

      current = current.parentElement;
    }

    return bestMatch;
  }

  function normalizeSelectableTarget(node, clientX, clientY) {
    const resolvedNode = resolveElementTarget(node);

    if (!(resolvedNode instanceof Element) || isToolbarElement(resolvedNode)) {
      return null;
    }

    const svgRoot = resolvedNode.closest?.("svg");
    const candidateElement = svgRoot || resolvedNode;

    if (!isSelectableElement(candidateElement)) {
      return null;
    }

    if (state.selectionMode === "layout") {
      return createElementTarget(findLayoutTarget(candidateElement));
    }

    if (state.selectionMode === "select") {
      return createElementTarget(candidateElement);
    }

    const textNode = getTextNodeFromPoint(clientX, clientY);
    if (hasMeaningfulText(textNode) && candidateElement.contains(textNode.parentElement)) {
      return createTextTarget(textNode);
    }

    return createElementTarget(candidateElement);
  }

  function toggleTargetSelection(target) {
    pruneSelectedTargets();

    const index = state.selectedTargets.findIndex((item) => isSameTarget(item, target));
    if (index >= 0) {
      state.selectedTargets.splice(index, 1);
      showToast(target.kind === "text" ? "已移除文本" : "已移除元素");
    } else {
      state.selectedTargets.push(target);
      showToast(target.kind === "text" ? "已添加文本" : "已添加元素");
    }

    if (isSameTarget(state.hoveredTarget, target)) {
      state.hoveredTarget = null;
    }

    if (isSameTarget(state.hoveredSelectedTarget, target)) {
      state.hoveredSelectedTarget = null;
    }

    renderSelection();
    refreshHighlights();
  }

  function clearSelection() {
    if (!state.selectedTargets.length) {
      return;
    }

    state.selectedTargets = [];
    state.hoveredTarget = null;
    state.hoveredSelectedTarget = null;
    renderSelection();
    refreshHighlights();
    closePromptPopover();
    showToast("已清空选择");
  }

  function removeSelectionAtIndex(index) {
    if (!Number.isInteger(index) || index < 0 || index >= state.selectedTargets.length) {
      return;
    }

    const [removedTarget] = state.selectedTargets.splice(index, 1);
    if (isSameTarget(state.hoveredTarget, removedTarget)) {
      state.hoveredTarget = null;
    }

    if (isSameTarget(state.hoveredSelectedTarget, removedTarget)) {
      state.hoveredSelectedTarget = null;
    }

    if (state.promptTarget && isSameTarget(state.promptTarget, removedTarget)) {
      closePromptPopover();
    }

    renderSelection();
    refreshHighlights();
    showToast("已移除条目");
  }

  async function copySelectionItem(index) {
    pruneSelectedTargets();
    if (!Number.isInteger(index) || index < 0 || index >= state.selectedTargets.length) {
      return;
    }

    const payload = buildClipboardPayloadForTargets([state.selectedTargets[index]]);
    try {
      await writeTextToClipboard(payload);
      showToast("已复制条目");
    } catch (error) {
      showToast("复制失败");
      console.error("Selection item copy failed", error);
    }
  }

  async function copySelection() {
    pruneSelectedTargets();
    if (!state.selectedTargets.length) {
      showToast("请先选择至少一个目标");
      return;
    }

    const payload = buildClipboardPayload();
    try {
      await writeTextToClipboard(payload);
      showToast("已复制元素上下文");
    } catch (error) {
      showToast("复制失败");
      console.error("Web element context copy failed", error);
    }
  }

  function buildClipboardPayloadForTargets(targets) {
    const items = targets.map((target, index) => targetToContext(target, index + 1));
    const isLayoutMode = state.selectionMode === "layout";
    const layoutSummary = isLayoutMode
      ? [
          "### 布局调整说明",
          "- 当前任务类型：互换已选元素的位置 / 调整这些元素的排列顺序",
          `- 当前选中顺序：${items.map((item) => `目标 ${item.index}`).join(" -> ") || "无"}`,
          "- 如果没有额外提示词，默认优先理解为对这些目标做换位置或重排，而不是仅修改样式",
          ""
        ]
      : [];

    return [
      "# 页面修改上下文",
      "",
      `页面标题：${document.title}`,
      `页面地址：${window.location.href}`,
      `选择模式：${MODE_LABELS[state.selectionMode]}`,
      "",
      "请严格基于下面每个目标元素的当前信息与修改要求进行 UI 调整。",
      "",
      ...layoutSummary,
      ...items.map((item) => [
        `## 目标 ${item.index}：${item.label}`,
        "",
        "### 目标元素",
        `- 类型：${item.kind === "text" ? "文本片段" : "元素"}`,
        `- 标签描述：${item.label}`,
        `- 当前布局序号：${item.index}`,
        `- 选择器：${item.selector || "不可用"}`,
        `- 角色：${item.role || "无"}`,
        `- Aria 标签：${item.ariaLabel || "无"}`,
        "",
        "### 当前信息",
        `- 文本内容：${item.text || "空"}`,
        `- 位置尺寸：x=${item.rect.x}, y=${item.rect.y}, w=${item.rect.width}, h=${item.rect.height}`,
        `- 关键样式：color=${item.style.color}; background=${item.style.backgroundColor}; font-size=${item.style.fontSize}; font-weight=${item.style.fontWeight}; border-radius=${item.style.borderRadius}; display=${item.style.display}; position=${item.style.position}`,
        "- HTML 片段：",
        "```html",
        item.html,
        "```",
        "",
        "### 修改要求",
        item.promptText ||
          (isLayoutMode
            ? "该目标用于布局换位/顺序调整，请结合其他已选目标一起理解其交换位置或重排关系。"
            : "未提供具体修改提示词，请仅参考当前信息。")
      ].join("\n"))
    ].join("\n");
  }

  async function writeTextToClipboard(text) {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch (error) {
        console.warn("navigator.clipboard.writeText failed, falling back", error);
      }
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.setAttribute("aria-hidden", "true");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.left = "-9999px";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const copied = document.execCommand("copy");
    textarea.remove();

    if (!copied) {
      throw new Error("execCommand copy fallback failed");
    }
  }

  function handlePointerMove(event) {
    if (!state.active || isPromptOpen()) {
      return;
    }

    if (state.selectionMode === "layout" && state.dragSession) {
      state.dragSession.clientX = event.clientX;
      state.dragSession.clientY = event.clientY;
      const dropTarget = getLayoutSwapTarget(event.clientX, event.clientY, state.dragSession.draggedTarget);
      if (!isSameTarget(dropTarget, state.dragSession.dropTarget)) {
        state.dragSession.dropTarget = dropTarget;
      }
      refreshHighlights();
      return;
    }

    if (isToolbarElement(event.target)) {
      return;
    }

    if (state.selectionMode !== "select" && state.selectionMode !== "layout") {
      return;
    }

    const target = normalizeSelectableTarget(event.target, event.clientX, event.clientY);
    if (!target) {
      clearHover();
      return;
    }

    setHover(target);
  }

  function handlePointerDown(event) {
    if (!state.active || event.button !== 0) {
      return;
    }

    if (isPromptOpen()) {
      const clickedInsidePrompt = Boolean(event.target?.closest?.(".chat-context-picker-prompt-popover"));
      if (!clickedInsidePrompt) {
        event.preventDefault();
        event.stopPropagation();
        state.suppressClickUntil = Date.now() + 400;
        savePromptChanges();
      }
      return;
    }

    if (state.selectionMode !== "select" && state.selectionMode !== "layout") {
      return;
    }

    if (isToolbarElement(event.target)) {
      return;
    }

    const target = normalizeSelectableTarget(event.target, event.clientX, event.clientY);
    if (!target) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    state.suppressClickUntil = Date.now() + 400;
    toggleTargetSelection(target);
  }

  function handlePointerUp(event) {
    if (!state.active || state.selectionMode !== "layout") {
      return;
    }

    finishLayoutDrag(event);
  }

  function handleClick(event) {
    if (!state.active) {
      return;
    }

    if (Date.now() < state.suppressClickUntil) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (isPromptOpen()) {
      return;
    }

    if (state.selectionMode !== "select") {
      return;
    }

    if (isToolbarElement(event.target)) {
      return;
    }

    const target = normalizeSelectableTarget(event.target, event.clientX, event.clientY);
    if (target && Date.now() < state.suppressClickUntil) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (!target) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    toggleTargetSelection(target);
  }

  function handleViewportChange() {
    if (state.highlightsVisible) {
      refreshHighlights();
    }
  }

  function activatePicker() {
    ensureToolbar();
    ensureOverlayLayer();
    ensurePromptPopover();
    state.active = true;
    state.toolbar.dataset.hidden = "false";
    setSelectionMode(state.selectionMode, false);
    setListOpen(false);
    renderSelection();
    setSelectedHighlightsVisible(true);
    document.addEventListener("pointermove", handlePointerMove, true);
    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("pointerup", handlePointerUp, true);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("scroll", handleViewportChange, true);
    window.addEventListener("resize", handleViewportChange, true);
    showToast(`已开启${MODE_LABELS[state.selectionMode]}`);
  }

  function deactivatePicker() {
    state.active = false;
    state.hoveredTarget = null;
    state.hoveredSelectedTarget = null;
    setSelectedHighlightsVisible(false);
    setListOpen(false);
    closePromptPopover();
    state.dragSession = null;
    document.removeEventListener("pointermove", handlePointerMove, true);
    document.removeEventListener("pointerdown", handlePointerDown, true);
    document.removeEventListener("pointerup", handlePointerUp, true);
    document.removeEventListener("click", handleClick, true);
    document.removeEventListener("keydown", handleKeyDown, true);
    window.removeEventListener("scroll", handleViewportChange, true);
    window.removeEventListener("resize", handleViewportChange, true);

    if (state.toolbar) {
      state.toolbar.dataset.hidden = "true";
    }

    discardPromptChanges();
    showToast("已关闭选择模式");
  }

  function handleKeyDown(event) {
    if (!state.active) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      if (isPromptOpen()) {
        discardPromptChanges();
        return;
      }
      if (state.listOpen) {
        setListOpen(false);
      } else {
        deactivatePicker();
      }
      return;
    }

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "c" && state.selectedTargets.length) {
      event.preventDefault();
      copySelection();
    }
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type !== "CHAT_CONTEXT_PICKER_TOGGLE") {
      return;
    }

    if (state.active) {
      deactivatePicker();
    } else {
      activatePicker();
    }
  });
})();
