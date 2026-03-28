(function initChatContextPicker() {
  if (window.__chatContextPickerLoaded) {
    return;
  }
  window.__chatContextPickerLoaded = true;

  const state = {
    active: false,
    panelExpanded: false,
    highlightsVisible: false,
    hoveredTarget: null,
    selectedTargets: [],
    toolbar: null,
    list: null,
    countLabel: null,
    launcherCount: null,
    launcherButton: null,
    overlayLayer: null,
    suppressClickUntil: 0,
    toastTimer: null
  };

  function ensureToolbar() {
    if (state.toolbar) {
      return;
    }

    const toolbar = document.createElement("div");
    toolbar.id = "chat-context-picker-toolbar";
    toolbar.dataset.hidden = "true";
    toolbar.dataset.collapsed = "true";
    toolbar.innerHTML = `
      <button
        class="chat-context-picker-launcher"
        type="button"
        data-action="toggle-panel"
        aria-label="展开选择器面板"
        title="展开选择器面板"
      >
        <span class="chat-context-picker-launcher-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M8 5H6.5A1.5 1.5 0 0 0 5 6.5V8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M16 5H17.5A1.5 1.5 0 0 1 19 6.5V8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M19 16V17.5A1.5 1.5 0 0 1 17.5 19H16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M8 19H6.5A1.5 1.5 0 0 1 5 17.5V16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <circle cx="12" cy="12" r="2.2" fill="currentColor"/>
          </svg>
        </span>
        <span class="chat-context-picker-launcher-count" id="chat-context-picker-launcher-count">0</span>
      </button>
      <div class="chat-context-picker-panel">
        <div class="chat-context-picker-header">
          <div class="chat-context-picker-header-main">
            <div class="chat-context-picker-title">Design cursor</div>
          </div>
          <div class="chat-context-picker-header-meta">
            <span class="chat-context-picker-count" id="chat-context-picker-count">已选 0 个</span>
            <button
              class="chat-context-picker-icon-button"
              type="button"
              data-action="collapse-panel"
              aria-label="折叠"
              title="折叠"
            >
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M5 10H15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </button>
            <button
              class="chat-context-picker-icon-button"
              type="button"
              data-action="close"
              aria-label="关闭"
              title="关闭"
            >
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </button>
          </div>
        </div>
        <div class="chat-context-picker-subtitle">
          点选页面元素或文字加入列表，再复制到对话框。再次点击同一目标可取消选择。
        </div>
        <div class="chat-context-picker-actions">
          <button class="chat-context-picker-button chat-context-picker-button-primary" data-action="copy">复制内容</button>
          <button class="chat-context-picker-button chat-context-picker-button-secondary" data-action="clear">清空选择</button>
        </div>
        <div class="chat-context-picker-list" id="chat-context-picker-list"></div>
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
      } else if (action === "clear") {
        clearSelection();
      } else if (action === "toggle-panel") {
        setPanelExpanded(!state.panelExpanded);
      } else if (action === "collapse-panel") {
        setPanelExpanded(false);
      } else if (action === "close") {
        deactivatePicker();
      }
    });

    document.documentElement.appendChild(toolbar);
    state.toolbar = toolbar;
    state.list = toolbar.querySelector("#chat-context-picker-list");
    state.countLabel = toolbar.querySelector("#chat-context-picker-count");
    state.launcherCount = toolbar.querySelector("#chat-context-picker-launcher-count");
    state.launcherButton = toolbar.querySelector(".chat-context-picker-launcher");
    renderSelection();
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
    const items = state.selectedTargets.map((target, index) => targetToContext(target, index + 1));

    return [
      "# 已选网页元素",
      "",
      `页面标题：${document.title}`,
      `页面地址：${window.location.href}`,
      "",
      "请基于下面这些已选元素上下文进行精确 UI 修改。",
      "",
      ...items.map((item) => [
        `## 目标 ${item.index}：${item.label}`,
        `- 目标类型：${item.kind === "text" ? "文本片段" : "元素"}`,
        `- 选择器：${item.selector || "不可用"}`,
        `- 角色：${item.role || "无"}`,
        `- Aria 标签：${item.ariaLabel || "无"}`,
        `- 文本：${item.text || "空"}`,
        `- 位置尺寸：x=${item.rect.x}, y=${item.rect.y}, w=${item.rect.width}, h=${item.rect.height}`,
        `- 关键样式：color=${item.style.color}; background=${item.style.backgroundColor}; font-size=${item.style.fontSize}; font-weight=${item.style.fontWeight}; border-radius=${item.style.borderRadius}; display=${item.style.display}; position=${item.style.position}`,
        "- HTML 片段：",
        "```html",
        item.html,
        "```"
      ].join("\n"))
    ].join("\n");
  }

  function renderSelection() {
    ensureToolbar();
    pruneSelectedTargets();

    const count = state.selectedTargets.length;
    state.countLabel.textContent = `已选 ${count} 个`;
    state.launcherCount.textContent = String(count);
    state.launcherButton.dataset.hasSelection = count > 0 ? "true" : "false";

    if (!count) {
      state.list.innerHTML = `
        <div class="chat-context-picker-item">
          <div class="chat-context-picker-item-label">还没有选中目标</div>
          <div class="chat-context-picker-item-meta">点击页面里任意元素或文字，就会出现在这里。</div>
        </div>
      `;
      return;
    }

    state.list.innerHTML = state.selectedTargets
      .map((target, index) => {
        const rect = mergeRects(getTargetClientRects(target));
        const displayRect = rect || getTargetElement(target).getBoundingClientRect();

        return `
          <div class="chat-context-picker-item">
            <div class="chat-context-picker-item-label">${index + 1}. ${escapeHtml(getTargetLabel(target))}</div>
            <div class="chat-context-picker-item-meta">${escapeHtml(truncate(cssPath(getTargetElement(target)), 180))}</div>
            <div class="chat-context-picker-item-meta">${escapeHtml(getTargetPreviewText(target))}</div>
            <div class="chat-context-picker-item-meta">${target.kind === "text" ? "文本片段" : "元素"} · ${Math.round(displayRect.width)} × ${Math.round(displayRect.height)}</div>
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

  function isToolbarElement(node) {
    const element = node instanceof Element ? node : node?.parentElement;
    return Boolean(element?.closest?.("#chat-context-picker-toolbar"));
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

  function refreshHighlights() {
    ensureOverlayLayer();
    pruneSelectedTargets();
    state.overlayLayer.replaceChildren();

    if (!state.highlightsVisible) {
      return;
    }

    for (const target of state.selectedTargets) {
      drawHighlight(target, "selected");
    }

    if (state.active && state.hoveredTarget && !hasSelectedTarget(state.hoveredTarget)) {
      drawHighlight(state.hoveredTarget, "hover");
    }
  }

  function clearHover() {
    if (!state.hoveredTarget) {
      return;
    }
    state.hoveredTarget = null;
    refreshHighlights();
  }

  function setSelectedHighlightsVisible(visible) {
    state.highlightsVisible = visible;
    refreshHighlights();
  }

  function setPanelExpanded(expanded) {
    ensureToolbar();
    state.panelExpanded = expanded;
    state.toolbar.dataset.collapsed = expanded ? "false" : "true";
    state.launcherButton.setAttribute("aria-label", expanded ? "折叠选择器面板" : "展开选择器面板");
    state.launcherButton.setAttribute("title", expanded ? "折叠选择器面板" : "展开选择器面板");
  }

  function setHover(target) {
    if (!target || hasSelectedTarget(target)) {
      if (state.hoveredTarget) {
        clearHover();
      }
      return;
    }

    if (isSameTarget(state.hoveredTarget, target)) {
      return;
    }

    state.hoveredTarget = target;
    refreshHighlights();
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

    renderSelection();
    refreshHighlights();
  }

  function clearSelection() {
    state.selectedTargets = [];
    state.hoveredTarget = null;
    renderSelection();
    refreshHighlights();
    showToast("已清空选择");
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
    if (!state.active) {
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

    const target = normalizeSelectableTarget(event.target, event.clientX, event.clientY);
    if (!target) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    state.suppressClickUntil = Date.now() + 400;
    toggleTargetSelection(target);
  }

  function handleClick(event) {
    if (!state.active) {
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
    state.active = true;
    state.toolbar.dataset.hidden = "false";
    setPanelExpanded(true);
    renderSelection();
    setSelectedHighlightsVisible(true);
    document.addEventListener("pointermove", handlePointerMove, true);
    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("scroll", handleViewportChange, true);
    window.addEventListener("resize", handleViewportChange, true);
    showToast("已开启选择模式");
  }

  function deactivatePicker() {
    state.active = false;
    state.hoveredTarget = null;
    setSelectedHighlightsVisible(false);
    setPanelExpanded(false);
    document.removeEventListener("pointermove", handlePointerMove, true);
    document.removeEventListener("pointerdown", handlePointerDown, true);
    document.removeEventListener("click", handleClick, true);
    document.removeEventListener("keydown", handleKeyDown, true);
    window.removeEventListener("scroll", handleViewportChange, true);
    window.removeEventListener("resize", handleViewportChange, true);
    if (state.toolbar) {
      state.toolbar.dataset.hidden = "true";
    }
    showToast("已关闭选择模式");
  }

  function handleKeyDown(event) {
    if (!state.active) {
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      deactivatePicker();
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
