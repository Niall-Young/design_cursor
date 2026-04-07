// Selection, hover, layout dragging, and prompt editing are grouped here.
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

function findSelectedLayoutTargetForNode(node) {
  const element = resolveElementTarget(node);
  if (!(element instanceof Element)) {
    return null;
  }

  const matches = state.selectedTargets
    .filter(isElementTarget)
    .filter((target) => target.element === element || target.element.contains(element))
    .map((target) => {
      const rect = mergeRects(getTargetClientRects(target));
      return rect ? { target, area: rect.width * rect.height } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.area - b.area);

  return matches[0]?.target || null;
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

function hasVisibleBox(element) {
  if (!(element instanceof Element)) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function getSelectableParent(element) {
  let current = element?.parentElement || null;

  while (current) {
    if (isSelectableElement(current)) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
}

function getSelectableHierarchyChildren(parent) {
  if (!(parent instanceof Element)) {
    return [];
  }

  return Array.from(parent.children).filter(
    (child) => isSelectableElement(child) && hasVisibleBox(child)
  );
}

function rememberSelectableChild(parent, child) {
  if (
    !(parent instanceof Element) ||
    !(child instanceof Element) ||
    child.parentElement !== parent ||
    !isSelectableElement(child)
  ) {
    return;
  }

  state.hierarchyChildMemory.set(parent, child);
}

function getDirectSelectableChildForDescendant(parent, descendant) {
  if (!(parent instanceof Element) || !(descendant instanceof Element)) {
    return null;
  }

  let current = descendant;
  let directChild = null;

  while (current && current !== parent) {
    directChild = current;
    current = current.parentElement;
  }

  if (current !== parent || !(directChild instanceof Element)) {
    return null;
  }

  return directChild.parentElement === parent && isSelectableElement(directChild) ? directChild : null;
}

function getSelectableChild(parent, context = {}) {
  if (!(parent instanceof Element)) {
    return null;
  }

  const directChildren = getSelectableHierarchyChildren(parent);
  if (!directChildren.length) {
    return null;
  }

  const rememberedChild = context.rememberedChild || state.hierarchyChildMemory.get(parent) || null;
  if (
    rememberedChild instanceof Element &&
    rememberedChild.parentElement === parent &&
    directChildren.includes(rememberedChild)
  ) {
    return rememberedChild;
  }

  const clientX = Number.isFinite(context.clientX) ? context.clientX : state.lastPointerClientX;
  const clientY = Number.isFinite(context.clientY) ? context.clientY : state.lastPointerClientY;

  if (Number.isFinite(clientX) && Number.isFinite(clientY)) {
    const stack = document.elementsFromPoint(clientX, clientY);
    for (const element of stack) {
      if (!(element instanceof Element) || isToolbarElement(element)) {
        continue;
      }

      const directChild = getDirectSelectableChildForDescendant(parent, element);
      if (directChild && directChildren.includes(directChild)) {
        return directChild;
      }
    }
  }

  return directChildren[0] || null;
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

  if (
    state.hoverLock?.targetElement === target.element &&
    state.hoverLock?.mirror?.clone instanceof Element
  ) {
    return true;
  }

  if (target.adjustPreserveSelection && (target.adjustPromptText || target.promptText || target.layoutPromptText)) {
    return true;
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

  if (state.layoutInsertHint?.target && !isLiveTarget(state.layoutInsertHint.target)) {
    state.layoutInsertHint = null;
  }

  if (state.dragSession) {
    const draggedStillLive = isLiveTarget(state.dragSession.draggedTarget);
    const dropStillLive = !state.dragSession.dropTarget || isLiveTarget(state.dragSession.dropTarget);
    if (!draggedStillLive || !dropStillLive) {
      cleanupDragSessionArtifacts(state.dragSession);
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

  if (variant === "selected" && state.selectionMode === "layout" && isElementTarget(target)) {
    const rect = mergeRects(rects);
    if (!rect) {
      return;
    }

    const inflated = inflateRect(rect, 1);
    const overlay = document.createElement("div");
    overlay.className =
      "chat-context-picker-overlay-rect chat-context-picker-overlay-selected chat-context-picker-overlay-selected-layout";
    overlay.style.left = `${inflated.left}px`;
    overlay.style.top = `${inflated.top}px`;
    overlay.style.width = `${inflated.width}px`;
    overlay.style.height = `${inflated.height}px`;
    overlay.style.borderRadius = "0";

    for (const position of ["top-left", "top-right", "bottom-left", "bottom-right"]) {
      const corner = document.createElement("div");
      corner.className = `chat-context-picker-overlay-corner chat-context-picker-overlay-corner-${position}`;
      overlay.appendChild(corner);
    }

    state.overlayLayer.appendChild(overlay);
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

function drawPromptBadge(target, index) {
  const rect = mergeRects(getTargetClientRects(target));
  if (!rect) {
    return;
  }

  const badgePosition = getPromptBadgePosition(rect);

  const button = document.createElement("button");
  button.type = "button";
  button.className = "chat-context-picker-overlay-edit-badge";
  button.dataset.chatContextPickerUi = "true";
  button.setAttribute("aria-label", `编辑目标 ${index + 1}`);
  button.setAttribute("title", `编辑目标 ${index + 1}`);
  button.textContent = String(index + 1);
  button.style.left = `${badgePosition.left}px`;
  button.style.top = `${badgePosition.top}px`;

  const bringBadgeToFront = () => {
    if (button.parentElement === state.overlayLayer) {
      state.overlayLayer.appendChild(button);
    }
  };

  button.addEventListener("pointerenter", bringBadgeToFront);
  button.addEventListener("focus", bringBadgeToFront);

  button.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
    bringBadgeToFront();
  });

  const openBadgeEditor = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (state.selectionMode === "adjust") {
      openAdjustPopover(target, button.getBoundingClientRect());
    } else {
      openPromptPopover(target, button.getBoundingClientRect());
    }
  };

  button.addEventListener("pointerup", openBadgeEditor);
  button.addEventListener("click", openBadgeEditor);

  state.overlayLayer.appendChild(button);
}

function getPromptBadgePosition(rect) {
  const badgeSize = 28;
  const badgeHalf = badgeSize / 2;
  const viewportPadding = 12;
  const cornerOffset = 8;
  const sideOffset = 10;
  const minLeft = viewportPadding;
  const maxLeft = Math.max(viewportPadding, window.innerWidth - badgeSize - viewportPadding);
  const minTop = viewportPadding;
  const maxTop = Math.max(viewportPadding, window.innerHeight - badgeSize - viewportPadding);
  const clampHorizontal = (value) => Math.max(minLeft, Math.min(value, maxLeft));
  const clampVertical = (value) => Math.max(minTop, Math.min(value, maxTop));
  const verticalCenter = rect.top + (rect.height - badgeSize) / 2;
  const horizontalCenter = rect.left + (rect.width - badgeSize) / 2;
  const rightAligned = rect.right + cornerOffset - badgeHalf;
  const leftAligned = rect.left - cornerOffset - badgeHalf;
  const topAligned = rect.top - cornerOffset - badgeHalf;
  const bottomAligned = rect.bottom + cornerOffset - badgeHalf;
  const rightSide = rect.right + sideOffset - badgeHalf;
  const leftSide = rect.left - sideOffset - badgeHalf;
  const topSide = rect.top - sideOffset - badgeHalf;
  const bottomSide = rect.bottom + sideOffset - badgeHalf;
  const candidateSeeds = [
    {
      name: "right-top",
      left: rightAligned,
      top: topAligned
    },
    {
      name: "right-center",
      left: rightSide,
      top: verticalCenter
    },
    {
      name: "right-bottom",
      left: rightAligned,
      top: bottomAligned
    },
    {
      name: "left-top",
      left: leftAligned,
      top: topAligned
    },
    {
      name: "left-center",
      left: leftSide,
      top: verticalCenter
    },
    {
      name: "left-bottom",
      left: leftAligned,
      top: bottomAligned
    },
    {
      name: "top-left",
      left: leftAligned,
      top: topAligned
    },
    {
      name: "top-center",
      left: horizontalCenter,
      top: topSide
    },
    {
      name: "top-right",
      left: rightAligned,
      top: topAligned
    },
    {
      name: "bottom-left",
      left: leftAligned,
      top: bottomAligned
    },
    {
      name: "bottom-center",
      left: horizontalCenter,
      top: bottomSide
    },
    {
      name: "bottom-right",
      left: rightAligned,
      top: bottomAligned
    }
  ];

  const candidates = candidateSeeds.map((candidate) => {
    const overflowX =
      Math.max(0, minLeft - candidate.left) +
      Math.max(0, candidate.left - maxLeft);
    const overflowY =
      Math.max(0, minTop - candidate.top) +
      Math.max(0, candidate.top - maxTop);
    const left = clampHorizontal(candidate.left);
    const top = clampVertical(candidate.top);
    const distance = Math.abs(left - candidate.left) + Math.abs(top - candidate.top);

    return {
      ...candidate,
      left,
      top,
      overflow: overflowX + overflowY,
      distance
    };
  });

  candidates.sort((first, second) => {
    if (first.overflow !== second.overflow) {
      return first.overflow - second.overflow;
    }
    if (first.distance !== second.distance) {
      return first.distance - second.distance;
    }
    return 0;
  });

  return candidates[0]
    ? {
        left: candidates[0].left,
        top: candidates[0].top
      }
    : {
        left: clampHorizontal(rightAligned),
        top: clampVertical(topAligned)
      };
}

function getRectOverlapArea(firstRect, secondRect) {
  if (!firstRect || !secondRect) {
    return 0;
  }

  const left = Math.max(firstRect.left, secondRect.left);
  const right = Math.min(firstRect.right, secondRect.right);
  const top = Math.max(firstRect.top, secondRect.top);
  const bottom = Math.min(firstRect.bottom, secondRect.bottom);
  if (right <= left || bottom <= top) {
    return 0;
  }
  return (right - left) * (bottom - top);
}

function getNonOverlappingPopoverPosition(targetRect, popoverWidth, popoverHeight, options = {}) {
  const viewportPadding = options.viewportPadding ?? 16;
  const anchorGap = options.anchorGap ?? 12;
  const desiredTop = options.desiredTop ?? targetRect.top;
  const desiredLeft = options.desiredLeft ?? targetRect.left;
  const minLeft = viewportPadding;
  const maxLeft = Math.max(viewportPadding, window.innerWidth - popoverWidth - viewportPadding);
  const minTop = viewportPadding;
  const maxTop = Math.max(viewportPadding, window.innerHeight - popoverHeight - viewportPadding);
  const clampHorizontal = (value) => Math.max(minLeft, Math.min(value, maxLeft));
  const clampVertical = (value) => Math.max(minTop, Math.min(value, maxTop));
  const verticalCenter = targetRect.top + (targetRect.height - popoverHeight) / 2;
  const horizontalCenter = targetRect.left + (targetRect.width - popoverWidth) / 2;
  const candidateSeeds = [
    {
      side: "right",
      left: targetRect.right + anchorGap,
      top: desiredTop,
      availableMain: window.innerWidth - viewportPadding - targetRect.right - anchorGap
    },
    {
      side: "right",
      left: targetRect.right + anchorGap,
      top: verticalCenter,
      availableMain: window.innerWidth - viewportPadding - targetRect.right - anchorGap
    },
    {
      side: "right",
      left: targetRect.right + anchorGap,
      top: targetRect.bottom - popoverHeight,
      availableMain: window.innerWidth - viewportPadding - targetRect.right - anchorGap
    },
    {
      side: "left",
      left: targetRect.left - popoverWidth - anchorGap,
      top: desiredTop,
      availableMain: targetRect.left - viewportPadding - anchorGap
    },
    {
      side: "left",
      left: targetRect.left - popoverWidth - anchorGap,
      top: verticalCenter,
      availableMain: targetRect.left - viewportPadding - anchorGap
    },
    {
      side: "left",
      left: targetRect.left - popoverWidth - anchorGap,
      top: targetRect.bottom - popoverHeight,
      availableMain: targetRect.left - viewportPadding - anchorGap
    },
    {
      side: "bottom",
      left: desiredLeft,
      top: targetRect.bottom + anchorGap,
      availableMain: window.innerHeight - viewportPadding - targetRect.bottom - anchorGap
    },
    {
      side: "bottom",
      left: horizontalCenter,
      top: targetRect.bottom + anchorGap,
      availableMain: window.innerHeight - viewportPadding - targetRect.bottom - anchorGap
    },
    {
      side: "bottom",
      left: targetRect.right - popoverWidth,
      top: targetRect.bottom + anchorGap,
      availableMain: window.innerHeight - viewportPadding - targetRect.bottom - anchorGap
    },
    {
      side: "top",
      left: desiredLeft,
      top: targetRect.top - popoverHeight - anchorGap,
      availableMain: targetRect.top - viewportPadding - anchorGap
    },
    {
      side: "top",
      left: horizontalCenter,
      top: targetRect.top - popoverHeight - anchorGap,
      availableMain: targetRect.top - viewportPadding - anchorGap
    },
    {
      side: "top",
      left: targetRect.right - popoverWidth,
      top: targetRect.top - popoverHeight - anchorGap,
      availableMain: targetRect.top - viewportPadding - anchorGap
    }
  ];

  const candidates = candidateSeeds.map((candidate) => {
    const left = clampHorizontal(candidate.left);
    const top = clampVertical(candidate.top);
    const overlap = getRectOverlapArea(targetRect, {
      left,
      top,
      right: left + popoverWidth,
      bottom: top + popoverHeight
    });
    return {
      ...candidate,
      left,
      top,
      overlap,
      fitsPrimary: candidate.availableMain >= (candidate.side === "left" || candidate.side === "right" ? popoverWidth : popoverHeight)
    };
  });

  candidates.sort((first, second) => {
    if (first.overlap !== second.overlap) {
      return first.overlap - second.overlap;
    }
    if (first.fitsPrimary !== second.fitsPrimary) {
      return first.fitsPrimary ? -1 : 1;
    }
    return second.availableMain - first.availableMain;
  });

  return candidates[0] || {
    left: clampHorizontal(desiredLeft),
    top: clampVertical(desiredTop),
    side: "floating",
    overlap: 0,
    availableMain: 0,
    fitsPrimary: false
  };
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
  button.setAttribute("aria-label", "拖拽移动位置");
  button.setAttribute("title", "拖拽移动位置");
  button.style.left = `${rect.left + rect.width / 2}px`;
  button.style.top = `${rect.top + rect.height / 2}px`;

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    startLayoutDrag(index, event, "selected-only");
  });

  state.overlayLayer.appendChild(button);
}

function getLayoutInsertHintConfig(target) {
  if (!isElementTarget(target)) {
    return null;
  }

  const element = getTargetElement(target);
  // Duplicate exactly what the user selected instead of promoting to an ancestor layout item.
  const parent = element?.parentElement || null;
  const anchorElement = element;
  if (
    !(element instanceof Element) ||
    !(anchorElement instanceof Element) ||
    !(parent instanceof Element) ||
    parent === document.body ||
    parent === document.documentElement ||
    !isSelectableElement(parent)
  ) {
    return null;
  }

  const axis = getLayoutAxisForContainer(parent);
  return {
    element,
    anchorElement,
    parent,
    axis,
    edges: axis === "x" ? ["left", "right"] : ["top", "bottom"]
  };
}

function getDistanceToRectEdge(rect, edge, clientX, clientY, threshold) {
  if (!rect) {
    return Number.POSITIVE_INFINITY;
  }

  if (edge === "left" || edge === "right") {
    if (clientY < rect.top - threshold || clientY > rect.bottom + threshold) {
      return Number.POSITIVE_INFINITY;
    }
    return Math.abs(clientX - (edge === "left" ? rect.left : rect.right));
  }

  if (clientX < rect.left - threshold || clientX > rect.right + threshold) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.abs(clientY - (edge === "top" ? rect.top : rect.bottom));
}

function getLayoutInsertHintForPointer(target, clientX, clientY) {
  const config = getLayoutInsertHintConfig(target);
  const rect = mergeRects(getTargetClientRects(target));
  const threshold = 14;
  if (
    !config ||
    !rect ||
    clientX < rect.left - threshold ||
    clientX > rect.right + threshold ||
    clientY < rect.top - threshold ||
    clientY > rect.bottom + threshold
  ) {
    return null;
  }

  let matchedEdge = null;
  let matchedDistance = Number.POSITIVE_INFINITY;
  for (const edge of config.edges) {
    const distance = getDistanceToRectEdge(rect, edge, clientX, clientY, threshold);
    if (distance <= threshold && distance < matchedDistance) {
      matchedEdge = edge;
      matchedDistance = distance;
    }
  }

  if (!matchedEdge) {
    return null;
  }

  return {
    target: findSelectedTarget(target) || target,
    edge: matchedEdge
  };
}

function setLayoutInsertHint(nextHint) {
  const normalizedHint =
    nextHint?.target && nextHint?.edge
      ? {
          target: findSelectedTarget(nextHint.target) || nextHint.target,
          edge: nextHint.edge
        }
      : null;

  const sameHint =
    (!normalizedHint && !state.layoutInsertHint) ||
    (normalizedHint &&
      state.layoutInsertHint &&
      normalizedHint.edge === state.layoutInsertHint.edge &&
      isSameTarget(normalizedHint.target, state.layoutInsertHint.target));

  if (sameHint) {
    return;
  }

  state.layoutInsertHint = normalizedHint;
  refreshHighlights();
}

function getLayoutInsertEdgeLabel(edge) {
  if (edge === "left") {
    return "左侧";
  }
  if (edge === "right") {
    return "右侧";
  }
  if (edge === "top") {
    return "上方";
  }
  return "下方";
}

function getLayoutInsertButtonPosition(rect, edge) {
  if (edge === "left") {
    return { left: rect.left, top: rect.top + rect.height / 2 };
  }
  if (edge === "right") {
    return { left: rect.right, top: rect.top + rect.height / 2 };
  }
  if (edge === "top") {
    return { left: rect.left + rect.width / 2, top: rect.top };
  }
  return { left: rect.left + rect.width / 2, top: rect.bottom };
}

function buildDuplicateLayoutPrompt(element, parent, edge) {
  return `复制${describeElementForLayoutPrompt(element)}，并插入到原元素${getLayoutInsertEdgeLabel(
    edge
  )}，遵循${describeContainerForLayoutPrompt(parent)}当前的布局与对齐方式。`;
}

function duplicateLayoutTarget(target, edge) {
  const persistedTarget = findSelectedTarget(target) || target;
  const config = getLayoutInsertHintConfig(persistedTarget);
  if (!config || !config.edges.includes(edge)) {
    showToast("当前这个元素暂时不能在这个方向复制");
    return;
  }

  const sourceElement = config.anchorElement;
  const referenceNode = edge === "left" || edge === "top" ? sourceElement : sourceElement.nextSibling;
  const clone = sourceElement.cloneNode(true);
  if (!(clone instanceof Element)) {
    showToast("复制失败");
    return;
  }

  const previousSelectionSnapshot = snapshotSelection();
  config.parent.insertBefore(clone, referenceNode);
  setTargetLayoutPrompt(persistedTarget, buildDuplicateLayoutPrompt(sourceElement, config.parent, edge));

  state.hoveredTarget = null;
  state.hoveredSelectedTarget = persistedTarget;
  state.layoutInsertHint = null;

  pushHistoryEntry({
    type: "dom-remove",
    element: clone,
    selectionSnapshot: previousSelectionSnapshot
  });

  renderSelection();
  refreshHighlights();
  showToast(`已在${getLayoutInsertEdgeLabel(edge)}复制一个元素`);
}

function drawLayoutInsertButton(target, edge) {
  const config = getLayoutInsertHintConfig(target);
  const rect = mergeRects(getTargetClientRects(target));
  if (!config || !rect || !config.edges.includes(edge)) {
    return;
  }

  const position = getLayoutInsertButtonPosition(rect, edge);
  const button = document.createElement("button");
  button.type = "button";
  button.className = "chat-context-picker-overlay-layout-insert";
  button.dataset.chatContextPickerUi = "true";
  button.dataset.edge = edge;
  button.setAttribute("aria-label", `在${getLayoutInsertEdgeLabel(edge)}复制一个元素`);
  button.setAttribute("title", `在${getLayoutInsertEdgeLabel(edge)}复制一个元素`);
  button.style.left = `${position.left}px`;
  button.style.top = `${position.top}px`;
  button.innerHTML = icon("plus");

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });

  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    duplicateLayoutTarget(target, edge);
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

  for (const [index, target] of state.selectedTargets.entries()) {
    const isDropTarget = isSameTarget(state.dragSession?.dropTarget, target);
    const isDraggedTarget = isSameTarget(state.dragSession?.draggedTarget, target);
    const variant = isDropTarget ? "drop-target" : isDraggedTarget ? "dragging" : "selected";
    if (!shouldSuppressAdjustTargetHighlightForTarget(target)) {
      drawHighlight(target, variant);
    }

    if (state.selectionMode === "select" || state.selectionMode === "adjust") {
      drawPromptBadge(target, index);
    }
  }

  if (state.active && state.hoveredTarget && !hasSelectedTarget(state.hoveredTarget)) {
    drawHighlight(state.hoveredTarget, "hover");
  }

  if (state.selectionMode === "layout") {
    state.selectedTargets.forEach((target, index) => {
      if (isElementTarget(target)) {
        drawLayoutHandle(target, index);
      }
    });

    if (!state.dragSession && state.layoutInsertHint?.target && isElementTarget(state.layoutInsertHint.target)) {
      drawLayoutInsertButton(state.layoutInsertHint.target, state.layoutInsertHint.edge);
    }

    if (state.dragSession) {
      drawDraggingHandle(state.dragSession.clientX, state.dragSession.clientY);
    }
  }
}

function clearHover() {
  if (!state.hoveredTarget && !state.hoveredSelectedTarget && !state.layoutInsertHint) {
    return;
  }

  state.hoveredTarget = null;
  state.hoveredSelectedTarget = null;
  state.layoutInsertHint = null;
  if (!state.hoverLock) {
    clearHoverLockSnapshot();
  }
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
  state.listTrigger.dataset.state = open ? "active" : "inactive";
  state.listTrigger.setAttribute("aria-pressed", open ? "true" : "false");
}

function setSelectionMode(mode, shouldNotify = true) {
  if (!MODE_LABELS[mode]) {
    return;
  }

  if (state.selectionMode !== mode) {
    closeAdjustPopover();
  }
  state.selectionMode = mode;
  cleanupDragSessionArtifacts(state.dragSession);
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
    if (state.selectionMode === "adjust") {
      prepareHoverLockSnapshot(target);
    }
    refreshHighlights();
    return;
  }

  if (isSameTarget(state.hoveredTarget, target)) {
    return;
  }

  state.hoveredTarget = target;
  state.hoveredSelectedTarget = null;
  if (state.selectionMode === "adjust") {
    prepareHoverLockSnapshot(target);
  }
  refreshHighlights();
}

function getLayoutAxisForContainer(container) {
  if (!(container instanceof Element)) {
    return "y";
  }

  const styles = window.getComputedStyle(container);
  if (styles.display === "flex" || styles.display === "inline-flex") {
    return styles.flexDirection.startsWith("column") ? "y" : "x";
  }

  if (styles.display === "grid" || styles.display === "inline-grid") {
    const columns = styles.gridTemplateColumns
      .split(" ")
      .map((item) => item.trim())
      .filter((item) => item && item !== "none").length;
    return columns > 1 ? "x" : "y";
  }

  const childRects = Array.from(container.children)
    .filter((element) => isSelectableElement(element))
    .map((element) => element.getBoundingClientRect())
    .filter((rect) => rect.width > 0 && rect.height > 0);

  if (childRects.length >= 2) {
    const centerXs = childRects.map((rect) => rect.left + rect.width / 2);
    const centerYs = childRects.map((rect) => rect.top + rect.height / 2);
    const spreadX = Math.max(...centerXs) - Math.min(...centerXs);
    const spreadY = Math.max(...centerYs) - Math.min(...centerYs);

    if (spreadX > spreadY * 1.2) {
      return "x";
    }

    if (spreadY > spreadX * 1.2) {
      return "y";
    }
  }

  return "y";
}

function getAxisStart(rect, axis) {
  return axis === "x" ? rect.left : rect.top;
}

function getAxisSize(rect, axis) {
  return axis === "x" ? rect.width : rect.height;
}

function getAxisPoint(clientX, clientY, axis) {
  return axis === "x" ? clientX : clientY;
}

function getAxisCenter(rect, axis) {
  return getAxisStart(rect, axis) + getAxisSize(rect, axis) / 2;
}

function getPreferredLayoutAnchor(element) {
  if (!(element instanceof Element)) {
    return null;
  }

  return (
    element.closest?.(
      'button, a, input, textarea, select, label, p, h1, h2, h3, h4, h5, h6, li, [role="button"]'
    ) || element
  );
}

function isLayoutAnchorCandidate(element) {
  if (!(element instanceof Element)) {
    return false;
  }

  const tag = element.tagName.toLowerCase();
  if (
    /^(button|a|input|textarea|select|label|p|h1|h2|h3|h4|h5|h6|li|img|svg|picture)$/.test(tag)
  ) {
    return true;
  }

  if (element.getAttribute("role") === "button") {
    return true;
  }

  const styles = window.getComputedStyle(element);
  return (
    element.children.length <= 1 &&
    !["flex", "inline-flex", "grid", "inline-grid"].includes(styles.display)
  );
}

function isLayoutContainerCandidate(element) {
  if (!(element instanceof Element)) {
    return false;
  }

  if (!element.children.length) {
    return false;
  }

  const styles = window.getComputedStyle(element);
  return ["flex", "inline-flex", "grid", "inline-grid", "block"].includes(styles.display);
}

function getLayoutCandidateElements(clientX, clientY) {
  const stack = document.elementsFromPoint(clientX, clientY);
  const seen = new Set();
  const candidates = [];

  function addCandidate(element) {
    if (!(element instanceof Element) || seen.has(element) || !isSelectableElement(element)) {
      return;
    }
    seen.add(element);
    candidates.push(element);
  }

  for (const element of stack) {
    addCandidate(getPreferredLayoutAnchor(element));
    let current = element;
    let depth = 0;
    while (current && current !== document.body && current !== document.documentElement && depth < 5) {
      addCandidate(current);
      current = current.parentElement;
      depth += 1;
    }
  }

  return candidates;
}

function getSelectableDirectChildren(parent, draggedElement) {
  if (!(parent instanceof Element)) {
    return [];
  }

  return Array.from(parent.children).filter(
    (element) =>
      element !== draggedElement &&
      isSelectableElement(element) &&
      !draggedElement?.contains?.(element)
  );
}

function resolveLayoutAnchorContext(anchorElement, draggedElement) {
  if (!(anchorElement instanceof Element)) {
    return null;
  }

  let current = anchorElement;
  let fallbackContext = null;

  while (current?.parentElement) {
    const parent = current.parentElement;
    if (
      parent === document.body ||
      parent === document.documentElement ||
      !isSelectableElement(parent)
    ) {
      break;
    }

    const styles = window.getComputedStyle(parent);
    const directChildren = getSelectableDirectChildren(parent, draggedElement);
    const isPrimaryLayoutContainer = ["flex", "inline-flex", "grid", "inline-grid"].includes(styles.display);
    const isFallbackStructuredContainer = directChildren.length >= 2;

    if (isPrimaryLayoutContainer) {
      return { parent, anchorChild: current };
    }

    if (!fallbackContext && isFallbackStructuredContainer) {
      fallbackContext = { parent, anchorChild: current };
    }

    current = parent;
  }

  return (
    fallbackContext ||
    (anchorElement.parentElement
      ? { parent: anchorElement.parentElement, anchorChild: anchorElement }
      : null)
  );
}

function buildAnchorDropPlan(anchorElement, draggedElement, clientX, clientY) {
  if (
    !(anchorElement instanceof Element) ||
    !draggedElement ||
    anchorElement === draggedElement ||
    draggedElement.contains(anchorElement) ||
    anchorElement.contains(draggedElement)
  ) {
    return null;
  }

  const context = resolveLayoutAnchorContext(anchorElement, draggedElement);
  const parent = context?.parent || null;
  const anchorChild = context?.anchorChild || null;
  const target = anchorChild ? createElementTarget(anchorChild) : null;
  const rect = target ? mergeRects(getTargetClientRects(target)) : null;
  if (!rect || !parent) {
    return null;
  }

  const axis = getLayoutAxisForContainer(parent);
  const ratio =
    (getAxisPoint(clientX, clientY, axis) - getAxisStart(rect, axis)) /
    Math.max(1, getAxisSize(rect, axis));

  if (hasSelectedTarget(target) && ratio >= 0.35 && ratio <= 0.65) {
    return {
      operation: "swap",
      highlightTarget: target,
      targetElement: anchorChild,
      score: rect.width * rect.height
    };
  }

  const position = ratio < 0.5 ? "before" : "after";
  return {
    operation: "insert",
    highlightTarget: target,
    targetElement: anchorChild,
    parent,
    position,
    referenceNode: position === "before" ? anchorChild : anchorChild.nextSibling,
    score: rect.width * rect.height
  };
}

function buildContainerDropPlan(containerElement, draggedElement, clientX, clientY) {
  if (
    !(containerElement instanceof Element) ||
    !draggedElement ||
    containerElement === draggedElement ||
    draggedElement.contains(containerElement)
  ) {
    return null;
  }

  const rect = containerElement.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0 || !pointInRect(clientX, clientY, rect)) {
    return null;
  }

  const axis = getLayoutAxisForContainer(containerElement);
  const pointer = getAxisPoint(clientX, clientY, axis);
  const childEntries = Array.from(containerElement.children)
    .filter(
      (element) =>
        element !== draggedElement &&
        isSelectableElement(element) &&
        !draggedElement.contains(element)
    )
    .map((element) => {
      const target = createElementTarget(element);
      const childRect = mergeRects(getTargetClientRects(target));
      return childRect ? { element, target, rect: childRect } : null;
    })
    .filter(Boolean)
    .sort((a, b) => getAxisCenter(a.rect, axis) - getAxisCenter(b.rect, axis));

  if (!childEntries.length) {
    return {
      operation: "insert",
      highlightTarget: createElementTarget(containerElement),
      targetElement: null,
      parent: containerElement,
      position: "append",
      referenceNode: null,
      score: rect.width * rect.height
    };
  }

  const referenceEntry = childEntries.find((entry) => pointer < getAxisCenter(entry.rect, axis));
  if (referenceEntry) {
    return {
      operation: "insert",
      highlightTarget: referenceEntry.target,
      targetElement: referenceEntry.element,
      parent: containerElement,
      position: "before",
      referenceNode: referenceEntry.element,
      score: rect.width * rect.height
    };
  }

  const lastEntry = childEntries[childEntries.length - 1];
  return {
    operation: "insert",
    highlightTarget: lastEntry.target,
    targetElement: lastEntry.element,
    parent: containerElement,
    position: "after",
    referenceNode: null,
    score: rect.width * rect.height
  };
}

