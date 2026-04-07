// Shared DOM helpers, rendering, and undo/redo history live in this layer.
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

function isAdjustInteractionSurfaceOpen(surface) {
  if (!(surface instanceof Element)) {
    return false;
  }

  if (surface === state.adjustPopover) {
    return surface.dataset.open === "true";
  }

  return surface.dataset.open !== "false";
}

function shouldSuppressAdjustTargetHighlightForTarget(target) {
  return Boolean(
    state.adjustTarget &&
      state.adjustTargetHighlightSuppressed &&
      isSameTarget(target, state.adjustTarget)
  );
}

function syncAdjustTargetHighlightSuppression() {
  const activeElement = document.activeElement instanceof Element ? document.activeElement : null;
  const hasFocusedAdjustControl =
    Boolean(activeElement) &&
    [
      state.adjustPopover,
      state.sizeMenu,
      state.gapMenu,
      state.fillPopover,
      state.shadowPopover
    ].some((surface) => isAdjustInteractionSurfaceOpen(surface) && surface.contains(activeElement));
  const nextSuppressed = Boolean(state.adjustTarget) && (state.adjustTargetHighlightPointerActive || hasFocusedAdjustControl);

  if (state.adjustTargetHighlightSuppressed === nextSuppressed) {
    return;
  }

  state.adjustTargetHighlightSuppressed = nextSuppressed;
  if (state.highlightsVisible) {
    refreshHighlights();
  }
}

function handleAdjustTargetHighlightPointerRelease() {
  window.removeEventListener("pointerup", handleAdjustTargetHighlightPointerRelease, true);
  window.removeEventListener("pointercancel", handleAdjustTargetHighlightPointerRelease, true);
  state.adjustTargetHighlightPointerActive = false;
  syncAdjustTargetHighlightSuppression();
}

function beginAdjustTargetHighlightInteraction() {
  if (!state.adjustTarget) {
    return;
  }

  if (!state.adjustTargetHighlightPointerActive) {
    state.adjustTargetHighlightPointerActive = true;
    window.addEventListener("pointerup", handleAdjustTargetHighlightPointerRelease, true);
    window.addEventListener("pointercancel", handleAdjustTargetHighlightPointerRelease, true);
  }

  syncAdjustTargetHighlightSuppression();
}

function bindAdjustHighlightSuppression(container) {
  if (!container || container.dataset.chatContextPickerHighlightSuppressionReady === "true") {
    return;
  }

  container.dataset.chatContextPickerHighlightSuppressionReady = "true";

  container.addEventListener(
    "pointerdown",
    () => {
      beginAdjustTargetHighlightInteraction();
    },
    true
  );

  container.addEventListener(
    "focusin",
    () => {
      syncAdjustTargetHighlightSuppression();
    },
    true
  );

  container.addEventListener(
    "focusout",
    () => {
      window.setTimeout(() => {
        syncAdjustTargetHighlightSuppression();
      }, 0);
    },
    true
  );
}

function isChatContextPickerUiNode(node) {
  if (!(node instanceof Node)) {
    return false;
  }

  const element = node instanceof Element ? node : node.parentElement;
  return Boolean(
    element?.closest?.(
      '[data-chat-context-picker-ui="true"], #chat-context-picker-toolbar, #chat-context-picker-overlay-layer'
    )
  );
}

function isHoverLockEvent(event) {
  if (!state.hoverLock) {
    return false;
  }

  if (event.type === "mousemove" || event.type === "pointermove") {
    if (state.fillPopoverDragSession || state.numberDragSession) {
      return false;
    }
    return isChatContextPickerUiNode(event.target);
  }

  if (!isChatContextPickerUiNode(event.relatedTarget)) {
    return false;
  }

  return !isChatContextPickerUiNode(event.target);
}

function handleHoverLockLeaveEvent(event) {
  if (!isHoverLockEvent(event)) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation?.();
}

