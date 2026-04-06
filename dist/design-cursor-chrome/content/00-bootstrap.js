// Bootstrap shared state plus the icon and mode registries used across the picker.
window.__chatContextPickerLoaded = true;

const state = {
  active: false,
  listOpen: false,
  highlightsVisible: false,
  hoveredTarget: null,
  hoveredSelectedTarget: null,
  selectedTargets: [],
  selectionMode: "adjust",
  toolbar: null,
  list: null,
  countLabel: null,
  countBadge: null,
  listTrigger: null,
  copyButton: null,
  clearButton: null,
  undoButton: null,
  redoButton: null,
  modeButtons: [],
  overlayLayer: null,
  promptPopover: null,
  promptTextarea: null,
  promptChips: null,
  promptTarget: null,
  promptDraftValue: "",
  promptSavedSelectionMode: null,
  adjustPopover: null,
  adjustTarget: null,
  adjustTargetHighlightSuppressed: false,
  adjustTargetHighlightPointerActive: false,
  adjustControls: {},
  adjustStyleBaseline: null,
  adjustLayerSelectionKind: null,
  adjustLayerSelectionKeys: [],
  adjustLayerSelectionAnchorKey: null,
  adjustLayerClipboard: null,
  sizeMenu: null,
  sizeMenuControls: {},
  sizeMenuProp: null,
  sizeMenuAnchorRect: null,
  gapMenu: null,
  gapMenuControls: {},
  gapMenuAnchorRect: null,
  fillPopover: null,
  fillControls: {},
  fillPopoverOverlayIndex: null,
  fillPopoverAnchorRect: null,
  fillPopoverMode: "solid",
  fillPopoverFormat: "hex",
  fillPopoverFormatMenuOpen: false,
  fillPopoverGradientStops: null,
  fillPopoverGradientActiveStop: 0,
  fillPopoverGradientAngle: 0,
  fillPopoverSolidColor: null,
  fillPopoverDragSession: null,
  shadowPopover: null,
  shadowControls: {},
  shadowPopoverType: "outer",
  shadowPopoverOverlayIndex: null,
  shadowPopoverAnchorRect: null,
  adjustShadowHydrationTimer: null,
  adjustLayerIdCounter: 0,
  hoveredNumberInput: null,
  altKeyPressed: false,
  numberDragSession: null,
  dragSession: null,
  layoutInsertHint: null,
  suppressClickUntil: 0,
  toastTimer: null,
  historyPast: [],
  historyFuture: []
};