function getLayoutDropPlan(clientX, clientY, draggedTarget) {
  const draggedElement = getTargetElement(draggedTarget);
  if (!draggedElement) {
    return null;
  }

  const candidates = getLayoutCandidateElements(clientX, clientY);
  const plans = [];
  for (const element of candidates) {
    if (isLayoutAnchorCandidate(element)) {
      const anchorPlan = buildAnchorDropPlan(element, draggedElement, clientX, clientY);
      if (anchorPlan) {
        plans.push(anchorPlan);
      }
    }

    if (isLayoutContainerCandidate(element)) {
      const containerPlan = buildContainerDropPlan(element, draggedElement, clientX, clientY);
      if (containerPlan) {
        plans.push(containerPlan);
      }
    }
  }

  return plans.sort((a, b) => (a.score || Number.MAX_SAFE_INTEGER) - (b.score || Number.MAX_SAFE_INTEGER))[0] || null;
}

function getSelectedOnlyLayoutDropPlan(clientX, clientY, draggedTarget) {
  const candidates = state.selectedTargets
    .filter(isElementTarget)
    .filter((target) => !isSameTarget(target, draggedTarget))
    .map((target) => {
      const rect = mergeRects(getTargetClientRects(target));
      return rect ? { target, rect } : null;
    })
    .filter(Boolean);

  if (!candidates.length) {
    return null;
  }

  const containing = candidates
    .filter(({ rect }) => pointInRect(clientX, clientY, rect))
    .sort((a, b) => a.rect.width * a.rect.height - b.rect.width * b.rect.height)[0];

  if (!containing) {
    return null;
  }

  return {
    operation: "swap",
    highlightTarget: containing.target,
    targetElement: getTargetElement(containing.target)
  };
}