function copyComputedStyleTree(sourceRoot, cloneRoot) {
  const queue = [[sourceRoot, cloneRoot]];
  let copied = 0;

  while (queue.length && copied < 300) {
    const [source, clone] = queue.shift();
    if (!(source instanceof Element) || !(clone instanceof Element)) {
      continue;
    }

    const styles = window.getComputedStyle(source);
    for (let index = 0; index < styles.length; index += 1) {
      const prop = styles[index];
      clone.style.setProperty(prop, styles.getPropertyValue(prop), styles.getPropertyPriority(prop));
    }

    const sourceChildren = [...source.children];
    const cloneChildren = [...clone.children];
    sourceChildren.forEach((sourceChild, index) => {
      const cloneChild = cloneChildren[index];
      if (cloneChild instanceof Element) {
        queue.push([sourceChild, cloneChild]);
      }
    });
    copied += 1;
  }
}

function createHoverLockMirrorEntry(targetElement, { append = true } = {}) {
  const rect = targetElement.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return null;
  }

  const wrapper = document.createElement("div");
  wrapper.dataset.chatContextPickerUi = "true";
  wrapper.style.position = "absolute";
  wrapper.style.left = `${rect.left + window.scrollX}px`;
  wrapper.style.top = `${rect.top + window.scrollY}px`;
  wrapper.style.width = `${rect.width}px`;
  wrapper.style.height = `${rect.height}px`;
  wrapper.style.margin = "0";
  wrapper.style.padding = "0";
  wrapper.style.border = "0";
  wrapper.style.pointerEvents = "none";
  wrapper.style.overflow = "visible";
  wrapper.style.zIndex = "2147483645";

  const clone = targetElement.cloneNode(true);
  if (!(clone instanceof Element)) {
    return null;
  }

  copyComputedStyleTree(targetElement, clone);
  clone.style.position = "static";
  clone.style.left = "auto";
  clone.style.top = "auto";
  clone.style.right = "auto";
  clone.style.bottom = "auto";
  clone.style.margin = "0";
  clone.style.transform = "none";
  clone.style.pointerEvents = "none";
  clone.style.boxSizing = "border-box";
  clone.style.width = `${rect.width}px`;
  clone.style.height = `${rect.height}px`;
  wrapper.appendChild(clone);
  if (append) {
    document.documentElement.appendChild(wrapper);
  }

  return { wrapper, clone };
}

function rectsIntersect(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function getHoverLockFloatingMirrorCandidates(targetElement) {
  const targetRect = targetElement.getBoundingClientRect();
  const searchRect = {
    left: targetRect.left - 420,
    top: targetRect.top - 420,
    right: targetRect.right + 420,
    bottom: targetRect.bottom + 420
  };

  return [...document.body.querySelectorAll("*")]
    .slice(0, 2000)
    .filter((element) => {
      if (
        !(element instanceof Element) ||
        element === targetElement ||
        targetElement.contains(element) ||
        element.contains(targetElement) ||
        isChatContextPickerUiNode(element)
      ) {
        return false;
      }

      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0 || !rectsIntersect(rect, searchRect)) {
        return false;
      }

      const styles = window.getComputedStyle(element);
      if (styles.display === "none" || styles.visibility === "hidden" || Number.parseFloat(styles.opacity || "1") <= 0) {
        return false;
      }

      return ["fixed", "absolute", "sticky"].includes(styles.position) || styles.zIndex !== "auto";
    })
    .filter((element, index, candidates) => !candidates.some((other, otherIndex) => otherIndex < index && other.contains(element)))
    .sort((a, b) => {
      const aRect = a.getBoundingClientRect();
      const bRect = b.getBoundingClientRect();
      return aRect.width * aRect.height - bRect.width * bRect.height;
    })
    .slice(0, 6);
}

