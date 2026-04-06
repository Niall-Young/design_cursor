// Build the toolbar and editor surfaces that the later runtime wires up.
function findBulkSelectableInput(target) {
  if (!(target instanceof Element)) {
    return null;
  }

  const input = target.closest(
    '.chat-context-picker-adjust-inline-input, .chat-context-picker-adjust-style-input, .chat-context-picker-adjust-style-alpha-input, .chat-context-picker-shadow-input, .chat-context-picker-shadow-text-input, .chat-context-picker-shadow-percent-input, .chat-context-picker-fill-value-input, .chat-context-picker-fill-triplet-input, .chat-context-picker-fill-alpha-input, .chat-context-picker-fill-angle-input, .chat-context-picker-fill-text-input, .chat-context-picker-fill-percent-input'
  );

  if (!(input instanceof HTMLInputElement) || input.disabled || input.readOnly || input.type === "color") {
    return null;
  }

  return input;
}

function enableSingleClickSelectAll(container) {
  if (!container || container.dataset.chatContextPickerSelectAllReady === "true") {
    return;
  }

  container.dataset.chatContextPickerSelectAllReady = "true";

  container.addEventListener(
    "pointerdown",
    (event) => {
      const input = findBulkSelectableInput(event.target);
      if (!input) {
        return;
      }

      input.dataset.chatContextPickerSelectIntent = event.detail >= 2 ? "caret" : "select-all";
    },
    true
  );

  container.addEventListener(
    "focusin",
    (event) => {
      const input = findBulkSelectableInput(event.target);
      if (!input || input.dataset.chatContextPickerSelectIntent !== "select-all") {
        return;
      }

      window.requestAnimationFrame(() => {
        if (document.activeElement !== input || input.dataset.chatContextPickerSelectIntent !== "select-all") {
          return;
        }
        input.select();
      });
    },
    true
  );

  container.addEventListener(
    "click",
    (event) => {
      const input = findBulkSelectableInput(event.target);
      if (!input) {
        return;
      }

      if (event.detail >= 2) {
        input.dataset.chatContextPickerSelectIntent = "caret";
        return;
      }

      window.requestAnimationFrame(() => {
        if (document.activeElement !== input || input.dataset.chatContextPickerSelectIntent === "caret") {
          return;
        }
        input.select();
      });
    },
    true
  );

  container.addEventListener(
    "dblclick",
    (event) => {
      const input = findBulkSelectableInput(event.target);
      if (!input) {
        return;
      }

      input.dataset.chatContextPickerSelectIntent = "caret";
    },
    true
  );
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
        <div class="chat-context-picker-popover-title">调整清单</div>
        <button class="chat-context-picker-popover-close" type="button" data-action="close-list" aria-label="关闭清单" title="关闭清单">
          <span class="chat-context-picker-popover-close-icon">${icon("close")}</span>
        </button>
      </div>
      <div class="chat-context-picker-popover-count" id="chat-context-picker-count">已选 0 个</div>
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
      <button class="chat-context-picker-tool-button" type="button" data-action="set-mode" data-mode="adjust" aria-label="调整模式" title="调整模式">
        <span class="chat-context-picker-tool-icon">${icon("layoutSelect")}</span>
      </button>
      <button class="chat-context-picker-tool-button" type="button" data-action="set-mode" data-mode="layout" aria-label="排版模式" title="排版模式">
        <span class="chat-context-picker-tool-icon">${icon("layout")}</span>
      </button>
      <button class="chat-context-picker-tool-button" type="button" data-action="set-mode" data-mode="select" aria-label="输入模式" title="输入模式">
        <span class="chat-context-picker-tool-icon">${icon("select")}</span>
      </button>
      <button class="chat-context-picker-tool-button chat-context-picker-tool-button-list" type="button" data-action="toggle-list" aria-label="查看选择列表" title="查看选择列表">
        <span class="chat-context-picker-tool-icon">${icon("list")}</span>
        <span class="chat-context-picker-count-badge" id="chat-context-picker-count-badge">0</span>
      </button>
      <div class="chat-context-picker-toolbar-separator" aria-hidden="true"></div>
      <button class="chat-context-picker-tool-button" type="button" data-action="undo-selection" aria-label="撤销" title="撤销">
        <span class="chat-context-picker-tool-icon">${icon("undo")}</span>
      </button>
      <button class="chat-context-picker-tool-button" type="button" data-action="redo-selection" aria-label="重做" title="重做">
        <span class="chat-context-picker-tool-icon">${icon("redo")}</span>
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

    if (action === "close-list") {
      setListOpen(false);
      return;
    }

    if (action === "undo-selection") {
      undoSelectionHistory();
      return;
    }

    if (action === "redo-selection") {
      redoSelectionHistory();
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
  state.undoButton = toolbar.querySelector('[data-action="undo-selection"]');
  state.redoButton = toolbar.querySelector('[data-action="redo-selection"]');
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

function ensureAdjustPopover() {
  if (state.adjustPopover) {
    return;
  }

  const popover = document.createElement("div");
  popover.className = "chat-context-picker-adjust-popover";
  popover.dataset.open = "false";
  popover.dataset.chatContextPickerUi = "true";
  popover.innerHTML = `
    <div class="chat-context-picker-adjust-header">
      <div class="chat-context-picker-adjust-title">调整样式</div>
      <button class="chat-context-picker-adjust-close" type="button" data-action="close-adjust" aria-label="关闭" title="关闭">
        <span class="chat-context-picker-adjust-close-icon">${icon("close")}</span>
      </button>
    </div>
    <div class="chat-context-picker-adjust-divider"></div>
    <div class="chat-context-picker-adjust-body">
    <div class="chat-context-picker-adjust-section">
      <div class="chat-context-picker-adjust-section-title">布局</div>
      <div class="chat-context-picker-adjust-segmented" data-control-group="layout-direction">
        <button class="chat-context-picker-adjust-segment chat-context-picker-adjust-segment-icon" type="button" data-adjust-prop="layoutDirection" data-adjust-value="none" aria-label="关闭自动布局" title="关闭自动布局">
          <span class="chat-context-picker-adjust-segment-glyph">${icon("layoutAutoNone")}</span>
        </button>
        <button class="chat-context-picker-adjust-segment chat-context-picker-adjust-segment-icon" type="button" data-adjust-prop="layoutDirection" data-adjust-value="row" aria-label="横向布局" title="横向布局">
          <span class="chat-context-picker-adjust-segment-glyph">${icon("layoutAutoRow")}</span>
        </button>
        <button class="chat-context-picker-adjust-segment chat-context-picker-adjust-segment-icon" type="button" data-adjust-prop="layoutDirection" data-adjust-value="column" aria-label="纵向布局" title="纵向布局">
          <span class="chat-context-picker-adjust-segment-glyph">${icon("layoutAutoColumn")}</span>
        </button>
      </div>
      <div class="chat-context-picker-adjust-grid chat-context-picker-adjust-grid-tight">
        <label class="chat-context-picker-adjust-input-row" data-adjust-size-row="width">
          <span class="chat-context-picker-adjust-input-prefix">W</span>
          <span class="chat-context-picker-adjust-input-divider" aria-hidden="true"></span>
          <input class="chat-context-picker-adjust-inline-input" type="text" inputmode="decimal" min="0" step="1" data-chat-context-picker-numeric="true" data-adjust-input="width" />
          <button class="chat-context-picker-adjust-input-suffix-button" type="button" data-action="open-size-menu" data-size-prop="width" aria-label="选择宽度模式" title="选择宽度模式">
            <span class="chat-context-picker-adjust-input-suffix" aria-hidden="true">${icon("chevronDown")}</span>
          </button>
        </label>
        <label class="chat-context-picker-adjust-input-row" data-adjust-size-row="height">
          <span class="chat-context-picker-adjust-input-prefix">H</span>
          <span class="chat-context-picker-adjust-input-divider" aria-hidden="true"></span>
          <input class="chat-context-picker-adjust-inline-input" type="text" inputmode="decimal" min="0" step="1" data-chat-context-picker-numeric="true" data-adjust-input="height" />
          <button class="chat-context-picker-adjust-input-suffix-button" type="button" data-action="open-size-menu" data-size-prop="height" aria-label="选择高度模式" title="选择高度模式">
            <span class="chat-context-picker-adjust-input-suffix" aria-hidden="true">${icon("chevronDown")}</span>
          </button>
        </label>
      </div>
      <div class="chat-context-picker-adjust-layout-row">
        <div class="chat-context-picker-adjust-align-grid" data-control-group="alignment-grid">
          <button class="chat-context-picker-adjust-align-cell" type="button" data-adjust-horizontal="left" data-adjust-vertical="top" aria-label="左上对齐" title="左上对齐"><span class="chat-context-picker-adjust-align-dot"></span></button>
          <button class="chat-context-picker-adjust-align-cell" type="button" data-adjust-horizontal="center" data-adjust-vertical="top" aria-label="上方居中" title="上方居中"><span class="chat-context-picker-adjust-align-dot"></span></button>
          <button class="chat-context-picker-adjust-align-cell" type="button" data-adjust-horizontal="right" data-adjust-vertical="top" aria-label="右上对齐" title="右上对齐"><span class="chat-context-picker-adjust-align-dot"></span></button>
          <button class="chat-context-picker-adjust-align-cell" type="button" data-adjust-horizontal="left" data-adjust-vertical="center" aria-label="左侧居中" title="左侧居中"><span class="chat-context-picker-adjust-align-dot"></span></button>
          <button class="chat-context-picker-adjust-align-cell" type="button" data-adjust-horizontal="center" data-adjust-vertical="center" aria-label="居中对齐" title="居中对齐"><span class="chat-context-picker-adjust-align-dot"></span></button>
          <button class="chat-context-picker-adjust-align-cell" type="button" data-adjust-horizontal="right" data-adjust-vertical="center" aria-label="右侧居中" title="右侧居中"><span class="chat-context-picker-adjust-align-dot"></span></button>
          <button class="chat-context-picker-adjust-align-cell" type="button" data-adjust-horizontal="left" data-adjust-vertical="bottom" aria-label="左下对齐" title="左下对齐"><span class="chat-context-picker-adjust-align-dot"></span></button>
          <button class="chat-context-picker-adjust-align-cell" type="button" data-adjust-horizontal="center" data-adjust-vertical="bottom" aria-label="下方居中" title="下方居中"><span class="chat-context-picker-adjust-align-dot"></span></button>
          <button class="chat-context-picker-adjust-align-cell" type="button" data-adjust-horizontal="right" data-adjust-vertical="bottom" aria-label="右下对齐" title="右下对齐"><span class="chat-context-picker-adjust-align-dot"></span></button>
        </div>
        <label class="chat-context-picker-adjust-input-row chat-context-picker-adjust-input-row-tall" data-adjust-gap-row="true">
          <span class="chat-context-picker-adjust-input-icon" aria-hidden="true">${icon("gap")}</span>
          <span class="chat-context-picker-adjust-input-divider" aria-hidden="true"></span>
          <input class="chat-context-picker-adjust-inline-input" type="text" inputmode="decimal" min="0" step="1" data-chat-context-picker-numeric="true" data-adjust-input="gap" />
          <button class="chat-context-picker-adjust-input-suffix-button" type="button" data-action="open-gap-menu" aria-label="选择间距模式" title="选择间距模式" aria-haspopup="menu" aria-expanded="false">
            <span class="chat-context-picker-adjust-input-suffix" aria-hidden="true">${icon("chevronDown")}</span>
          </button>
        </label>
      </div>
      <div class="chat-context-picker-adjust-grid chat-context-picker-adjust-grid-tight">
        <label class="chat-context-picker-adjust-input-row">
          <span class="chat-context-picker-adjust-input-icon" aria-hidden="true">${icon("padLeft")}</span>
          <span class="chat-context-picker-adjust-input-divider" aria-hidden="true"></span>
          <input class="chat-context-picker-adjust-inline-input" type="text" inputmode="decimal" min="0" step="1" data-chat-context-picker-numeric="true" data-adjust-input="paddingLeft" />
        </label>
        <label class="chat-context-picker-adjust-input-row">
          <span class="chat-context-picker-adjust-input-icon" aria-hidden="true">${icon("padTop")}</span>
          <span class="chat-context-picker-adjust-input-divider" aria-hidden="true"></span>
          <input class="chat-context-picker-adjust-inline-input" type="text" inputmode="decimal" min="0" step="1" data-chat-context-picker-numeric="true" data-adjust-input="paddingTop" />
        </label>
        <label class="chat-context-picker-adjust-input-row">
          <span class="chat-context-picker-adjust-input-icon" aria-hidden="true">${icon("padRight")}</span>
          <span class="chat-context-picker-adjust-input-divider" aria-hidden="true"></span>
          <input class="chat-context-picker-adjust-inline-input" type="text" inputmode="decimal" min="0" step="1" data-chat-context-picker-numeric="true" data-adjust-input="paddingRight" />
        </label>
        <label class="chat-context-picker-adjust-input-row">
          <span class="chat-context-picker-adjust-input-icon" aria-hidden="true">${icon("padBottom")}</span>
          <span class="chat-context-picker-adjust-input-divider" aria-hidden="true"></span>
          <input class="chat-context-picker-adjust-inline-input" type="text" inputmode="decimal" min="0" step="1" data-chat-context-picker-numeric="true" data-adjust-input="paddingBottom" />
        </label>
      </div>
    </div>
    <div class="chat-context-picker-adjust-divider"></div>
    <div class="chat-context-picker-adjust-section">
      <div class="chat-context-picker-adjust-section-title">外观</div>
      <div class="chat-context-picker-adjust-grid chat-context-picker-adjust-grid-tight">
        <label class="chat-context-picker-adjust-input-row">
          <span class="chat-context-picker-adjust-input-icon" aria-hidden="true">${icon("opacity")}</span>
          <span class="chat-context-picker-adjust-input-divider" aria-hidden="true"></span>
          <input class="chat-context-picker-adjust-inline-input" type="text" inputmode="decimal" min="0" max="100" step="1" data-chat-context-picker-numeric="true" data-adjust-input="opacity" />
        </label>
        <label class="chat-context-picker-adjust-input-row">
          <span class="chat-context-picker-adjust-input-icon" aria-hidden="true">${icon("borderRadius")}</span>
          <span class="chat-context-picker-adjust-input-divider" aria-hidden="true"></span>
          <input class="chat-context-picker-adjust-inline-input" type="text" inputmode="decimal" min="0" step="1" data-chat-context-picker-numeric="true" data-adjust-input="borderRadius" />
        </label>
      </div>
    </div>
    <div class="chat-context-picker-adjust-divider"></div>
    <div class="chat-context-picker-adjust-section">
      <div class="chat-context-picker-adjust-section-header">
        <div class="chat-context-picker-adjust-section-title">颜色</div>
        <button class="chat-context-picker-adjust-section-action" type="button" data-action="add-fill" aria-label="添加颜色" title="添加颜色">
          <span class="chat-context-picker-adjust-section-action-icon">${icon("plus")}</span>
        </button>
      </div>
      <div class="chat-context-picker-adjust-stack" data-adjust-stack="fill">
        <div class="chat-context-picker-adjust-style-row chat-context-picker-adjust-fill-row" data-adjust-row="fill">
          <span class="chat-context-picker-adjust-fill-prefix">
            <button class="chat-context-picker-adjust-swatch-button" type="button" data-action="open-fill-picker" aria-label="选择填充颜色" title="选择填充颜色">
              <span class="chat-context-picker-adjust-swatch" data-adjust-swatch="backgroundColor"></span>
              <input class="chat-context-picker-adjust-native-color" type="color" data-adjust-input="backgroundColor" />
            </button>
          </span>
          <span class="chat-context-picker-adjust-input-divider" aria-hidden="true"></span>
          <input class="chat-context-picker-adjust-style-input" type="text" data-adjust-text="backgroundColor" spellcheck="false" />
          <span class="chat-context-picker-adjust-input-divider" aria-hidden="true"></span>
          <label class="chat-context-picker-adjust-style-alpha-field">
            <input class="chat-context-picker-adjust-style-alpha-input" type="text" inputmode="decimal" min="0" max="100" step="1" data-chat-context-picker-numeric="true" data-adjust-alpha="backgroundColor" />
            <span class="chat-context-picker-adjust-style-alpha-label">%</span>
          </label>
          <span class="chat-context-picker-adjust-input-divider" aria-hidden="true"></span>
          <button class="chat-context-picker-adjust-row-action" type="button" data-action="toggle-fill-visibility" aria-label="显示或隐藏填充" title="显示或隐藏填充">
            <span class="chat-context-picker-adjust-row-action-icon">${icon("eye")}</span>
          </button>
          <button class="chat-context-picker-adjust-row-action" type="button" data-action="clear-fill" aria-label="移除填充" title="移除填充">
            <span class="chat-context-picker-adjust-row-action-icon">${icon("minus")}</span>
          </button>
        </div>
      </div>
    </div>
    <div class="chat-context-picker-adjust-divider"></div>
    <div class="chat-context-picker-adjust-section">
      <div class="chat-context-picker-adjust-section-header">
        <div class="chat-context-picker-adjust-section-title">阴影</div>
        <button class="chat-context-picker-adjust-section-action" type="button" data-action="add-shadow" aria-label="添加阴影" title="添加阴影">
          <span class="chat-context-picker-adjust-section-action-icon">${icon("plus")}</span>
        </button>
      </div>
      <div class="chat-context-picker-adjust-stack" data-adjust-stack="shadow">
        <div class="chat-context-picker-adjust-style-row" data-action="set-shadow-type" data-shadow-type="outer" data-adjust-row="shadow-outer" role="button" tabindex="0">
          <span class="chat-context-picker-adjust-shadow-preview chat-context-picker-adjust-shadow-preview-outer"></span>
          <span class="chat-context-picker-adjust-input-divider" aria-hidden="true"></span>
          <div class="chat-context-picker-adjust-style-label">外阴影</div>
          <button class="chat-context-picker-adjust-row-action" type="button" data-action="toggle-shadow-visibility" data-shadow-type="outer" aria-label="显示或隐藏外阴影" title="显示或隐藏外阴影">
            <span class="chat-context-picker-adjust-row-action-icon">${icon("eye")}</span>
          </button>
          <button class="chat-context-picker-adjust-row-action" type="button" data-action="clear-shadow" data-shadow-type="outer" aria-label="移除外阴影" title="移除外阴影">
            <span class="chat-context-picker-adjust-row-action-icon">${icon("minus")}</span>
          </button>
        </div>
        <div class="chat-context-picker-adjust-style-row" data-action="set-shadow-type" data-shadow-type="inner" data-adjust-row="shadow-inner" role="button" tabindex="0">
          <span class="chat-context-picker-adjust-shadow-preview chat-context-picker-adjust-shadow-preview-inner"></span>
          <span class="chat-context-picker-adjust-input-divider" aria-hidden="true"></span>
          <div class="chat-context-picker-adjust-style-label">内阴影</div>
          <button class="chat-context-picker-adjust-row-action" type="button" data-action="toggle-shadow-visibility" data-shadow-type="inner" aria-label="显示或隐藏内阴影" title="显示或隐藏内阴影">
            <span class="chat-context-picker-adjust-row-action-icon">${icon("eye")}</span>
          </button>
          <button class="chat-context-picker-adjust-row-action" type="button" data-action="clear-shadow" data-shadow-type="inner" aria-label="移除内阴影" title="移除内阴影">
            <span class="chat-context-picker-adjust-row-action-icon">${icon("minus")}</span>
          </button>
        </div>
      </div>
    </div>
    </div>
  `;

  popover.addEventListener("click", (event) => {
    event.stopPropagation();
    const selectionRow = event.target?.closest?.("[data-adjust-selection-key]");
    const hitSelectionGutter = selectionRow && shouldSelectAdjustLayerRowFromClick(event, selectionRow);
    if (hitSelectionGutter) {
      event.preventDefault();
      selectAdjustLayerRow(selectionRow, { shiftKey: event.shiftKey });
      return;
    }

    const actionTarget = event.target?.closest?.("[data-action]");
    const segment = event.target?.closest?.("[data-adjust-prop]");
    const isInteractiveTarget = Boolean(
      event.target?.closest?.('button, input, textarea, select, label, [contenteditable="true"], [data-adjust-prop], [data-adjust-horizontal][data-adjust-vertical]')
    );

    if (state.adjustLayerSelectionKeys.length && !isInteractiveTarget && !hitSelectionGutter) {
      clearAdjustLayerSelection();
    }

    if (segment) {
      applyAdjustControl(segment.dataset.adjustProp, segment.dataset.adjustValue || "", { commit: true });
      return;
    }

    const alignButton = event.target?.closest?.("[data-adjust-horizontal][data-adjust-vertical]");
    if (alignButton) {
      applyAdjustAlignment(
        alignButton.dataset.adjustHorizontal,
        alignButton.dataset.adjustVertical,
        { commit: true }
      );
      return;
    }

    const action = actionTarget?.dataset?.action;
    if (!action) {
      return;
    }

    if (action === "close-adjust") {
      closeAdjustPopover();
      return;
    }

    if (action === "open-size-menu") {
      const sizeProp = actionTarget.dataset.sizeProp === "height" ? "height" : "width";
      if (state.sizeMenu?.dataset.open === "true" && state.sizeMenuProp === sizeProp) {
        closeSizeMenu();
        return;
      }
      openSizeMenu(sizeProp, actionTarget.closest("[data-adjust-size-row]")?.getBoundingClientRect() || actionTarget.getBoundingClientRect());
      return;
    }

    if (action === "open-gap-menu") {
      if (state.gapMenu?.dataset.open === "true") {
        closeGapMenu();
        return;
      }
      openGapMenu(actionTarget.closest("[data-adjust-gap-row]")?.getBoundingClientRect() || actionTarget.getBoundingClientRect());
      return;
    }

    if (action === "open-fill-picker") {
      const persistedTarget = ensureAdjustLayerState(state.adjustTarget);
      if (persistedTarget) {
        persistedTarget.adjustFillEnabled = true;
        persistedTarget.adjustFillVisible = true;
        if (!persistedTarget.adjustStoredBackgroundColor) {
          persistedTarget.adjustStoredBackgroundColor = DEFAULT_BASE_FILL_CSS;
        }
        if (!persistedTarget.adjustStoredBackgroundHex) {
          persistedTarget.adjustStoredBackgroundHex = DEFAULT_BASE_FILL_HEX;
        }
        applyFillLayerState(persistedTarget);
        syncAdjustPopoverFromTarget(persistedTarget);
        renderSelection();
      }
      openFillPopover(actionTarget.getBoundingClientRect());
      return;
    }

    if (action === "open-fill-overlay-picker") {
      const index = Number.parseInt(actionTarget.dataset.overlayIndex || "-1", 10);
      if (index >= 0) {
        openFillPopover(actionTarget.getBoundingClientRect(), { overlayIndex: index });
      }
      return;
    }

    if (action === "add-fill") {
      const anchorRect = actionTarget.getBoundingClientRect();
      const persistedTarget = ensureAdjustLayerState(state.adjustTarget);
      if (persistedTarget.adjustFillEnabled) {
        persistedTarget.adjustFillOverlayLayers = [{
          visible: true,
          colorHex: DEFAULT_FILL_HEX,
          colorCss: DEFAULT_FILL_CSS
        }, ...(persistedTarget.adjustFillOverlayLayers || [])];
      } else {
        persistedTarget.adjustFillEnabled = true;
        persistedTarget.adjustFillVisible = true;
        persistedTarget.adjustFillType = "color";
        persistedTarget.adjustStoredBackgroundColor = DEFAULT_BASE_FILL_CSS;
        persistedTarget.adjustStoredBackgroundHex = DEFAULT_BASE_FILL_HEX;
        persistedTarget.adjustStoredBackgroundImage = "";
        persistedTarget.adjustFillOverlayLayers = [];
      }
      applyFillLayerState(persistedTarget);
      refreshAdjustPromptText(persistedTarget);
      syncAdjustPopoverFromTarget(persistedTarget);
      renderSelection();
      commitAdjustChanges();
      if (persistedTarget.adjustFillOverlayLayers?.length) {
        const row = state.adjustPopover?.querySelector?.('[data-adjust-row="fill-overlay"][data-overlay-index="0"]');
        openFillPopover(row?.getBoundingClientRect?.() || anchorRect, { overlayIndex: 0 });
      } else {
        const row = state.adjustPopover?.querySelector?.('[data-adjust-row="fill"]');
        openFillPopover(row?.getBoundingClientRect?.() || anchorRect);
      }
      return;
    }

    if (action === "toggle-fill-visibility") {
      toggleBackgroundVisibility();
      return;
    }

    if (action === "clear-fill") {
      clearBackgroundFill();
      return;
    }

    if (action === "toggle-fill-overlay-visibility") {
      const persistedTarget = ensureAdjustLayerState(state.adjustTarget);
      const index = Number.parseInt(actionTarget.dataset.overlayIndex || "-1", 10);
      const layer = persistedTarget.adjustFillOverlayLayers?.[index];
      if (layer) {
        layer.visible = layer.visible === false;
        applyFillLayerState(persistedTarget);
        refreshAdjustPromptText(persistedTarget);
        syncAdjustPopoverFromTarget(persistedTarget);
        renderSelection();
        commitAdjustChanges();
      }
      return;
    }

    if (action === "clear-fill-overlay") {
      const persistedTarget = ensureAdjustLayerState(state.adjustTarget);
      const index = Number.parseInt(actionTarget.dataset.overlayIndex || "-1", 10);
      if (index >= 0) {
        persistedTarget.adjustFillOverlayLayers = (persistedTarget.adjustFillOverlayLayers || []).filter((_, itemIndex) => itemIndex !== index);
        applyFillLayerState(persistedTarget);
        refreshAdjustPromptText(persistedTarget);
        syncAdjustPopoverFromTarget(persistedTarget);
        renderSelection();
        commitAdjustChanges();
      }
      return;
    }

    if (action === "add-shadow") {
      const anchorRect = actionTarget.getBoundingClientRect();
      const persistedTarget = ensureAdjustLayerState(state.adjustTarget);
      persistedTarget.adjustAddedOuterShadowLayers = [
        normalizeShadowLayerEntry({ type: "outer", visible: true, config: getDefaultShadowConfig("outer") }, "outer"),
        ...(persistedTarget.adjustAddedOuterShadowLayers || [])
      ];
      persistedTarget.adjustShadowActiveLayer = "outer";
      applyShadowLayerState(persistedTarget);
      refreshAdjustPromptText(persistedTarget);
      syncAdjustPopoverFromTarget(persistedTarget);
      renderSelection();
      commitAdjustChanges();
      openShadowPopover("outer", anchorRect, { overlayIndex: 0 });
      return;
    }

    if (action === "toggle-shadow-visibility") {
      toggleShadowType(actionTarget.dataset.shadowType || "outer");
      return;
    }

    if (action === "toggle-shadow-overlay-visibility") {
      const persistedTarget = ensureAdjustLayerState(state.adjustTarget);
      const index = Number.parseInt(actionTarget.dataset.overlayIndex || "-1", 10);
      const layer = persistedTarget.adjustAddedOuterShadowLayers?.[index];
      if (layer) {
        layer.visible = layer.visible === false;
        applyShadowLayerState(persistedTarget);
        refreshAdjustPromptText(persistedTarget);
        syncAdjustPopoverFromTarget(persistedTarget);
        renderSelection();
        commitAdjustChanges();
      }
      return;
    }

    if (action === "clear-shadow-overlay") {
      const persistedTarget = ensureAdjustLayerState(state.adjustTarget);
      const index = Number.parseInt(actionTarget.dataset.overlayIndex || "-1", 10);
      if (index >= 0) {
        persistedTarget.adjustAddedOuterShadowLayers = (persistedTarget.adjustAddedOuterShadowLayers || []).filter((_, itemIndex) => itemIndex !== index);
        applyShadowLayerState(persistedTarget);
        refreshAdjustPromptText(persistedTarget);
        syncAdjustPopoverFromTarget(persistedTarget);
        renderSelection();
        commitAdjustChanges();
      }
      return;
    }

    if (action === "clear-shadow") {
      const persistedTarget = ensureAdjustLayerState(state.adjustTarget);
      const isInner = actionTarget.dataset.shadowType === "inner";
      const enabledKey = isInner ? "adjustShadowInnerEnabled" : "adjustShadowOuterEnabled";
      const visibleKey = isInner ? "adjustShadowInnerVisible" : "adjustShadowOuterVisible";
      persistedTarget[enabledKey] = false;
      persistedTarget[visibleKey] = false;
      if (isInner) {
        persistedTarget.adjustShadowInnerConfig = getDefaultShadowConfig("inner");
      } else {
        persistedTarget.adjustShadowOuterConfig = getDefaultShadowConfig("outer");
        persistedTarget.adjustAddedOuterShadowLayers = [];
      }
      if (persistedTarget.adjustShadowActiveLayer === actionTarget.dataset.shadowType) {
        persistedTarget.adjustShadowActiveLayer = persistedTarget.adjustShadowOuterEnabled
          ? "outer"
          : persistedTarget.adjustShadowInnerEnabled
            ? "inner"
            : "outer";
      }
      applyShadowLayerState(persistedTarget);
      refreshAdjustPromptText(persistedTarget);
      syncAdjustPopoverFromTarget(persistedTarget);
      renderSelection();
      commitAdjustChanges();
      return;
    }

    if (action === "open-shadow-overlay") {
      const shadowType = actionTarget.dataset.shadowType || "outer";
      const overlayIndex = Number.parseInt(actionTarget.dataset.overlayIndex || "-1", 10);
      if (overlayIndex >= 0) {
        const anchor = actionTarget.closest?.("[data-adjust-row]") || actionTarget;
        openShadowPopover(shadowType, anchor.getBoundingClientRect(), { overlayIndex });
      }
      return;
    }

    if (action === "set-shadow-type") {
      const anchor = actionTarget.closest?.("[data-adjust-row]") || actionTarget;
      const anchorRect = anchor.getBoundingClientRect();
      const persistedTarget = ensureAdjustLayerState(state.adjustTarget);
      const shadowType = actionTarget.dataset.shadowType || "outer";
      persistedTarget.adjustShadowActiveLayer = shadowType;
      openShadowPopover(shadowType, anchorRect);
    }
  });

  popover.addEventListener("keydown", (event) => {
    const actionTarget = event.target?.closest?.('[data-action="set-shadow-type"], [data-action="open-shadow-overlay"]');
    if (!actionTarget) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const anchor = actionTarget.closest?.("[data-adjust-row]") || actionTarget;
      const anchorRect = anchor.getBoundingClientRect();
      if (actionTarget.dataset.action === "open-shadow-overlay") {
        const overlayIndex = Number.parseInt(actionTarget.dataset.overlayIndex || "-1", 10);
        if (overlayIndex >= 0) {
          openShadowPopover(actionTarget.dataset.shadowType || "outer", anchorRect, { overlayIndex });
        }
        return;
      }
      const persistedTarget = ensureAdjustLayerState(state.adjustTarget);
      const shadowType = actionTarget.dataset.shadowType || "outer";
      persistedTarget.adjustShadowActiveLayer = shadowType;
      openShadowPopover(shadowType, anchorRect);
    }
  });

  popover.addEventListener("input", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    if (input.dataset.adjustInput === "backgroundColor") {
      updateAdjustFillColorValue({ hex: input.value, commit: false, sync: false });
      return;
    }

    if (input.dataset.adjustOverlayInput === "backgroundColor") {
      const index = Number.parseInt(input.dataset.overlayIndex || "-1", 10);
      if (index >= 0) {
        updateAdjustFillColorValue({ overlayIndex: index, hex: input.value, commit: false, sync: false });
      }
      return;
    }

    if (input.dataset.adjustText === "backgroundColor") {
      if (!input.value.trim()) {
        return;
      }
      const parsed = parseAdjustColorInputValue(input.value);
      if (!parsed) {
        return;
      }
      if (state.adjustControls.backgroundColorInput) {
        state.adjustControls.backgroundColorInput.value = parsed.hex;
      }
      updateAdjustFillColorValue({ hex: parsed.hex, alpha: parsed.alpha * 100, commit: false, sync: false });
      return;
    }

    if (input.dataset.adjustOverlayText === "backgroundColor") {
      const index = Number.parseInt(input.dataset.overlayIndex || "-1", 10);
      const parsed = parseAdjustColorInputValue(input.value);
      if (index >= 0 && parsed) {
        const colorInput = state.adjustPopover?.querySelector?.(`[data-adjust-overlay-input="backgroundColor"][data-overlay-index="${index}"]`);
        if (colorInput) {
          colorInput.value = parsed.hex;
        }
        updateAdjustFillColorValue({ overlayIndex: index, hex: parsed.hex, alpha: parsed.alpha * 100, commit: false, sync: false });
      }
      return;
    }

    if (input.dataset.adjustAlpha === "backgroundColor") {
      updateAdjustFillColorValue({ alpha: input.value, commit: false, sync: false });
      return;
    }

    if (input.dataset.adjustOverlayAlpha === "backgroundColor") {
      const index = Number.parseInt(input.dataset.overlayIndex || "-1", 10);
      if (index >= 0) {
        updateAdjustFillColorValue({ overlayIndex: index, alpha: input.value, commit: false, sync: false });
      }
      return;
    }

    if (input.dataset.adjustInput) {
      if (input.dataset.adjustInput === "width" || input.dataset.adjustInput === "height") {
        applyAdjustSizeMode(input.dataset.adjustInput, "fixed", { commit: false, sync: false });
      }
      applyAdjustControl(input.dataset.adjustInput, input.value, { commit: false, sync: true });
    }
  });

  popover.addEventListener("change", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    if (input.dataset.adjustInput === "backgroundColor") {
      updateAdjustFillColorValue({ hex: input.value, commit: true });
      return;
    }

    if (input.dataset.adjustOverlayInput === "backgroundColor") {
      const index = Number.parseInt(input.dataset.overlayIndex || "-1", 10);
      if (index >= 0) {
        updateAdjustFillColorValue({ overlayIndex: index, hex: input.value, commit: true });
      }
      return;
    }

    if (input.dataset.adjustText === "backgroundColor") {
      if (!input.value.trim()) {
        clearBackgroundFill();
        return;
      }
      const parsed = parseAdjustColorInputValue(input.value);
      if (parsed) {
        input.value = formatAdjustColorHexValue(parsed.css);
        updateAdjustFillColorValue({ hex: parsed.hex, alpha: parsed.alpha * 100, commit: true });
      }
      return;
    }

    if (input.dataset.adjustOverlayText === "backgroundColor") {
      const index = Number.parseInt(input.dataset.overlayIndex || "-1", 10);
      const parsed = parseAdjustColorInputValue(input.value);
      if (index >= 0 && parsed) {
        input.value = formatAdjustColorHexValue(parsed.css);
        updateAdjustFillColorValue({ overlayIndex: index, hex: parsed.hex, alpha: parsed.alpha * 100, commit: true });
      }
      return;
    }

    if (input.dataset.adjustAlpha === "backgroundColor") {
      input.value = String(clampNumber(input.value, 0, 100, 100));
      updateAdjustFillColorValue({ alpha: input.value, commit: true });
      return;
    }

    if (input.dataset.adjustOverlayAlpha === "backgroundColor") {
      const index = Number.parseInt(input.dataset.overlayIndex || "-1", 10);
      if (index >= 0) {
        input.value = String(clampNumber(input.value, 0, 100, 100));
        updateAdjustFillColorValue({ overlayIndex: index, alpha: input.value, commit: true });
      }
      return;
    }

    if (input.dataset.adjustInput) {
      if (input.dataset.adjustInput === "width" || input.dataset.adjustInput === "height") {
        applyAdjustSizeMode(input.dataset.adjustInput, "fixed", { commit: false, sync: false });
      }
      applyAdjustControl(input.dataset.adjustInput, input.value, { commit: true, sync: true });
    }
  });

  document.documentElement.appendChild(popover);
  enableSingleClickSelectAll(popover);
  bindAdjustHighlightSuppression(popover);
  state.adjustPopover = popover;
  state.adjustControls = {
    body: popover.querySelector(".chat-context-picker-adjust-body"),
    fillStack: popover.querySelector('[data-adjust-stack="fill"]'),
    backgroundColorInput: popover.querySelector('[data-adjust-input="backgroundColor"]'),
    backgroundColorText: popover.querySelector('[data-adjust-text="backgroundColor"]'),
    backgroundColorAlpha: popover.querySelector('[data-adjust-alpha="backgroundColor"]'),
    backgroundColorRow: popover.querySelector('[data-adjust-row="fill"]'),
    backgroundColorSwatch: popover.querySelector('[data-adjust-swatch="backgroundColor"]'),
    widthRow: popover.querySelector('[data-adjust-size-row="width"]'),
    width: popover.querySelector('[data-adjust-input="width"]'),
    heightRow: popover.querySelector('[data-adjust-size-row="height"]'),
    height: popover.querySelector('[data-adjust-input="height"]'),
    gapRow: popover.querySelector('[data-adjust-gap-row="true"]'),
    borderRadius: popover.querySelector('[data-adjust-input="borderRadius"]'),
    opacity: popover.querySelector('[data-adjust-input="opacity"]'),
    gap: popover.querySelector('[data-adjust-input="gap"]'),
    paddingTop: popover.querySelector('[data-adjust-input="paddingTop"]'),
    paddingRight: popover.querySelector('[data-adjust-input="paddingRight"]'),
    paddingBottom: popover.querySelector('[data-adjust-input="paddingBottom"]'),
    paddingLeft: popover.querySelector('[data-adjust-input="paddingLeft"]'),
    shadowStack: popover.querySelector('[data-adjust-stack="shadow"]'),
    outerShadowRow: popover.querySelector('[data-adjust-row="shadow-outer"]'),
    innerShadowRow: popover.querySelector('[data-adjust-row="shadow-inner"]')
  };
  renderAdjustLayerRows(state.adjustTarget);
}