function startLayoutDrag(index, event, dragMode = "free") {
  pruneSelectedTargets();
  const draggedTarget = state.selectedTargets[index];
  if (!isElementTarget(draggedTarget)) {
    return;
  }

  const draggedElement = getTargetElement(draggedTarget);
  const rect = draggedElement?.getBoundingClientRect();
  if (!draggedElement || !rect) {
    return;
  }

  const preview = draggedElement.cloneNode(true);
  const draggedElementOpacity = draggedElement.style.opacity;
  const draggedElementDisplay = draggedElement.style.display;
  const originalPosition = captureElementPosition(draggedElement);
  let placeholder = null;

  preview.classList.add("chat-context-picker-drag-preview");
  preview.dataset.chatContextPickerUi = "true";
  preview.style.width = `${rect.width}px`;
  preview.style.height = `${rect.height}px`;
  preview.style.left = `${rect.left}px`;
  preview.style.top = `${rect.top}px`;

  document.documentElement.appendChild(preview);

  if (dragMode === "free" && originalPosition.parent) {
    placeholder = draggedElement.cloneNode(false);
    placeholder.classList.add("chat-context-picker-layout-placeholder");
    placeholder.dataset.chatContextPickerUi = "true";
    placeholder.removeAttribute("id");
    placeholder.removeAttribute("name");
    placeholder.removeAttribute("for");
    placeholder.removeAttribute("aria-labelledby");
    placeholder.removeAttribute("aria-describedby");
    placeholder.textContent = "";
    originalPosition.parent.insertBefore(placeholder, originalPosition.nextSibling);
    updateLayoutPlaceholder(placeholder, originalPosition.parent, rect);
    draggedElement.style.display = "none";
  } else {
    draggedElement.dataset.chatContextPickerDragging = "true";
    draggedElement.style.opacity = "0.22";
  }

  state.dragSession = {
    draggedTarget,
    dragMode,
    dropTarget: null,
    dropPosition: null,
    dropPlan: null,
    preview,
    placeholder,
    draggedElement,
    draggedElementOpacity,
    draggedElementDisplay,
    originalPosition,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    draggedRect: {
      width: rect.width,
      height: rect.height
    },
    pointerId: event.pointerId,
    clientX: event.clientX,
    clientY: event.clientY
  };
  state.suppressClickUntil = Date.now() + 400;
  updateDragPreviewPosition(state.dragSession);
  refreshHighlights();
}