function createHoverLockMirror(targetElement, { append = true } = {}) {
  const primary = createHoverLockMirrorEntry(targetElement, { append });
  if (!primary) {
    return null;
  }

  return {
    ...primary,
    extraMirrors: getHoverLockFloatingMirrorCandidates(targetElement)
      .map((candidate) => createHoverLockMirrorEntry(candidate, { append }))
      .filter(Boolean)
  };
}

function removeHoverLockMirror(mirror) {
  mirror?.wrapper?.remove();
  mirror?.extraMirrors?.forEach((extraMirror) => {
    extraMirror.wrapper?.remove();
  });
}

function appendHoverLockMirror(mirror) {
  if (!mirror) {
    return;
  }

  mirror.wrapper && document.documentElement.appendChild(mirror.wrapper);
  mirror.extraMirrors?.forEach((extraMirror) => {
    extraMirror.wrapper && document.documentElement.appendChild(extraMirror.wrapper);
  });
}

function prepareHoverLockSnapshot(target) {
  const targetElement = target ? getTargetElement(target) : null;
  if (!(targetElement instanceof Element)) {
    clearHoverLockSnapshot();
    return;
  }

  if (state.hoverLockSnapshot?.targetElement === targetElement) {
    return;
  }

  clearHoverLockSnapshot();
  state.hoverLockSnapshot = {
    targetElement,
    mirror: createHoverLockMirror(targetElement, { append: false })
  };
}

function clearHoverLockSnapshot() {
  if (!state.hoverLockSnapshot) {
    return;
  }

  removeHoverLockMirror(state.hoverLockSnapshot.mirror);
  state.hoverLockSnapshot = null;
}

function syncHoverLockMirrorFromTarget() {
  const lock = state.hoverLock;
  if (!lock?.mirror?.clone || !(lock.targetElement instanceof Element)) {
    return;
  }

  const rect = lock.targetElement.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return;
  }

  ADJUSTABLE_STYLE_PROPS.forEach((prop) => {
    lock.mirror.clone.style[prop] = lock.targetElement.style[prop] || lock.mirror.baselineSelf[prop] || "";
  });

  const sourceChildren = [...lock.targetElement.children];
  const cloneChildren = [...lock.mirror.clone.children];
  sourceChildren.forEach((sourceChild, index) => {
    const cloneChild = cloneChildren[index];
    const baseline = lock.mirror.baselineChildren[index] || {};
    if (!(cloneChild instanceof Element)) {
      return;
    }
    ADJUSTABLE_CHILD_MARGIN_PROPS.forEach((prop) => {
      cloneChild.style[prop] = sourceChild.style[prop] || baseline[prop] || "";
    });
  });
}

function endHoverLock() {
  if (!state.hoverLock) {
    return;
  }

  state.hoverLock.release();
  if (state.hoverLock.target?.adjustPreserveSelection && state.hoverLock.mirror) {
    removeHoverLockMirror(state.hoverLock.mirror);
    state.hoverLock.target.adjustPreserveMirror = state.hoverLock.mirror;
  } else {
    removeHoverLockMirror(state.hoverLock.mirror);
  }
  state.hoverLock = null;
}