function ensureSizeMenu() {
  if (state.sizeMenu) {
    return;
  }

  const menu = document.createElement("div");
  menu.className = "chat-context-picker-size-menu";
  menu.dataset.open = "false";
  menu.dataset.chatContextPickerUi = "true";
  menu.innerHTML = `
    <button class="chat-context-picker-size-menu-item" type="button" data-action="select-size-mode" data-size-mode="hug">
      <span class="chat-context-picker-size-menu-item-label">Hug</span>
      <span class="chat-context-picker-size-menu-item-meta">自适应</span>
    </button>
    <button class="chat-context-picker-size-menu-item" type="button" data-action="select-size-mode" data-size-mode="fixed">
      <span class="chat-context-picker-size-menu-item-label">Fixed</span>
      <span class="chat-context-picker-size-menu-item-meta">固定</span>
    </button>
    <button class="chat-context-picker-size-menu-item" type="button" data-action="select-size-mode" data-size-mode="fill">
      <span class="chat-context-picker-size-menu-item-label">Fill</span>
      <span class="chat-context-picker-size-menu-item-meta">填满</span>
    </button>
  `;

  menu.addEventListener("click", (event) => {
    event.stopPropagation();
    const actionTarget = event.target?.closest?.("[data-action]");
    if (!actionTarget) {
      return;
    }

    if (actionTarget.dataset.action === "select-size-mode") {
      applyAdjustSizeMode(state.sizeMenuProp, actionTarget.dataset.sizeMode, { commit: true });
      closeSizeMenu();
    }
  });

  document.documentElement.appendChild(menu);
  bindAdjustHighlightSuppression(menu);
  state.sizeMenu = menu;
  state.sizeMenuControls = {
    items: [...menu.querySelectorAll("[data-size-mode]")]
  };
}