function updateDragPreviewPosition(dragSession) {
  if (!dragSession?.preview) {
    return;
  }

  dragSession.preview.style.left = `${dragSession.clientX - dragSession.offsetX}px`;
  dragSession.preview.style.top = `${dragSession.clientY - dragSession.offsetY}px`;
}

function updateLayoutPlaceholder(placeholder, parent, draggedRect) {
  if (!(placeholder instanceof Element) || !(parent instanceof Element) || !draggedRect) {
    return;
  }

  const axis = getLayoutAxisForContainer(parent);
  placeholder.dataset.axis = axis;
  placeholder.style.width = `${Math.max(12, Math.round(draggedRect.width))}px`;
  placeholder.style.height = `${Math.max(12, Math.round(draggedRect.height))}px`;
  placeholder.style.minWidth = axis === "x" ? `${Math.max(12, Math.round(draggedRect.width))}px` : "0";
  placeholder.style.minHeight = axis === "y" ? `${Math.max(12, Math.round(draggedRect.height))}px` : "0";
}

function moveLayoutPlaceholder(dragSession, dropPlan) {
  if (!dragSession?.placeholder) {
    return;
  }

  const placeholder = dragSession.placeholder;
  const fallbackParent = dragSession.originalPosition?.parent;
  const fallbackReference = dragSession.originalPosition?.nextSibling || null;

  if (dropPlan?.operation === "insert" && dropPlan.parent) {
    updateLayoutPlaceholder(placeholder, dropPlan.parent, dragSession.draggedRect);
    dropPlan.parent.insertBefore(placeholder, dropPlan.referenceNode || null);
    return;
  }

  if (fallbackParent) {
    updateLayoutPlaceholder(placeholder, fallbackParent, dragSession.draggedRect);
    fallbackParent.insertBefore(placeholder, fallbackReference);
  }
}

