// Runtime event handling, activation, and clipboard flows stay in the final stage.
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

  if (state.selectionMode === "layout" || state.selectionMode === "adjust") {
    return createElementTarget(candidateElement);
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
  const previous = snapshotSelection();

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

  if (!areSelectionsEqual(previous, state.selectedTargets)) {
    pushSelectionHistory(previous);
  }
  renderSelection();
  refreshHighlights();
}

function addTargetSelection(target) {
  pruneSelectedTargets();
  if (hasSelectedTarget(target)) {
    return findSelectedTarget(target) || target;
  }

  const previous = snapshotSelection();
  state.selectedTargets.push(target);
  if (!areSelectionsEqual(previous, state.selectedTargets)) {
    pushSelectionHistory(previous);
  }
  renderSelection();
  refreshHighlights();
  return findSelectedTarget(target) || target;
}

function clearSelection() {
  if (!state.selectedTargets.length) {
    return;
  }

  const previous = snapshotSelection();
  closePromptPopover();
  closeAdjustPopover();
  revertSelectedTargetChanges(previous);
  state.selectedTargets = [];
  state.hoveredTarget = null;
  state.hoveredSelectedTarget = null;
  pushSelectionHistory(previous);
  renderSelection();
  refreshHighlights();
  showToast("已清空选择");
}