function ensureGapMenu() {
  if (state.gapMenu) {
    return;
  }

  const menu = document.createElement("div");
  menu.className = "chat-context-picker-gap-menu";
  menu.dataset.open = "false";
  menu.dataset.chatContextPickerUi = "true";
  menu.innerHTML = `
    <button class="chat-context-picker-gap-menu-item" type="button" data-action="select-gap-mode" data-gap-mode="gap">
      <span class="chat-context-picker-gap-menu-item-label">Gap</span>
      <span class="chat-context-picker-gap-menu-item-meta" data-gap-menu-meta="gap">0</span>
    </button>
    <button class="chat-context-picker-gap-menu-item" type="button" data-action="select-gap-mode" data-gap-mode="auto">
      <span class="chat-context-picker-gap-menu-item-label">Auto</span>
      <span class="chat-context-picker-gap-menu-item-meta">space between</span>
    </button>
    <button class="chat-context-picker-gap-menu-item" type="button" data-action="select-gap-mode" data-gap-mode="special">
      <span class="chat-context-picker-gap-menu-item-label">Special</span>
      <span class="chat-context-picker-gap-menu-item-meta">space around</span>
    </button>
  `;

  menu.addEventListener("click", (event) => {
    event.stopPropagation();
    const actionTarget = event.target?.closest?.("[data-action]");
    if (!actionTarget) {
      return;
    }

    if (actionTarget.dataset.action === "select-gap-mode") {
      applyAdjustGapMode(actionTarget.dataset.gapMode, { commit: true });
      closeGapMenu();
    }
  });

  document.documentElement.appendChild(menu);
  bindAdjustHighlightSuppression(menu);
  state.gapMenu = menu;
  state.gapMenuControls = {
    items: [...menu.querySelectorAll("[data-gap-mode]")],
    gapMeta: menu.querySelector('[data-gap-menu-meta="gap"]')
  };
}