function cleanupDragSessionArtifacts(dragSession) {
  if (!dragSession) {
    return;
  }

  if (dragSession.preview) {
    dragSession.preview.remove();
  }

  if (dragSession.draggedElement) {
    dragSession.draggedElement.style.opacity = dragSession.draggedElementOpacity || "";
    dragSession.draggedElement.style.display = dragSession.draggedElementDisplay || "";
    delete dragSession.draggedElement.dataset.chatContextPickerDragging;
  }

  if (dragSession.placeholder) {
    dragSession.placeholder.remove();
  }
}

function getLayoutDropPosition(target, clientX, clientY) {
  const element = getTargetElement(target);
  const parent = element?.parentElement;
  const rect = mergeRects(getTargetClientRects(target));
  if (!parent || !rect) {
    return null;
  }

  const parentStyles = window.getComputedStyle(parent);
  const isHorizontalFlex =
    (parentStyles.display === "flex" || parentStyles.display === "inline-flex") &&
    !parentStyles.flexDirection.startsWith("column");

  if (isHorizontalFlex) {
    return clientX < rect.left + rect.width / 2 ? "before" : "after";
  }

  return clientY < rect.top + rect.height / 2 ? "before" : "after";
}

function moveElementRelative(draggedElement, targetElement, position) {
  if (
    !draggedElement ||
    !targetElement ||
    draggedElement === targetElement ||
    draggedElement.contains(targetElement) ||
    targetElement.contains(draggedElement)
  ) {
    return false;
  }

  const targetParent = targetElement.parentNode;
  if (!targetParent) {
    return false;
  }

  const referenceNode = position === "before" ? targetElement : targetElement.nextSibling;
  const currentNextSibling = draggedElement.nextSibling;
  const currentParent = draggedElement.parentNode;

  if (
    currentParent === targetParent &&
    ((position === "before" && currentNextSibling === targetElement) ||
      (position === "after" && targetElement.nextSibling === draggedElement))
  ) {
    return false;
  }

  targetParent.insertBefore(draggedElement, referenceNode);
  return true;
}

