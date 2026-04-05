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
        return "内容变动";
      }
      if (entry.type === "layout") {
        return "排版变动";
      }
      if (entry.type === "adjust") {
        return "调整变动";
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
    blocks.push(["#### 额外内容要求", item.manualPrompt].join("\n"));
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