function removeSelectionAtIndex(index) {
  if (!Number.isInteger(index) || index < 0 || index >= state.selectedTargets.length) {
    return;
  }

  const previous = snapshotSelection();
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

  if (state.adjustTarget && isSameTarget(state.adjustTarget, removedTarget)) {
    closeAdjustPopover();
  }

  pushSelectionHistory(previous);
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
  const isLayoutMode = state.selectionMode === "layout" || items.some((item) => item.layoutPrompt);
  const hasAdjustInstructions = items.some((item) => item.adjustPrompt);
  const layoutSummary = isLayoutMode
    ? [
        "### 布局调整说明",
        "- 当前任务类型：移动已选元素的位置 / 调整这些元素的排列顺序",
        `- 当前选中顺序：${items.map((item) => `目标 ${item.index}`).join(" -> ") || "无"}`,
        "- 如果没有额外提示词，默认优先理解为对这些目标做移动位置或重排，而不是仅修改样式",
        ""
      ]
    : [];
  const adjustSummary = hasAdjustInstructions
    ? [
        "### 调整模式说明",
        "- 带有“调整模式要求”的目标，已经包含具体的样式调整参数。",
        "- 请优先按这些明确参数修改尺寸、对齐、圆角、填充、阴影等视觉属性。",
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
    ...adjustSummary,
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
      buildItemRequirementBlocks(item, isLayoutMode)
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
  if (!state.active) {
    return;
  }

  updateHoveredNumberInput(event.target, event.altKey);

  if (state.fillPopoverDragSession) {
    if (!state.fillPopoverDragSession.managedLocally) {
      event.preventDefault();
      updateFillPopoverDrag(event, false);
    }
    return;
  }

  if (state.numberDragSession) {
    event.preventDefault();
    updateNumberInputDrag(event);
    return;
  }

  if (isPromptOpen()) {
    return;
  }

  if (isAdjustOpen()) {
    return;
  }

  if (state.selectionMode === "layout" && state.dragSession) {
    state.dragSession.clientX = event.clientX;
    state.dragSession.clientY = event.clientY;
    updateDragPreviewPosition(state.dragSession);
    const dropPlan =
      state.dragSession.dragMode === "selected-only"
        ? getSelectedOnlyLayoutDropPlan(event.clientX, event.clientY, state.dragSession.draggedTarget)
        : getLayoutDropPlan(event.clientX, event.clientY, state.dragSession.draggedTarget);
    const dropTarget = dropPlan?.highlightTarget || null;
    const dropPosition = dropPlan?.position || null;
    if (
      !isSameTarget(dropTarget, state.dragSession.dropTarget) ||
      dropPosition !== state.dragSession.dropPosition ||
      dropPlan?.operation !== state.dragSession.dropPlan?.operation
    ) {
      state.dragSession.dropPlan = dropPlan;
      state.dragSession.dropTarget = dropTarget;
      state.dragSession.dropPosition = dropPosition;
    }
    if (state.dragSession.dragMode === "free") {
      moveLayoutPlaceholder(state.dragSession, dropPlan);
    }
    refreshHighlights();
    return;
  }

  if (isToolbarElement(event.target)) {
    return;
  }

  if (
    state.selectionMode !== "select" &&
    state.selectionMode !== "layout" &&
    state.selectionMode !== "adjust"
  ) {
    return;
  }

  const layoutSelectedTarget =
    state.selectionMode === "layout" ? findSelectedLayoutTargetForNode(event.target) : null;
  const target = layoutSelectedTarget || normalizeSelectableTarget(event.target, event.clientX, event.clientY);
  if (!target) {
    clearHover();
    return;
  }

  setHover(target);

  if (state.selectionMode === "layout" && hasSelectedTarget(target)) {
    setLayoutInsertHint(getLayoutInsertHintForPointer(target, event.clientX, event.clientY));
  } else {
    setLayoutInsertHint(null);
  }
}

function handlePointerDown(event) {
  if (!state.active || event.button !== 0) {
    return;
  }

  const numberInput = event.target instanceof Element ? event.target.closest('input[type="number"]') : null;
  if (event.altKey && numberInput instanceof HTMLInputElement && beginNumberInputDrag(numberInput, event)) {
    event.preventDefault();
    event.stopPropagation();
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

  if (isAdjustOpen()) {
    const clickedInsideAdjust = Boolean(event.target?.closest?.(".chat-context-picker-adjust-popover"));
    const clickedInsideSizeMenu = Boolean(event.target?.closest?.(".chat-context-picker-size-menu"));
    const clickedInsideGapMenu = Boolean(event.target?.closest?.(".chat-context-picker-gap-menu"));
    const clickedInsideFillPopover = Boolean(event.target?.closest?.(".chat-context-picker-fill-popover"));
    const clickedInsideShadowPopover = Boolean(event.target?.closest?.(".chat-context-picker-shadow-popover"));
    if (clickedInsideAdjust || clickedInsideSizeMenu || clickedInsideGapMenu || clickedInsideFillPopover || clickedInsideShadowPopover) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    state.suppressClickUntil = Date.now() + 400;
    closeAdjustPopover();
    return;
  }

  if (
    state.selectionMode !== "select" &&
    state.selectionMode !== "layout" &&
    state.selectionMode !== "adjust"
  ) {
    return;
  }

  if (isToolbarElement(event.target)) {
    return;
  }

  if (state.selectionMode === "layout") {
    const selectedContainingTarget = findSelectedLayoutTargetForNode(event.target);
    if (selectedContainingTarget) {
      const index = state.selectedTargets.findIndex((item) => isSameTarget(item, selectedContainingTarget));
      if (index >= 0) {
        event.preventDefault();
        event.stopPropagation();
        state.suppressClickUntil = Date.now() + 400;
        startLayoutDrag(index, event, "free");
        return;
      }
    }
  }

  const target = normalizeSelectableTarget(event.target, event.clientX, event.clientY);
  if (!target) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  state.suppressClickUntil = Date.now() + 400;

  if (state.selectionMode === "adjust") {
    const persistedTarget = addTargetSelection(target);
    state.hoveredTarget = null;
    state.hoveredSelectedTarget = persistedTarget;
    openAdjustPopover(persistedTarget);
    showToast("已打开调整面板");
    return;
  }

  if (state.selectionMode === "layout" && hasSelectedTarget(target)) {
    const index = state.selectedTargets.findIndex((item) => isSameTarget(item, target));
    if (index >= 0) {
      startLayoutDrag(index, event, "free");
      return;
    }
  }

  toggleTargetSelection(target);
}

function handlePointerUp(event) {
  if (!state.active) {
    return;
  }

  if (state.fillPopoverDragSession) {
    if (!state.fillPopoverDragSession.managedLocally) {
      event.preventDefault();
      finishFillPopoverDrag(event);
    }
    return;
  }

  if (state.numberDragSession) {
    event.preventDefault();
    finishNumberInputDrag();
    return;
  }

  if (state.selectionMode !== "layout") {
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
  const fillPopoverHasFocus =
    state.fillPopover?.dataset.open === "true" &&
    document.activeElement instanceof Element &&
    state.fillPopover.contains(document.activeElement);

  if (state.highlightsVisible) {
    refreshHighlights();
  }
  if (!fillPopoverHasFocus && isAdjustOpen() && state.adjustTarget) {
    positionAdjustPopover(state.adjustTarget);
  }
  if (!fillPopoverHasFocus && state.fillPopover?.dataset.open === "true" && state.adjustTarget) {
    const row =
      state.fillPopoverOverlayIndex !== null
        ? state.adjustPopover?.querySelector?.(`[data-adjust-row="fill-overlay"][data-overlay-index="${state.fillPopoverOverlayIndex}"]`)
        : state.adjustPopover?.querySelector?.('[data-adjust-row="fill"]');
    if (row && !row.hidden) {
      state.fillPopoverAnchorRect = row.getBoundingClientRect();
    }
    positionFillPopover(state.fillPopoverAnchorRect);
  }
  if (state.sizeMenu?.dataset.open === "true" && state.adjustTarget) {
    const row =
      state.sizeMenuProp === "height"
        ? state.adjustControls?.heightRow
        : state.adjustControls?.widthRow;
    if (row) {
      state.sizeMenuAnchorRect = row.getBoundingClientRect();
    }
    positionSizeMenu(state.sizeMenuAnchorRect);
  }
  if (state.gapMenu?.dataset.open === "true" && state.adjustTarget) {
    const row = state.adjustControls?.gapRow;
    if (row) {
      state.gapMenuAnchorRect = row.getBoundingClientRect();
    }
    positionGapMenu(state.gapMenuAnchorRect);
  }
  if (state.shadowPopover?.dataset.open === "true" && state.adjustTarget) {
    const row =
      state.shadowPopoverOverlayIndex !== null
        ? state.adjustPopover?.querySelector?.(`[data-adjust-row="shadow-overlay"][data-overlay-index="${state.shadowPopoverOverlayIndex}"]`)
        : null;
    if (row && !row.hidden) {
      state.shadowPopoverAnchorRect = row.getBoundingClientRect();
    }
    positionShadowPopover(state.shadowPopoverAnchorRect);
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
  document.addEventListener("pointercancel", handlePointerUp, true);
  document.addEventListener("click", handleClick, true);
  document.addEventListener("keydown", handleKeyDown, true);
  document.addEventListener("keyup", handleKeyUp, true);
  window.addEventListener("scroll", handleViewportChange, true);
  window.addEventListener("resize", handleViewportChange, true);
  window.addEventListener("blur", handleWindowBlur);
  showToast(`已开启${MODE_LABELS[state.selectionMode]}`);
}

function deactivatePicker() {
  state.active = false;
  state.hoveredTarget = null;
  state.hoveredSelectedTarget = null;
  setSelectedHighlightsVisible(false);
  setListOpen(false);
  closePromptPopover();
  closeAdjustPopover();
  finishNumberInputDrag();
  clearNumberInputHoverState();
  cleanupDragSessionArtifacts(state.dragSession);
  state.dragSession = null;
  document.removeEventListener("pointermove", handlePointerMove, true);
  document.removeEventListener("pointerdown", handlePointerDown, true);
  document.removeEventListener("pointerup", handlePointerUp, true);
  document.removeEventListener("pointercancel", handlePointerUp, true);
  document.removeEventListener("click", handleClick, true);
  document.removeEventListener("keydown", handleKeyDown, true);
  document.removeEventListener("keyup", handleKeyUp, true);
  window.removeEventListener("scroll", handleViewportChange, true);
  window.removeEventListener("resize", handleViewportChange, true);
  window.removeEventListener("blur", handleWindowBlur);

  if (state.toolbar) {
    state.toolbar.dataset.hidden = "true";
  }

  discardPromptChanges();
  showToast("已关闭选择模式");
}

function isTextEntryTarget(target) {
  if (!(target instanceof Element)) {
    return false;
  }

  if (target.closest('[contenteditable="true"]')) {
    return true;
  }

  const field = target.closest("textarea, input");
  if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) {
    return false;
  }

  if (field instanceof HTMLTextAreaElement) {
    return true;
  }

  return !["button", "checkbox", "color", "file", "hidden", "image", "radio", "range", "reset", "submit"].includes(field.type);
}

function handleKeyDown(event) {
  if (!state.active) {
    return;
  }

  state.altKeyPressed = event.altKey;
  syncNumberInputReadyCursor();

  if (event.key === "Escape") {
    event.preventDefault();
    if (isPromptOpen()) {
      discardPromptChanges();
      return;
    }
    if (isAdjustOpen()) {
      closeAdjustPopover();
      return;
    }
    if (state.listOpen) {
      setListOpen(false);
    } else {
      deactivatePicker();
    }
    return;
  }

  const isCopyCommand = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "c";
  const isPasteCommand = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "v";
  const hasAdjustLayerSelection = isAdjustOpen() && state.adjustLayerSelectionKeys.length;
  const isEditingText = isTextEntryTarget(event.target);

  if (isCopyCommand && hasAdjustLayerSelection) {
    event.preventDefault();
    copyAdjustLayerSelection();
    return;
  }

  if (isPasteCommand && hasAdjustLayerSelection && state.adjustLayerClipboard) {
    event.preventDefault();
    pasteAdjustLayerSelection();
    return;
  }

  if (isCopyCommand && state.selectedTargets.length) {
    event.preventDefault();
    copySelection();
    return;
  }

  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
    event.preventDefault();
    if (event.shiftKey) {
      redoSelectionHistory();
    } else {
      undoSelectionHistory();
    }
  }
}

function handleKeyUp(event) {
  if (!state.active) {
    return;
  }

  state.altKeyPressed = event.altKey;
  syncNumberInputReadyCursor();
}

function handleWindowBlur() {
  clearNumberInputHoverState();
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