function moveElementToPlacement(draggedElement, parent, referenceNode) {
  if (!draggedElement || !parent || parent === draggedElement || draggedElement.contains(parent)) {
    return false;
  }

  const currentParent = draggedElement.parentNode;
  const currentNextSibling = draggedElement.nextSibling;
  if (currentParent === parent && currentNextSibling === referenceNode) {
    return false;
  }

  if (referenceNode && referenceNode.parentNode !== parent) {
    return false;
  }

  parent.insertBefore(draggedElement, referenceNode);
  return true;
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

  const dragSession = state.dragSession;
  const { draggedTarget, dropPlan } = dragSession;
  state.dragSession = null;

  if (!draggedTarget || !dropPlan) {
    cleanupDragSessionArtifacts(dragSession);
    refreshHighlights();
    return;
  }

  const draggedElement = getTargetElement(draggedTarget);
  let changed = false;
  const previousSelectionSnapshot = snapshotSelection();

  if (dropPlan.operation === "swap") {
    const targetElement = dropPlan.targetElement;
    if (!targetElement) {
      cleanupDragSessionArtifacts(dragSession);
      refreshHighlights();
      return;
    }

    const previousPositions = [
      { element: draggedElement, position: dragSession.originalPosition || captureElementPosition(draggedElement) },
      { element: targetElement, position: captureElementPosition(targetElement) }
    ];

    changed = swapElementPositions(draggedElement, targetElement);
    if (changed) {
      applyLayoutInteractionPrompts(draggedTarget, dropPlan);
      pushHistoryEntry({
        type: "dom-positions",
        positions: previousPositions,
        selectionSnapshot: previousSelectionSnapshot
      });
    }
  } else if (dropPlan.operation === "insert") {
    const previousPosition = dragSession.originalPosition || captureElementPosition(draggedElement);
    if (dragSession.placeholder?.parentNode) {
      const finalParent = dragSession.placeholder.parentNode;
      const finalNextSibling = dragSession.placeholder.nextSibling;
      finalParent.insertBefore(draggedElement, dragSession.placeholder);
      changed =
        previousPosition.parent !== finalParent || previousPosition.nextSibling !== finalNextSibling;
    } else {
      changed = moveElementToPlacement(draggedElement, dropPlan.parent, dropPlan.referenceNode);
    }
    if (changed) {
      applyLayoutInteractionPrompts(draggedTarget, dropPlan);
      pushHistoryEntry({
        type: "dom-move",
        element: draggedElement,
        position: previousPosition,
        selectionSnapshot: previousSelectionSnapshot
      });
    }
  }

  cleanupDragSessionArtifacts(dragSession);

  if (!changed) {
    showToast("当前这个元素暂时不能放到这个位置");
    refreshHighlights();
    return;
  }

  renderSelection();
  refreshHighlights();
  showToast(dropPlan.operation === "swap" ? "已交换两个元素的位置" : "已移动元素位置");
}