function beginHoverLockForTarget(target, source = "adjust") {
  const targetElement = target ? getTargetElement(target) : null;
  if (!(targetElement instanceof Element)) {
    endHoverLock();
    return;
  }

  if (state.hoverLock?.targetElement === targetElement) {
    return;
  }

  endHoverLock();
  const eventTypes = ["mouseout", "mouseleave", "pointerout", "pointerleave", "mousemove", "pointermove"];
  eventTypes.forEach((eventType) => {
    document.addEventListener(eventType, handleHoverLockLeaveEvent, true);
    window.addEventListener(eventType, handleHoverLockLeaveEvent, true);
  });
  const snapshot = state.hoverLockSnapshot?.targetElement === targetElement ? state.hoverLockSnapshot : null;
  const mirror = target.adjustPreserveMirror || snapshot?.mirror || createHoverLockMirror(targetElement);
  target.adjustPreserveMirror = null;
  if (snapshot) {
    appendHoverLockMirror(mirror);
    state.hoverLockSnapshot = null;
  } else if (mirror) {
    appendHoverLockMirror(mirror);
  } else {
    clearHoverLockSnapshot();
  }
  state.hoverLock = {
    target,
    source,
    targetElement,
    mirror: mirror
      ? {
          ...mirror,
          baselineSelf: ADJUSTABLE_STYLE_PROPS.reduce((baseline, prop) => {
            baseline[prop] = mirror.clone.style[prop] || "";
            return baseline;
          }, {}),
          baselineChildren: [...mirror.clone.children].map((child) =>
            ADJUSTABLE_CHILD_MARGIN_PROPS.reduce((baseline, prop) => {
              baseline[prop] = child.style[prop] || "";
              return baseline;
            }, {})
          )
        }
      : null,
    release: () => {
      eventTypes.forEach((eventType) => {
        document.removeEventListener(eventType, handleHoverLockLeaveEvent, true);
        window.removeEventListener(eventType, handleHoverLockLeaveEvent, true);
      });
    }
  };
}

function beginHoverLockForAdjustTarget(target) {
  beginHoverLockForTarget(target, "adjust");
}

function beginHoverLockForPromptTarget(target) {
  beginHoverLockForTarget(target, "prompt");
}