const ICONS = {
  browse: `
    <svg class="lucide lucide-mouse-pointer-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z" />
    </svg>
  `,
  select: `
    <svg class="lucide lucide-message-circle-plus" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  `,
  layout: `
    <svg class="lucide lucide-panels-top-left" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  `,
  list: `
    <svg class="lucide lucide-list-checks" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M13 5h8" />
      <path d="M13 12h8" />
      <path d="M13 19h8" />
      <path d="m3 17 2 2 4-4" />
      <path d="m3 7 2 2 4-4" />
    </svg>
  `,
  close: `
    <svg class="lucide lucide-x" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  `,
  copy: `
    <svg class="lucide lucide-copy" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  `,
  pipette: `
    <svg class="lucide lucide-pipette" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="m12 9-8.414 8.414A2 2 0 0 0 3 18.828v1.344a2 2 0 0 1-.586 1.414A2 2 0 0 1 3.828 21h1.344a2 2 0 0 0 1.414-.586L15 12" />
      <path d="m18 9 .4.4a1 1 0 1 1-3 3l-3.8-3.8a1 1 0 1 1 3-3l.4.4 3.4-3.4a1 1 0 1 1 3 3z" />
      <path d="m2 22 .414-.414" />
    </svg>
  `,
  edit: `
    <svg class="lucide lucide-square-pen" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.375 2.625a1.5 1.5 0 1 1 2.121 2.121L12 13.242l-4 1 1-4Z" />
    </svg>
  `,
  trash: `
    <svg class="lucide lucide-trash-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  `,
  clear: `
    <svg class="lucide lucide-trash-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  `,
  empty: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M7 8H17" />
      <path d="M7 12H13" />
      <path d="M7 16H11" />
    </svg>
  `,
  inbox: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M22 12H16L14 15H10L8 12H2" />
      <path d="M5.45 5.11L2 12V19A2 2 0 0 0 4 21H20A2 2 0 0 0 22 19V12L18.55 5.11A2 2 0 0 0 16.76 4H7.24A2 2 0 0 0 5.45 5.11Z" />
    </svg>
  `,
  plus: `
    <svg class="lucide lucide-plus" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  `,
  circleDot: `
    <svg class="lucide lucide-circle-dot" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  `,
  arrowLeftRight: `
    <svg class="lucide lucide-arrow-left-right" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M8 3 4 7l4 4" />
      <path d="M4 7h16" />
      <path d="m16 21 4-4-4-4" />
      <path d="M20 17H4" />
    </svg>
  `,
  layoutSelect: `
    <svg class="lucide lucide-grid-2x2-check" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 3v17a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1H3" />
      <path d="m16 19 2 2 4-4" />
    </svg>
  `,
  undo: `
    <svg class="lucide lucide-undo-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" />
    </svg>
  `,
  redo: `
    <svg class="lucide lucide-redo-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="m15 14 5-5-5-5" />
      <path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13" />
    </svg>
  `,
  chevronDown: `
    <svg class="lucide lucide-chevron-down" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  `,
  eye: `
    <svg class="lucide lucide-eye" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  `,
  eyeOff: `
    <svg class="lucide lucide-eye-off" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M10.733 5.076A10.744 10.744 0 0 1 12 5c4.596 0 8.51 2.973 9.938 7.106.091.264.091.528 0 .79a10.96 10.96 0 0 1-4.24 5.146" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499A10.94 10.94 0 0 1 12 19c-4.596 0-8.51-2.973-9.938-7.106a1 1 0 0 1 0-.788A10.98 10.98 0 0 1 6.521 5.5" />
      <path d="m2 2 20 20" />
    </svg>
  `,
  minus: `
    <svg class="lucide lucide-minus" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
    </svg>
  `,
  layoutAutoNone: `
    <svg class="lucide lucide-layout-dashboard" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  `,
  layoutAutoColumn: `
    <svg class="lucide lucide-layout-panel-left" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect width="7" height="18" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
    </svg>
  `,
  layoutAutoRow: `
    <svg class="lucide lucide-layout-panel-top" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect width="18" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
    </svg>
  `,
  opacity: `
    <svg class="lucide lucide-droplet" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
    </svg>
  `,
  shadowBlur: `
    <svg class="lucide lucide-circle-dot-dashed" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M10.1 2.18a9.93 9.93 0 0 1 3.8 0" />
      <path d="M17.6 3.71a9.95 9.95 0 0 1 2.69 2.7" />
      <path d="M21.82 10.1a9.93 9.93 0 0 1 0 3.8" />
      <path d="M20.29 17.6a9.95 9.95 0 0 1-2.7 2.69" />
      <path d="M13.9 21.82a9.94 9.94 0 0 1-3.8 0" />
      <path d="M6.4 20.29a9.95 9.95 0 0 1-2.69-2.7" />
      <path d="M2.18 13.9a9.93 9.93 0 0 1 0-3.8" />
      <path d="M3.71 6.4a9.95 9.95 0 0 1 2.7-2.69" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  `,
  borderRadius: `
    <svg class="lucide lucide-square-round-corner" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 11a8 8 0 0 0-8-8" />
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    </svg>
  `,
  gap: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 9 11" fill="none" aria-hidden="true">
      <path d="M0.5 0C0.776142 0 1 0.223858 1 0.5V10.5C1 10.7761 0.776142 11 0.5 11C0.223858 11 0 10.7761 0 10.5V0.5C0 0.223858 0.223858 0 0.5 0ZM8.5 0C8.77614 0 9 0.223858 9 0.5V10.5C9 10.7761 8.77614 11 8.5 11C8.22386 11 8 10.7761 8 10.5V0.5C8 0.223858 8.22386 0 8.5 0ZM5 2.5C5.82843 2.5 6.5 3.17157 6.5 4V7C6.5 7.82843 5.82843 8.5 5 8.5H4C3.17157 8.5 2.5 7.82843 2.5 7V4C2.5 3.17157 3.17157 2.5 4 2.5H5ZM4 3.5C3.72386 3.5 3.5 3.72386 3.5 4V7C3.5 7.27614 3.72386 7.5 4 7.5H5C5.27614 7.5 5.5 7.27614 5.5 7V4C5.5 3.72386 5.27614 3.5 5 3.5H4Z" fill="currentColor" />
    </svg>
  `,
  padTop: `
    <svg class="lucide lucide-panel-top" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 9h18" />
    </svg>
  `,
  padRight: `
    <svg class="lucide lucide-panel-right" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M15 3v18" />
    </svg>
  `,
  padBottom: `
    <svg class="lucide lucide-panel-bottom" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 15h18" />
    </svg>
  `,
  padLeft: `
    <svg class="lucide lucide-panel-left" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18" />
    </svg>
  `
};

const MODE_LABELS = {
  browse: "浏览模式",
  select: "输入模式",
  layout: "排版模式",
  adjust: "调整模式"
};

function icon(name) {
  return ICONS[name] || "";
}