function openPromptPopover(target, anchorRect = null) {
  ensurePromptPopover();
  if (isPromptOpen()) {
    discardPromptChanges();
  }
  const persistedTarget = findSelectedTarget(target) || target;
  beginHoverLockForPromptTarget(persistedTarget);
  state.promptTarget = persistedTarget;
  state.promptDraftValue = persistedTarget.promptText || "";
  state.promptSavedSelectionMode = state.selectionMode;
  renderPromptSuggestions(persistedTarget);

  const rect =
    mergeRects(getTargetClientRects(persistedTarget)) ||
    getTargetElement(persistedTarget).getBoundingClientRect();
  const popoverWidth = Math.min(380, window.innerWidth - 32);
  const popoverHeight = 232;
  const placement = getNonOverlappingPopoverPosition(rect, popoverWidth, popoverHeight, {
    desiredTop: (anchorRect || rect).top - 8,
    desiredLeft: rect.left
  });

  state.promptPopover.style.left = `${placement.left}px`;
  state.promptPopover.style.top = `${placement.top}px`;
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
  endHoverLock();
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
  const previous = snapshotSelection();
  persistedTarget.promptText = state.promptTextarea.value.trim();
  persistedTarget.adjustPreserveSelection = true;
  const rect = mergeRects(getTargetClientRects(persistedTarget));
  if (rect) {
    persistedTarget.adjustPreserveRect = rect;
    persistedTarget.adjustPreservePageRect = {
      left: rect.left + window.scrollX,
      top: rect.top + window.scrollY,
      right: rect.right + window.scrollX,
      bottom: rect.bottom + window.scrollY,
      width: rect.width,
      height: rect.height
    };
  }
  const selectedTarget = state.selectedTargets.find((item) => isSameTarget(item, persistedTarget));
  if (selectedTarget) {
    selectedTarget.promptText = persistedTarget.promptText;
    selectedTarget.adjustPreserveSelection = true;
    selectedTarget.adjustPreserveMirror = persistedTarget.adjustPreserveMirror;
    if (rect) {
      selectedTarget.adjustPreserveRect = persistedTarget.adjustPreserveRect;
      selectedTarget.adjustPreservePageRect = persistedTarget.adjustPreservePageRect;
    }
  }
  state.promptTarget = persistedTarget;
  if (!areSelectionsEqual(previous, state.selectedTargets)) {
    pushSelectionHistory(previous);
  }
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