function ensureFillPopover() {
  if (state.fillPopover) {
    return;
  }

  const popover = document.createElement("div");
  popover.className = "chat-context-picker-fill-popover";
  popover.dataset.open = "false";
  popover.dataset.chatContextPickerUi = "true";
  popover.innerHTML = `
    <div class="chat-context-picker-fill-header">
      <div class="chat-context-picker-fill-title">颜色属性</div>
      <button class="chat-context-picker-fill-close" type="button" data-action="close-fill-popover" aria-label="关闭" title="关闭">
        <span class="chat-context-picker-fill-close-icon">${icon("close")}</span>
      </button>
    </div>
    <div class="chat-context-picker-fill-body">
      <div class="chat-context-picker-fill-segmented">
        <button class="chat-context-picker-fill-segment" type="button" data-fill-mode="solid">实色</button>
        <button class="chat-context-picker-fill-segment" type="button" data-fill-mode="gradient">渐变</button>
      </div>
      <div class="chat-context-picker-fill-gradient-controls" data-fill-gradient-controls hidden>
        <label class="chat-context-picker-fill-angle-field">
          <span class="chat-context-picker-fill-angle-icon">${icon("circleDot")}</span>
          <span class="chat-context-picker-fill-angle-divider" aria-hidden="true"></span>
          <input class="chat-context-picker-fill-angle-input" type="text" inputmode="decimal" min="-360" max="360" step="1" data-chat-context-picker-numeric="true" data-fill-input="angle" />
          <span class="chat-context-picker-fill-angle-label">°</span>
        </label>
        <div class="chat-context-picker-fill-gradient-actions">
          <button class="chat-context-picker-fill-action" type="button" data-action="add-fill-stop" aria-label="增加渐变节点" title="增加渐变节点">
            <span class="chat-context-picker-fill-action-icon">${icon("plus")}</span>
          </button>
          <button class="chat-context-picker-fill-action" type="button" data-action="swap-fill-stops" aria-label="调转渐变位置" title="调转渐变位置">
            <span class="chat-context-picker-fill-action-icon">${icon("arrowLeftRight")}</span>
          </button>
        </div>
      </div>
      <div class="chat-context-picker-fill-gradient-strip" data-fill-gradient-strip hidden>
        <div class="chat-context-picker-fill-gradient-strip-track" data-fill-gradient-track></div>
        <div class="chat-context-picker-fill-gradient-stop-layer" data-fill-gradient-stops></div>
      </div>
      <div class="chat-context-picker-fill-sv-panel" data-fill-drag="sv">
        <div class="chat-context-picker-fill-sv-white"></div>
        <div class="chat-context-picker-fill-sv-black"></div>
        <div class="chat-context-picker-fill-sv-thumb" data-fill-marker="sv"></div>
      </div>
      <div class="chat-context-picker-fill-slider-group">
        <button class="chat-context-picker-fill-tool-button" type="button" data-action="pick-fill-screen-color" aria-label="从屏幕取色" title="从屏幕取色">
          <span class="chat-context-picker-fill-tool-icon">${icon("pipette")}</span>
        </button>
        <div class="chat-context-picker-fill-slider-stack">
          <div class="chat-context-picker-fill-slider">
            <div class="chat-context-picker-fill-slider-track chat-context-picker-fill-slider-track-hue"></div>
            <input class="chat-context-picker-fill-slider-native" type="range" min="0" max="360" step="1" data-fill-slider-input="hue" aria-label="调整色相" />
          </div>
          <div class="chat-context-picker-fill-slider">
            <div class="chat-context-picker-fill-slider-track chat-context-picker-fill-slider-track-alpha"></div>
            <input class="chat-context-picker-fill-slider-native" type="range" min="0" max="100" step="1" data-fill-slider-input="alpha" aria-label="调整透明度" />
          </div>
        </div>
      </div>
      <div class="chat-context-picker-fill-format-row">
        <div class="chat-context-picker-fill-format-picker" data-fill-format-picker>
          <button class="chat-context-picker-fill-format-trigger" type="button" data-action="toggle-fill-format-menu" aria-haspopup="menu" aria-expanded="false">
            <span class="chat-context-picker-fill-format-label" data-fill-format-label>Hex</span>
            <span class="chat-context-picker-fill-format-trigger-icon">${icon("chevronDown")}</span>
          </button>
          <div class="chat-context-picker-fill-format-menu" data-fill-format-menu hidden>
            <button class="chat-context-picker-fill-format-option" type="button" data-fill-format-option="hex">Hex</button>
            <button class="chat-context-picker-fill-format-option" type="button" data-fill-format-option="rgb">RGB</button>
            <button class="chat-context-picker-fill-format-option" type="button" data-fill-format-option="hsl">HSL</button>
          </div>
        </div>
        <input class="chat-context-picker-fill-value-input" type="text" data-fill-text="value" spellcheck="false" />
        <div class="chat-context-picker-fill-triplet-field" data-fill-triplet-field hidden>
          <input class="chat-context-picker-fill-triplet-input" type="text" inputmode="decimal" data-chat-context-picker-numeric="true" data-fill-triplet-index="0" />
          <span class="chat-context-picker-fill-triplet-divider" aria-hidden="true"></span>
          <input class="chat-context-picker-fill-triplet-input" type="text" inputmode="decimal" data-chat-context-picker-numeric="true" data-fill-triplet-index="1" />
          <span class="chat-context-picker-fill-triplet-divider" aria-hidden="true"></span>
          <input class="chat-context-picker-fill-triplet-input" type="text" inputmode="decimal" data-chat-context-picker-numeric="true" data-fill-triplet-index="2" />
        </div>
        <label class="chat-context-picker-fill-alpha-field">
          <input class="chat-context-picker-fill-alpha-input" type="text" inputmode="decimal" min="0" max="100" step="1" data-chat-context-picker-numeric="true" data-fill-input="alpha" />
          <span class="chat-context-picker-fill-alpha-label">%</span>
        </label>
      </div>
    </div>
  `;

  popover.addEventListener("click", (event) => {
    event.stopPropagation();
    const actionTarget = event.target?.closest?.("[data-action], [data-fill-mode], [data-fill-format-option], [data-fill-stop-index]");
    if (!actionTarget) {
      if (
        state.fillPopoverFormatMenuOpen &&
        !(event.target instanceof Element && event.target.closest("[data-fill-format-picker]"))
      ) {
        state.fillPopoverFormatMenuOpen = false;
        renderFillPopoverControls();
      }
      return;
    }

    if (actionTarget.dataset.action === "close-fill-popover") {
      closeFillPopover();
      return;
    }

    if (actionTarget.dataset.action === "toggle-fill-format-menu") {
      state.fillPopoverFormatMenuOpen = !state.fillPopoverFormatMenuOpen;
      renderFillPopoverControls();
      return;
    }

    if (actionTarget.dataset.action === "add-fill-stop") {
      addFillPopoverGradientStop();
      return;
    }

    if (actionTarget.dataset.action === "swap-fill-stops") {
      swapFillPopoverGradientStops();
      return;
    }

    if (actionTarget.dataset.action === "pick-fill-screen-color") {
      pickFillPopoverScreenColor();
      return;
    }

    if (actionTarget.dataset.fillMode) {
      setFillPopoverMode(actionTarget.dataset.fillMode, { commit: true, sync: true });
      return;
    }

    if (actionTarget.dataset.fillFormatOption) {
      state.fillPopoverFormat = ["hex", "rgb", "hsl"].includes(actionTarget.dataset.fillFormatOption)
        ? actionTarget.dataset.fillFormatOption
        : "hex";
      state.fillPopoverFormatMenuOpen = false;
      renderFillPopoverControls();
      return;
    }

    if (actionTarget.dataset.fillStopIndex) {
      state.fillPopoverGradientActiveStop = clampNumber(
        Number.parseInt(actionTarget.dataset.fillStopIndex || "0", 10),
        0,
        Math.max(0, (state.fillPopoverGradientStops?.length || 1) - 1),
        0
      );
      renderFillPopoverControls();
    }
  });

  popover.addEventListener("input", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    if (input.dataset.fillTripletIndex) {
      const activeColor = getActiveFillPopoverColor();
      const parsed = parseFillPopoverTripletValue(
        state.fillControls.tripletInputs?.map((field) => field.value),
        state.fillPopoverFormat,
        activeColor?.a
      );
      if (!parsed) {
        return;
      }
      setActiveFillPopoverColor(parsed, { commit: false, sync: false });
      return;
    }

    if (input.dataset.fillText === "value") {
      const activeColor = getActiveFillPopoverColor();
      const parsed = parseFillPopoverColorValue(input.value, state.fillPopoverFormat, activeColor?.a);
      if (!parsed) {
        return;
      }
      setActiveFillPopoverColor(parsed, { commit: false, sync: false });
      return;
    }

    if (input.dataset.fillInput === "alpha") {
      setActiveFillPopoverColor({ a: clampNumber(input.value, 0, 100, 100) / 100 }, { commit: false, sync: false });
      return;
    }

    if (input.dataset.fillSliderInput === "hue") {
      setActiveFillPopoverColor({ h: clampNumber(input.value, 0, 360, 0) }, { commit: false, sync: false });
      return;
    }

    if (input.dataset.fillSliderInput === "alpha") {
      setActiveFillPopoverColor({ a: clampNumber(input.value, 0, 100, 100) / 100 }, { commit: false, sync: false });
      return;
    }

    if (input.dataset.fillInput === "angle") {
      state.fillPopoverGradientAngle = clampNumber(input.value, -360, 360, 0);
      applyFillPopoverState({ commit: false, sync: false });
    }
  });

  popover.addEventListener("change", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    if (input.dataset.fillTripletIndex) {
      const activeColor = getActiveFillPopoverColor();
      const parsed = parseFillPopoverTripletValue(
        state.fillControls.tripletInputs?.map((field) => field.value),
        state.fillPopoverFormat,
        activeColor?.a
      );
      if (!parsed) {
        syncFillPopoverFromTarget(state.adjustTarget);
        return;
      }
      setActiveFillPopoverColor(parsed, { commit: true, sync: true });
      return;
    }

    if (input.dataset.fillText === "value") {
      const activeColor = getActiveFillPopoverColor();
      const parsed = parseFillPopoverColorValue(input.value, state.fillPopoverFormat, activeColor?.a);
      if (!parsed) {
        syncFillPopoverFromTarget(state.adjustTarget);
        return;
      }
      setActiveFillPopoverColor(parsed, { commit: true, sync: true });
      return;
    }

    if (input.dataset.fillInput === "alpha") {
      input.value = String(clampNumber(input.value, 0, 100, 100));
      setActiveFillPopoverColor({ a: Number.parseFloat(input.value) / 100 }, { commit: true, sync: true });
      return;
    }

    if (input.dataset.fillSliderInput === "hue") {
      input.value = String(clampNumber(input.value, 0, 360, 0));
      setActiveFillPopoverColor({ h: Number.parseFloat(input.value) }, { commit: true, sync: true });
      return;
    }

    if (input.dataset.fillSliderInput === "alpha") {
      input.value = String(clampNumber(input.value, 0, 100, 100));
      setActiveFillPopoverColor({ a: Number.parseFloat(input.value) / 100 }, { commit: true, sync: true });
      return;
    }

    if (input.dataset.fillInput === "angle") {
      input.value = String(clampNumber(input.value, -360, 360, 0));
      state.fillPopoverGradientAngle = clampNumber(input.value, -360, 360, 0);
      applyFillPopoverState({ commit: true, sync: true });
    }
  });

  popover.addEventListener("pointerdown", (event) => {
    const stopButton = event.target instanceof Element ? event.target.closest("[data-fill-stop-index]") : null;
    if (stopButton) {
      event.preventDefault();
      event.stopPropagation();
      state.fillPopoverGradientActiveStop = clampNumber(
        Number.parseInt(stopButton.dataset.fillStopIndex || "0", 10),
        0,
        Math.max(0, (state.fillPopoverGradientStops?.length || 1) - 1),
        0
      );
      beginFillPopoverDrag("gradient-stop", event, { stopIndex: state.fillPopoverGradientActiveStop });
      return;
    }

    const sliderInput = event.target instanceof Element ? event.target.closest("[data-fill-slider-input]") : null;
    if (sliderInput) {
      event.stopPropagation();
    }

    const dragTarget = event.target instanceof Element ? event.target.closest("[data-fill-drag]") : null;
    if (!dragTarget) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    beginFillPopoverDrag(dragTarget.dataset.fillDrag, event);
  });

  document.documentElement.appendChild(popover);
  enableSingleClickSelectAll(popover);
  bindAdjustHighlightSuppression(popover);
  state.fillPopover = popover;
  state.fillControls = {
    modeSolid: popover.querySelector('[data-fill-mode="solid"]'),
    modeGradient: popover.querySelector('[data-fill-mode="gradient"]'),
    gradientControls: popover.querySelector('[data-fill-gradient-controls]'),
    gradientStrip: popover.querySelector('[data-fill-gradient-strip]'),
    gradientTrack: popover.querySelector('[data-fill-gradient-track]'),
    gradientStopsLayer: popover.querySelector('[data-fill-gradient-stops]'),
    svPanel: popover.querySelector('[data-fill-drag="sv"]'),
    svThumb: popover.querySelector('[data-fill-marker="sv"]'),
    hueTrack: popover.querySelector('.chat-context-picker-fill-slider-track-hue'),
    hueInput: popover.querySelector('[data-fill-slider-input="hue"]'),
    alphaTrack: popover.querySelector('.chat-context-picker-fill-slider-track-alpha'),
    alphaSliderInput: popover.querySelector('[data-fill-slider-input="alpha"]'),
    angleInput: popover.querySelector('[data-fill-input="angle"]'),
    valueInput: popover.querySelector('[data-fill-text="value"]'),
    tripletField: popover.querySelector('[data-fill-triplet-field]'),
    tripletInputs: [...popover.querySelectorAll('[data-fill-triplet-index]')],
    alphaInput: popover.querySelector('[data-fill-input="alpha"]'),
    formatPicker: popover.querySelector('[data-fill-format-picker]'),
    formatTrigger: popover.querySelector('[data-action="toggle-fill-format-menu"]'),
    formatLabel: popover.querySelector('[data-fill-format-label]'),
    formatMenu: popover.querySelector('[data-fill-format-menu]'),
    formatOptions: [...popover.querySelectorAll('[data-fill-format-option]')]
  };
}