function getPromptSuggestions(target) {
  const element = getTargetElement(target);
  const tag = element.tagName.toLowerCase();

  if (target.kind === "text" || /^(span|p|label|strong|em|small|h1|h2|h3|h4|h5|h6|li|a)$/.test(tag)) {
    return [
      "替换文案为",
      "修改字号为",
      "修改字重为",
      "修改颜色为",
      "修改行高为",
      "修改对齐方式为"
    ];
  }

  if (/^(button|a)$/.test(tag) || element.getAttribute("role") === "button") {
    return [
      "替换按钮文案为",
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
      "替换图标为",
      "修改图片位置为",
      "增加描边效果"
    ];
  }

  if (/^(input|textarea|select)$/.test(tag)) {
    return [
      "替换输入框文案为",
      "替换 placeholder 为",
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

function parseManualPromptInstruction(rawPrompt) {
  const prompt = String(rawPrompt || "").trim();
  if (!prompt) {
    return null;
  }

  const replacePatterns = [
    /^(?:请\s*)?(?:把|将)(?:这个|它|当前(?:元素|内容|文本|文案|图标)?)\s*(?:替换为|替换成|换成|改成)\s*([\s\S]+)$/u,
    /^(?:请\s*)?(?:替换为|替换成)\s*([\s\S]+)$/u,
    /^(?:请\s*)?用\s*([\s\S]+?)\s*替换(?:这个|它|当前(?:元素|内容|文本|文案|图标)?)$/u
  ];

  for (const pattern of replacePatterns) {
    const match = prompt.match(pattern);
    if (!match) {
      continue;
    }

    const material = String(match[1] || "").trim();
    if (!material) {
      break;
    }

    return {
      kind: "replace",
      material,
      isLongMaterial: material.includes("\n") || material.length >= 40
    };
  }

  return {
    kind: "instruction",
    text: prompt
  };
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

  let element = target.element;
  let rect = element.getBoundingClientRect();
  if (
    (rect.width <= 0 || rect.height <= 0) &&
    state.hoverLock?.targetElement === target.element &&
    state.hoverLock?.mirror?.clone instanceof Element
  ) {
    element = state.hoverLock.mirror.clone;
    rect = element.getBoundingClientRect();
  }

  if ((rect.width <= 0 || rect.height <= 0) && target.adjustPreservePageRect) {
    rect = {
      left: target.adjustPreservePageRect.left - window.scrollX,
      top: target.adjustPreservePageRect.top - window.scrollY,
      right: target.adjustPreservePageRect.right - window.scrollX,
      bottom: target.adjustPreservePageRect.bottom - window.scrollY,
      width: target.adjustPreservePageRect.width,
      height: target.adjustPreservePageRect.height,
      x: target.adjustPreservePageRect.left - window.scrollX,
      y: target.adjustPreservePageRect.top - window.scrollY
    };
  }

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

function getTargetInstructionParts(target) {
  return {
    manualPrompt: (target.promptText || "").trim(),
    layoutPrompt: (target.layoutPromptText || "").trim(),
    adjustPrompt: (target.adjustPromptText || "").trim()
  };
}

function getTargetInstructionEntries(target) {
  const parts = getTargetInstructionParts(target);
  const entries = [];

  if (parts.manualPrompt) {
    entries.push({ type: "manual", label: "内容要求", text: parts.manualPrompt });
  }

  if (parts.layoutPrompt) {
    entries.push({ type: "layout", label: "排版要求", text: parts.layoutPrompt });
  }

  if (parts.adjustPrompt) {
    entries.push({ type: "adjust", label: "调整要求", text: parts.adjustPrompt });
  }

  return entries;
}

function getTargetInstructionText(target) {
  return getTargetInstructionEntries(target)
    .map((entry) => entry.text)
    .filter(Boolean)
    .join("\n");
}

function buildSelectionItemPromptMarkup(target) {
  const entries = getTargetInstructionEntries(target);
  if (!entries.length) {
    return "";
  }

  const summary = entries
    .map((entry) => {
      if (entry.type === "manual") {
        const instruction = parseManualPromptInstruction(entry.text);
        return instruction?.kind === "replace" ? "内容替换" : "内容变动";
      }
      if (entry.type === "layout") {
        return "排版变动";
      }
      if (entry.type === "adjust") {
        return `调整变动：${truncate(entry.text, 80)}`;
      }
      return "";
    })
    .filter(Boolean)
    .join(" / ");

  return `
    <div class="chat-context-picker-item-change-summary">${escapeHtml(summary)}</div>
  `;
}

function buildItemRequirementBlocks(item, isLayoutMode) {
  const blocks = [];

  if (item.manualPrompt) {
    const instruction = parseManualPromptInstruction(item.manualPrompt);
    if (instruction?.kind === "replace") {
      blocks.push(
        [
          "#### 内容替换指令",
          "- 指令类型：替换",
          "- 替换素材：",
          "```text",
          instruction.material,
          "```",
          "- 执行约束：把这段内容当作替换素材或输入来源，不要把它额外包装成新的 UI 展示区域，除非用户明确要求展示它。"
        ].join("\n")
      );
    } else {
      blocks.push(["#### 额外内容要求", item.manualPrompt].join("\n"));
    }
  }

  if (item.layoutPrompt) {
    blocks.push(["#### 排版模式要求", item.layoutPrompt].join("\n"));
  }

  if (item.adjustPrompt) {
    blocks.push(["#### 调整模式要求", item.adjustPrompt].join("\n"));
  }

  if (blocks.length) {
    return blocks.join("\n\n");
  }

  return isLayoutMode
    ? "该目标用于布局移动/顺序调整，请结合其他已选目标一起理解其移动位置或重排关系。"
    : "未提供具体修改提示词，请仅参考当前信息。";
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
  const instructionParts = getTargetInstructionParts(target);

  return {
    index,
    kind: target.kind,
    promptText: getTargetInstructionText(target),
    manualPrompt: instructionParts.manualPrompt,
    layoutPrompt: instructionParts.layoutPrompt,
    adjustPrompt: instructionParts.adjustPrompt,
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
      boxShadow: styles.boxShadow,
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
  syncHistoryButtons();

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

      return `
        <div class="chat-context-picker-item">
          <div class="chat-context-picker-item-top">
            <div class="chat-context-picker-item-label">${index + 1}. ${escapeHtml(getTargetLabel(target))}</div>
            <div class="chat-context-picker-item-actions">
              <button class="chat-context-picker-item-icon-button" type="button" data-action="remove-item" data-index="${index}" aria-label="删除条目" title="删除条目">
                <span class="chat-context-picker-item-icon">${icon("trash")}</span>
              </button>
              <button class="chat-context-picker-item-icon-button" type="button" data-action="copy-item" data-index="${index}" aria-label="复制条目" title="复制条目">
                <span class="chat-context-picker-item-icon">${icon("copy")}</span>
              </button>
            </div>
          </div>
          ${buildSelectionItemPromptMarkup(target)}
          <div class="chat-context-picker-item-meta">${kindLabel} · ${Math.round(displayRect.width)} × ${Math.round(displayRect.height)}</div>
          <div class="chat-context-picker-item-meta">${escapeHtml(truncate(cssPath(getTargetElement(target)), 180))}</div>
        </div>
      `;
    })
    .join("");
}

function cloneTarget(target) {
  return target ? { ...target } : target;
}

function snapshotSelection() {
  return state.selectedTargets.map(cloneTarget);
}

function areSelectionsEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((target, index) => {
    const other = b[index];
    return (
      other &&
      target.kind === other.kind &&
      isSameTarget(target, other) &&
      (target.promptText || "") === (other.promptText || "") &&
      (target.layoutPromptText || "") === (other.layoutPromptText || "") &&
      (target.adjustPromptText || "") === (other.adjustPromptText || "")
    );
  });
}

function openSelectionItemPrompt(index, anchorRect = null) {
  pruneSelectedTargets();
  if (!Number.isInteger(index) || index < 0 || index >= state.selectedTargets.length) {
    return;
  }

  closeAdjustPopover();
  openPromptPopover(state.selectedTargets[index], anchorRect);
}

function syncHistoryButtons() {
  const canUndo = state.historyPast.length > 0;
  const canRedo = state.historyFuture.length > 0;

  if (state.undoButton) {
    state.undoButton.disabled = !canUndo;
    state.undoButton.dataset.disabled = canUndo ? "false" : "true";
  }

  if (state.redoButton) {
    state.redoButton.disabled = !canRedo;
    state.redoButton.dataset.disabled = canRedo ? "false" : "true";
  }
}

function pushHistoryEntry(entry) {
  state.historyPast.push(entry);
  if (state.historyPast.length > 50) {
    state.historyPast.shift();
  }
  state.historyFuture = [];
  syncHistoryButtons();
}

function pushSelectionHistory(snapshot) {
  pushHistoryEntry({ type: "selection", snapshot });
}

function restoreSelectionSnapshot(snapshot) {
  state.selectedTargets = snapshot.filter(isLiveTarget).map(cloneTarget);

  if (state.promptTarget && !findSelectedTarget(state.promptTarget)) {
    closePromptPopover();
  }

  renderSelection();
  refreshHighlights();
}

function captureElementPosition(element) {
  return {
    parent: element?.parentNode || null,
    nextSibling: element?.nextSibling || null
  };
}

function describeElementForLayoutPrompt(element) {
  if (!(element instanceof Element)) {
    return "目标元素";
  }

  const target = createElementTarget(element);
  const previewText = getTargetPreviewText(target);
  if (previewText && previewText !== "空内容") {
    return `「${truncate(previewText, 28)}」`;
  }

  return `「${getElementDescriptor(element)}」`;
}

function describeContainerForLayoutPrompt(element) {
  if (!(element instanceof Element)) {
    return "目标容器";
  }

  return `「${getElementDescriptor(element)}」`;
}

function setTargetLayoutPrompt(target, value) {
  const persistedTarget = findSelectedTarget(target) || target;
  if (!persistedTarget) {
    return;
  }

  persistedTarget.layoutPromptText = value || "";
}

function applyLayoutInteractionPrompts(draggedTarget, dropPlan) {
  if (!draggedTarget || !dropPlan) {
    return;
  }

  if (dropPlan.operation === "swap" && dropPlan.targetElement) {
    const targetTarget = createElementTarget(dropPlan.targetElement);
    setTargetLayoutPrompt(
      draggedTarget,
      `与${describeElementForLayoutPrompt(dropPlan.targetElement)}交换位置。`
    );
    setTargetLayoutPrompt(
      targetTarget,
      `与${describeElementForLayoutPrompt(getTargetElement(draggedTarget))}交换位置。`
    );
    return;
  }

  if (dropPlan.operation === "insert") {
    if (dropPlan.targetElement && dropPlan.position) {
      setTargetLayoutPrompt(
        draggedTarget,
        `将该元素移动到${describeElementForLayoutPrompt(dropPlan.targetElement)}${
          dropPlan.position === "before" ? "之前" : "之后"
        }，并遵循目标容器当前的布局与对齐方式。`
      );
      return;
    }

    if (dropPlan.parent) {
      setTargetLayoutPrompt(
        draggedTarget,
        `将该元素移动到${describeContainerForLayoutPrompt(
          dropPlan.parent
        )}容器末尾，并遵循该容器当前的布局与对齐方式。`
      );
    }
  }
}

function captureHistoryInverseEntry(entry) {
  if (!entry) {
    return null;
  }

  if (entry.type === "selection") {
    return { type: "selection", snapshot: snapshotSelection() };
  }

  if (entry.type === "dom-move") {
    return {
      type: "dom-move",
      element: entry.element,
      position: captureElementPosition(entry.element),
      selectionSnapshot: snapshotSelection()
    };
  }

  if (entry.type === "dom-positions") {
    return {
      type: "dom-positions",
      positions: entry.positions.map(({ element }) => ({
        element,
        position: captureElementPosition(element)
      })),
      selectionSnapshot: snapshotSelection()
    };
  }

  if (entry.type === "style-inline") {
    return {
      type: "style-inline",
      element: entry.element,
      snapshot: captureAdjustableStyleSnapshot(entry.element)
    };
  }

  if (entry.type === "dom-remove") {
    return {
      type: "dom-restore",
      element: entry.element,
      position: captureElementPosition(entry.element),
      selectionSnapshot: snapshotSelection()
    };
  }

  if (entry.type === "dom-restore") {
    return {
      type: "dom-remove",
      element: entry.element,
      selectionSnapshot: snapshotSelection()
    };
  }

  return null;
}

function restoreElementPosition(element, position) {
  if (!element || !position?.parent) {
    return false;
  }

  const { parent, nextSibling } = position;
  if (nextSibling && nextSibling.parentNode === parent) {
    parent.insertBefore(element, nextSibling);
  } else {
    parent.appendChild(element);
  }
  return true;
}

function restoreHistoryEntry(entry) {
  if (!entry) {
    return false;
  }

  if (entry.type === "selection") {
    restoreSelectionSnapshot(entry.snapshot);
    return true;
  }

  if (entry.type === "dom-move") {
    const restored = restoreElementPosition(entry.element, entry.position);
    if (entry.selectionSnapshot) {
      restoreSelectionSnapshot(entry.selectionSnapshot);
    } else {
      renderSelection();
      refreshHighlights();
    }
    return restored;
  }

  if (entry.type === "dom-positions") {
    for (const item of entry.positions) {
      restoreElementPosition(item.element, item.position);
    }
    if (entry.selectionSnapshot) {
      restoreSelectionSnapshot(entry.selectionSnapshot);
    } else {
      renderSelection();
      refreshHighlights();
    }
    return true;
  }

  if (entry.type === "style-inline") {
    applyAdjustableStyleSnapshot(entry.element, entry.snapshot);
    const restoredTarget = state.selectedTargets.find(
      (target) => isElementTarget(target) && getTargetElement(target) === entry.element
    );
    if (restoredTarget) {
      refreshAdjustPromptText(restoredTarget);
    }
    if (state.adjustTarget && isSameTarget(state.adjustTarget, createElementTarget(entry.element))) {
      syncAdjustPopoverFromTarget(state.adjustTarget);
    }
    renderSelection();
    refreshHighlights();
    return true;
  }

  if (entry.type === "dom-remove") {
    if (entry.element?.parentNode) {
      entry.element.parentNode.removeChild(entry.element);
    }
    if (entry.selectionSnapshot) {
      restoreSelectionSnapshot(entry.selectionSnapshot);
    } else {
      renderSelection();
      refreshHighlights();
    }
    return true;
  }

  if (entry.type === "dom-restore") {
    const restored = restoreElementPosition(entry.element, entry.position);
    if (entry.selectionSnapshot) {
      restoreSelectionSnapshot(entry.selectionSnapshot);
    } else {
      renderSelection();
      refreshHighlights();
    }
    return restored;
  }

  return false;
}

function doesSnapshotContainAnyTarget(snapshot, targets) {
  if (!Array.isArray(snapshot) || !snapshot.length || !targets.length) {
    return false;
  }

  return snapshot.some((snapshotTarget) => targets.some((target) => isSameTarget(snapshotTarget, target)));
}

function isHistoryEntryRelatedToTargets(entry, targets) {
  if (!entry || !targets.length) {
    return false;
  }

  if (doesSnapshotContainAnyTarget(entry.selectionSnapshot, targets)) {
    return true;
  }

  const selectedElements = targets
    .filter(isElementTarget)
    .map((target) => getTargetElement(target))
    .filter((element) => element instanceof Element);

  if (!selectedElements.length) {
    return false;
  }

  if (entry.type === "style-inline" || entry.type === "dom-move" || entry.type === "dom-remove" || entry.type === "dom-restore") {
    return selectedElements.includes(entry.element);
  }

  if (entry.type === "dom-positions") {
    return entry.positions?.some((item) => selectedElements.includes(item.element)) || false;
  }

  return false;
}

function revertSelectedTargetChanges(targets) {
  if (!targets.length || !state.historyPast.length) {
    return;
  }

  const revertedIndexes = [];

  for (let index = state.historyPast.length - 1; index >= 0; index -= 1) {
    const entry = state.historyPast[index];
    if (!isHistoryEntryRelatedToTargets(entry, targets)) {
      continue;
    }

    const reversibleEntry =
      entry && Object.prototype.hasOwnProperty.call(entry, "selectionSnapshot")
        ? { ...entry, selectionSnapshot: null }
        : entry;
    restoreHistoryEntry(reversibleEntry);
    revertedIndexes.push(index);
  }

  if (!revertedIndexes.length) {
    return;
  }

  const revertedIndexSet = new Set(revertedIndexes);
  state.historyPast = state.historyPast.filter((_, index) => !revertedIndexSet.has(index));
  state.historyFuture = [];
  syncHistoryButtons();
}

function undoSelectionHistory() {
  if (!state.historyPast.length) {
    return;
  }

  const previous = state.historyPast.pop();
  if (!previous) {
    return;
  }

  const inverse = captureHistoryInverseEntry(previous);
  if (inverse) {
    state.historyFuture.push(inverse);
  }

  restoreHistoryEntry(previous);
  syncHistoryButtons();
  showToast("已撤销上一步操作");
}

function redoSelectionHistory() {
  if (!state.historyFuture.length) {
    return;
  }

  const next = state.historyFuture.pop();
  if (!next) {
    return;
  }

  const inverse = captureHistoryInverseEntry(next);
  if (inverse) {
    state.historyPast.push(inverse);
  }

  restoreHistoryEntry(next);
  syncHistoryButtons();
  showToast("已恢复下一步操作");
}