function ensureShadowPopover() {
  if (state.shadowPopover) {
    return;
  }

  const popover = document.createElement("div");
  popover.className = "chat-context-picker-shadow-popover";
  popover.dataset.open = "false";
  popover.dataset.chatContextPickerUi = "true";
  popover.innerHTML = `
    <div class="chat-context-picker-shadow-header">
      <div class="chat-context-picker-shadow-title">阴影属性</div>
      <button class="chat-context-picker-shadow-close" type="button" data-action="close-shadow-popover" aria-label="关闭" title="关闭">
        <span class="chat-context-picker-shadow-close-icon">${icon("close")}</span>
      </button>
    </div>
    <div class="chat-context-picker-shadow-segmented">
      <button class="chat-context-picker-shadow-segment" type="button" data-shadow-popover-type="outer">外阴影</button>
      <button class="chat-context-picker-shadow-segment" type="button" data-shadow-popover-type="inner">内阴影</button>
    </div>
    <div class="chat-context-picker-shadow-grid">
      <label class="chat-context-picker-shadow-input-row">
        <span class="chat-context-picker-shadow-input-prefix">X</span>
        <span class="chat-context-picker-shadow-input-divider" aria-hidden="true"></span>
        <input class="chat-context-picker-shadow-input" type="text" inputmode="decimal" step="1" data-chat-context-picker-numeric="true" data-shadow-input="x" />
      </label>
      <label class="chat-context-picker-shadow-input-row">
        <span class="chat-context-picker-shadow-input-prefix">Y</span>
        <span class="chat-context-picker-shadow-input-divider" aria-hidden="true"></span>
        <input class="chat-context-picker-shadow-input" type="text" inputmode="decimal" step="1" data-chat-context-picker-numeric="true" data-shadow-input="y" />
      </label>
    </div>
    <label class="chat-context-picker-shadow-input-row">
      <span class="chat-context-picker-shadow-input-icon" aria-hidden="true">${icon("shadowBlur")}</span>
      <span class="chat-context-picker-shadow-input-divider" aria-hidden="true"></span>
      <input class="chat-context-picker-shadow-input" type="text" inputmode="decimal" min="0" step="1" data-chat-context-picker-numeric="true" data-shadow-input="blur" />
    </label>
    <div class="chat-context-picker-shadow-color-row">
      <button class="chat-context-picker-shadow-swatch-button" type="button" data-action="open-shadow-color-picker" aria-label="选择阴影颜色" title="选择阴影颜色">
        <span class="chat-context-picker-shadow-swatch"></span>
        <input class="chat-context-picker-shadow-native-color" type="color" data-shadow-input="color" />
      </button>
      <span class="chat-context-picker-shadow-input-divider" aria-hidden="true"></span>
      <input class="chat-context-picker-shadow-text-input" type="text" data-shadow-text="color" spellcheck="false" />
      <input class="chat-context-picker-shadow-percent-input" type="text" inputmode="decimal" min="0" max="100" step="1" data-chat-context-picker-numeric="true" data-shadow-input="alpha" />
      <span class="chat-context-picker-shadow-percent-label">%</span>
    </div>
  `;

  popover.addEventListener("click", (event) => {
    event.stopPropagation();
    const actionTarget = event.target?.closest?.("[data-action], [data-shadow-popover-type]");
    if (!actionTarget) {
      return;
    }

    if (actionTarget.dataset.action === "close-shadow-popover") {
      closeShadowPopover();
      return;
    }

    if (actionTarget.dataset.action === "open-shadow-color-picker") {
      state.shadowControls.colorInput?.click();
      return;
    }

    if (actionTarget.dataset.shadowPopoverType) {
      setShadowPopoverType(actionTarget.dataset.shadowPopoverType, {
        ensureEnabled: true,
        commit: true,
        syncAdjust: true
      });
    }
  });

  popover.addEventListener("input", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    if (input.dataset.shadowInput === "color") {
      if (state.shadowControls.colorText) {
        state.shadowControls.colorText.value = input.value.replace(/^#/, "").toUpperCase();
      }
      applyShadowPopoverInput("color", input.value, { commit: false, sync: true });
      return;
    }

    if (input.dataset.shadowText === "color") {
      const normalized = normalizeHexColor(input.value);
      if (!normalized) {
        return;
      }
      if (state.shadowControls.colorInput) {
        state.shadowControls.colorInput.value = normalized;
      }
      applyShadowPopoverInput("color", normalized, { commit: false, sync: true });
      return;
    }

    if (input.dataset.shadowInput) {
      applyShadowPopoverInput(input.dataset.shadowInput, input.value, { commit: false, sync: true });
    }
  });

  popover.addEventListener("change", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    if (input.dataset.shadowInput === "color") {
      applyShadowPopoverInput("color", input.value, { commit: true, sync: true });
      return;
    }

    if (input.dataset.shadowText === "color") {
      const normalized = normalizeHexColor(input.value);
      if (!normalized) {
        return;
      }
      input.value = normalized.replace(/^#/, "").toUpperCase();
      applyShadowPopoverInput("color", normalized, { commit: true, sync: true });
      return;
    }

    if (input.dataset.shadowInput) {
      applyShadowPopoverInput(input.dataset.shadowInput, input.value, { commit: true, sync: true });
    }
  });

  document.documentElement.appendChild(popover);
  enableSingleClickSelectAll(popover);
  bindAdjustHighlightSuppression(popover);
  state.shadowPopover = popover;
  state.shadowControls = {
    colorInput: popover.querySelector('[data-shadow-input="color"]'),
    colorText: popover.querySelector('[data-shadow-text="color"]'),
    alpha: popover.querySelector('[data-shadow-input="alpha"]'),
    x: popover.querySelector('[data-shadow-input="x"]'),
    y: popover.querySelector('[data-shadow-input="y"]'),
    blur: popover.querySelector('[data-shadow-input="blur"]'),
    swatch: popover.querySelector(".chat-context-picker-shadow-swatch"),
    segments: [...popover.querySelectorAll("[data-shadow-popover-type]")]
  };
}
