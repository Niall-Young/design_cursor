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
    adjustControls: {},
    adjustStyleBaseline: null,
    sizeMenu: null,
    sizeMenuControls: {},
    sizeMenuProp: null,
    sizeMenuAnchorRect: null,
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
    hoveredNumberInput: null,
    altKeyPressed: false,
    numberDragSession: null,
    dragSession: null,
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
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 11 11" fill="none" aria-hidden="true">
        <path d="M3.5 2C4.32843 2 5 2.67157 5 3.5V9.5C5 10.3284 4.32843 11 3.5 11H2.5C1.67157 11 1 10.3284 1 9.5V3.5C1 2.67157 1.67157 2 2.5 2H3.5ZM2.5 3C2.22386 3 2 3.22386 2 3.5V9.5C2 9.77614 2.22386 10 2.5 10H3.5C3.77614 10 4 9.77614 4 9.5V3.5C4 3.22386 3.77614 3 3.5 3H2.5ZM8.5 2C9.32843 2 10 2.67157 10 3.5V6C10 6.82843 9.32843 7.5 8.5 7.5H7.5C6.67157 7.5 6 6.82843 6 6V3.5C6 2.67157 6.67157 2 7.5 2H8.5ZM7.5 3C7.22386 3 7 3.22386 7 3.5V6C7 6.27614 7.22386 6.5 7.5 6.5H8.5C8.77614 6.5 9 6.27614 9 6V3.5C9 3.22386 8.77614 3 8.5 3H7.5ZM10.5 0C10.7761 0 11 0.223858 11 0.5C11 0.776142 10.7761 1 10.5 1H0.5C0.223858 1 0 0.776142 0 0.5C0 0.223858 0.223858 0 0.5 0H10.5Z" fill="currentColor" />
      </svg>
    `,
    padRight: `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 11 11" fill="none" aria-hidden="true">
        <path d="M10.5 10C10.7761 10 11 10.2239 11 10.5C11 10.7761 10.7761 11 10.5 11H0.5C0.223858 11 0 10.7761 0 10.5C0 10.2239 0.223858 10 0.5 10H10.5ZM3.5 0C4.32843 0 5 0.671573 5 1.5V7.5C5 8.32843 4.32843 9 3.5 9H2.5C1.67157 9 1 8.32843 1 7.5V1.5C1 0.671573 1.67157 0 2.5 0H3.5ZM8.5 3.5C9.32843 3.5 10 4.17157 10 5V7.5C10 8.32843 9.32843 9 8.5 9H7.5C6.67157 9 6 8.32843 6 7.5V5C6 4.17157 6.67157 3.5 7.5 3.5H8.5ZM2.5 1C2.22386 1 2 1.22386 2 1.5V7.5C2 7.77614 2.22386 8 2.5 8H3.5C3.77614 8 4 7.77614 4 7.5V1.5C4 1.22386 3.77614 1 3.5 1H2.5ZM7.5 4.5C7.22386 4.5 7 4.72386 7 5V7.5C7 7.77614 7.22386 8 7.5 8H8.5C8.77614 8 9 7.77614 9 7.5V5C9 4.72386 8.77614 4.5 8.5 4.5H7.5Z" fill="currentColor" />
      </svg>
    `,
    padBottom: `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 11 11" fill="none" aria-hidden="true">
        <path d="M10.5 0C10.7761 0 11 0.223858 11 0.5V10.5C11 10.7761 10.7761 11 10.5 11C10.2239 11 10 10.7761 10 10.5V0.5C10 0.223858 10.2239 0 10.5 0ZM7.5 6C8.32843 6 9 6.67157 9 7.5V8.5C9 9.32843 8.32843 10 7.5 10H5C4.17157 10 3.5 9.32843 3.5 8.5V7.5C3.5 6.67157 4.17157 6 5 6H7.5ZM5 7C4.72386 7 4.5 7.22386 4.5 7.5V8.5C4.5 8.77614 4.72386 9 5 9H7.5C7.77614 9 8 8.77614 8 8.5V7.5C8 7.22386 7.77614 7 7.5 7H5ZM7.5 1C8.32843 1 9 1.67157 9 2.5V3.5C9 4.32843 8.32843 5 7.5 5H1.5C0.671573 5 0 4.32843 0 3.5V2.5C0 1.67157 0.671573 1 1.5 1H7.5ZM1.5 2C1.22386 2 1 2.22386 1 2.5V3.5C1 3.77614 1.22386 4 1.5 4H7.5C7.77614 4 8 3.77614 8 3.5V2.5C8 2.22386 7.77614 2 7.5 2H1.5Z" fill="currentColor" />
      </svg>
    `,
    padLeft: `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 11 11" fill="none" aria-hidden="true">
        <path d="M0.5 0C0.776142 0 1 0.223858 1 0.5V10.5C1 10.7761 0.776142 11 0.5 11C0.223858 11 0 10.7761 0 10.5V0.5C0 0.223858 0.223858 0 0.5 0ZM6 6C6.82843 6 7.5 6.67157 7.5 7.5V8.5C7.5 9.32843 6.82843 10 6 10H3.5C2.67157 10 2 9.32843 2 8.5V7.5C2 6.67157 2.67157 6 3.5 6H6ZM3.5 7C3.22386 7 3 7.22386 3 7.5V8.5C3 8.77614 3.22386 9 3.5 9H6C6.27614 9 6.5 8.77614 6.5 8.5V7.5C6.5 7.22386 6.27614 7 6 7H3.5ZM9.5 1C10.3284 1 11 1.67157 11 2.5V3.5C11 4.32843 10.3284 5 9.5 5H3.5C2.67157 5 2 4.32843 2 3.5V2.5C2 1.67157 2.67157 1 3.5 1H9.5ZM3.5 2C3.22386 2 3 2.22386 3 2.5V3.5C3 3.77614 3.22386 4 3.5 4H9.5C9.77614 4 10 3.77614 10 3.5V2.5C10 2.22386 9.77614 2 9.5 2H3.5Z" fill="currentColor" />
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
        <button class="chat-context-picker-tool-button" type="button" data-action="set-mode" data-mode="select" aria-label="输入模式" title="输入模式">
          <span class="chat-context-picker-tool-icon">${icon("select")}</span>
        </button>
        <button class="chat-context-picker-tool-button" type="button" data-action="set-mode" data-mode="layout" aria-label="排版模式" title="排版模式">
          <span class="chat-context-picker-tool-icon">${icon("layout")}</span>
        </button>
        <button class="chat-context-picker-tool-button" type="button" data-action="set-mode" data-mode="adjust" aria-label="调整模式" title="调整模式">
          <span class="chat-context-picker-tool-icon">${icon("layoutSelect")}</span>
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
            <input class="chat-context-picker-adjust-inline-input" type="number" min="0" step="1" data-adjust-input="width" />
            <button class="chat-context-picker-adjust-input-suffix-button" type="button" data-action="open-size-menu" data-size-prop="width" aria-label="选择宽度模式" title="选择宽度模式">
              <span class="chat-context-picker-adjust-input-suffix" aria-hidden="true">${icon("chevronDown")}</span>
            </button>
          </label>
          <label class="chat-context-picker-adjust-input-row" data-adjust-size-row="height">
            <span class="chat-context-picker-adjust-input-prefix">H</span>
            <span class="chat-context-picker-adjust-input-divider" aria-hidden="true"></span>
            <input class="chat-context-picker-adjust-inline-input" type="number" min="0" step="1" data-adjust-input="height" />
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
          <label class="chat-context-picker-adjust-input-row chat-context-picker-adjust-input-row-tall">
            <span class="chat-context-picker-adjust-input-icon" aria-hidden="true">${icon("gap")}</span>
            <span class="chat-context-picker-adjust-input-divider" aria-hidden="true"></span>
            <input class="chat-context-picker-adjust-inline-input" type="number" min="0" step="1" data-adjust-input="gap" />
            <span class="chat-context-picker-adjust-input-suffix" aria-hidden="true">${icon("chevronDown")}</span>
          </label>
        </div>
        <div class="chat-context-picker-adjust-grid chat-context-picker-adjust-grid-tight">
          <label class="chat-context-picker-adjust-input-row">
            <span class="chat-context-picker-adjust-input-icon" aria-hidden="true">${icon("padLeft")}</span>
            <span class="chat-context-picker-adjust-input-divider" aria-hidden="true"></span>
            <input class="chat-context-picker-adjust-inline-input" type="number" min="0" step="1" data-adjust-input="paddingLeft" />
          </label>
          <label class="chat-context-picker-adjust-input-row">
            <span class="chat-context-picker-adjust-input-icon" aria-hidden="true">${icon("padTop")}</span>
            <span class="chat-context-picker-adjust-input-divider" aria-hidden="true"></span>
            <input class="chat-context-picker-adjust-inline-input" type="number" min="0" step="1" data-adjust-input="paddingTop" />
          </label>
          <label class="chat-context-picker-adjust-input-row">
            <span class="chat-context-picker-adjust-input-icon" aria-hidden="true">${icon("padRight")}</span>
            <span class="chat-context-picker-adjust-input-divider" aria-hidden="true"></span>
            <input class="chat-context-picker-adjust-inline-input" type="number" min="0" step="1" data-adjust-input="paddingRight" />
          </label>
          <label class="chat-context-picker-adjust-input-row">
            <span class="chat-context-picker-adjust-input-icon" aria-hidden="true">${icon("padBottom")}</span>
            <span class="chat-context-picker-adjust-input-divider" aria-hidden="true"></span>
            <input class="chat-context-picker-adjust-inline-input" type="number" min="0" step="1" data-adjust-input="paddingBottom" />
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
            <input class="chat-context-picker-adjust-inline-input" type="number" min="0" max="100" step="1" data-adjust-input="opacity" />
          </label>
          <label class="chat-context-picker-adjust-input-row">
            <span class="chat-context-picker-adjust-input-icon" aria-hidden="true">${icon("borderRadius")}</span>
            <span class="chat-context-picker-adjust-input-divider" aria-hidden="true"></span>
            <input class="chat-context-picker-adjust-inline-input" type="number" min="0" step="1" data-adjust-input="borderRadius" />
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
              <input class="chat-context-picker-adjust-style-alpha-input" type="number" min="0" max="100" step="1" data-adjust-alpha="backgroundColor" />
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
      const actionTarget = event.target?.closest?.("[data-action]");
      const segment = event.target?.closest?.("[data-adjust-prop]");
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

      if (action === "open-fill-picker") {
        const persistedTarget = ensureAdjustLayerState(state.adjustTarget);
        if (persistedTarget) {
          persistedTarget.adjustFillEnabled = true;
          persistedTarget.adjustFillVisible = true;
          if (!persistedTarget.adjustStoredBackgroundColor) {
            persistedTarget.adjustStoredBackgroundColor = DEFAULT_FILL_CSS;
          }
          if (!persistedTarget.adjustStoredBackgroundHex) {
            persistedTarget.adjustStoredBackgroundHex = DEFAULT_FILL_HEX;
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
          persistedTarget.adjustStoredBackgroundColor = DEFAULT_FILL_CSS;
          persistedTarget.adjustStoredBackgroundHex = DEFAULT_FILL_HEX;
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
          openShadowPopover(shadowType, actionTarget.getBoundingClientRect(), { overlayIndex });
        }
        return;
      }

      if (action === "set-shadow-type") {
        const anchorRect = actionTarget.getBoundingClientRect();
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
        const anchorRect = actionTarget.getBoundingClientRect();
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
          applyAdjustSizeMode(input.dataset.adjustInput, "fixed", { commit: false, sync: true });
        }
        applyAdjustControl(input.dataset.adjustInput, input.value, { commit: false, sync: false });
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
          applyAdjustSizeMode(input.dataset.adjustInput, "fixed", { commit: false, sync: true });
        }
        applyAdjustControl(input.dataset.adjustInput, input.value, { commit: true });
      }
    });

    document.documentElement.appendChild(popover);
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
    state.sizeMenu = menu;
    state.sizeMenuControls = {
      items: [...menu.querySelectorAll("[data-size-mode]")]
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
            <input class="chat-context-picker-fill-angle-input" type="number" min="-360" max="360" step="1" data-fill-input="angle" />
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
            <input class="chat-context-picker-fill-triplet-input" type="number" data-fill-triplet-index="0" />
            <span class="chat-context-picker-fill-triplet-divider" aria-hidden="true"></span>
            <input class="chat-context-picker-fill-triplet-input" type="number" data-fill-triplet-index="1" />
            <span class="chat-context-picker-fill-triplet-divider" aria-hidden="true"></span>
            <input class="chat-context-picker-fill-triplet-input" type="number" data-fill-triplet-index="2" />
          </div>
          <label class="chat-context-picker-fill-alpha-field">
            <input class="chat-context-picker-fill-alpha-input" type="number" min="0" max="100" step="1" data-fill-input="alpha" />
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
        setActiveFillPopoverColor(parsed, { commit: false, sync: true });
        return;
      }

      if (input.dataset.fillText === "value") {
        const activeColor = getActiveFillPopoverColor();
        const parsed = parseFillPopoverColorValue(input.value, state.fillPopoverFormat, activeColor?.a);
        if (!parsed) {
          return;
        }
        setActiveFillPopoverColor(parsed, { commit: false, sync: true });
        return;
      }

      if (input.dataset.fillInput === "alpha") {
        setActiveFillPopoverColor({ a: clampNumber(input.value, 0, 100, 100) / 100 }, { commit: false, sync: true });
        return;
      }

      if (input.dataset.fillInput === "angle") {
        state.fillPopoverGradientAngle = clampNumber(input.value, -360, 360, 0);
        applyFillPopoverState({ commit: false, sync: true });
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

      const dragTarget = event.target instanceof Element ? event.target.closest("[data-fill-drag]") : null;
      if (!dragTarget) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      beginFillPopoverDrag(dragTarget.dataset.fillDrag, event);
    });

    document.documentElement.appendChild(popover);
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
          <input class="chat-context-picker-shadow-input" type="number" step="1" data-shadow-input="x" />
        </label>
        <label class="chat-context-picker-shadow-input-row">
          <span class="chat-context-picker-shadow-input-prefix">Y</span>
          <span class="chat-context-picker-shadow-input-divider" aria-hidden="true"></span>
          <input class="chat-context-picker-shadow-input" type="number" step="1" data-shadow-input="y" />
        </label>
      </div>
      <label class="chat-context-picker-shadow-input-row">
        <span class="chat-context-picker-shadow-input-icon" aria-hidden="true">${icon("shadowBlur")}</span>
        <span class="chat-context-picker-shadow-input-divider" aria-hidden="true"></span>
        <input class="chat-context-picker-shadow-input" type="number" min="0" step="1" data-shadow-input="blur" />
      </label>
      <div class="chat-context-picker-shadow-color-row">
        <button class="chat-context-picker-shadow-swatch-button" type="button" data-action="open-shadow-color-picker" aria-label="选择阴影颜色" title="选择阴影颜色">
          <span class="chat-context-picker-shadow-swatch"></span>
          <input class="chat-context-picker-shadow-native-color" type="color" data-shadow-input="color" />
        </button>
        <span class="chat-context-picker-shadow-input-divider" aria-hidden="true"></span>
        <input class="chat-context-picker-shadow-text-input" type="text" data-shadow-text="color" spellcheck="false" />
        <input class="chat-context-picker-shadow-percent-input" type="number" min="0" max="100" step="1" data-shadow-input="alpha" />
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

  function getTargetInstructionText(target) {
    const manualPrompt = (target.promptText || "").trim();
    const layoutPrompt = (target.layoutPromptText || "").trim();
    const adjustPrompt = (target.adjustPromptText || "").trim();
    return [manualPrompt, layoutPrompt, adjustPrompt].filter(Boolean).join("\n");
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
      promptText: getTargetInstructionText(target),
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
        const previewText = getTargetInstructionText(target) || getTargetPreviewText(target);

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
        (target.promptText || "") === (other.promptText || "")
      );
    });
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

    return false;
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

    const button = document.createElement("button");
    button.type = "button";
    button.className = "chat-context-picker-overlay-edit-badge";
    button.dataset.chatContextPickerUi = "true";
    button.setAttribute("aria-label", `编辑目标 ${index + 1}`);
    button.setAttribute("title", `编辑目标 ${index + 1}`);
    button.textContent = String(index + 1);
    button.style.left = `${rect.right}px`;
    button.style.top = `${rect.top}px`;

    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (state.selectionMode === "adjust") {
        openAdjustPopover(target, button.getBoundingClientRect());
      } else {
        openPromptPopover(target, button.getBoundingClientRect());
      }
    });

    state.overlayLayer.appendChild(button);
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
    const candidates = [
      {
        side: "right",
        left: targetRect.right + anchorGap,
        top: clampVertical(desiredTop),
        availableMain:
          window.innerWidth - viewportPadding - targetRect.right - anchorGap
      },
      {
        side: "left",
        left: targetRect.left - popoverWidth - anchorGap,
        top: clampVertical(desiredTop),
        availableMain:
          targetRect.left - viewportPadding - anchorGap
      },
      {
        side: "bottom",
        left: clampHorizontal(desiredLeft),
        top: targetRect.bottom + anchorGap,
        availableMain:
          window.innerHeight - viewportPadding - targetRect.bottom - anchorGap
      },
      {
        side: "top",
        left: clampHorizontal(desiredLeft),
        top: targetRect.top - popoverHeight - anchorGap,
        availableMain:
          targetRect.top - viewportPadding - anchorGap
      }
    ].map((candidate) => {
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
      drawHighlight(target, variant);

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
      const isStructuredContainer =
        ["flex", "inline-flex", "grid", "inline-grid"].includes(styles.display) ||
        directChildren.length >= 2;

      if (isStructuredContainer) {
        return { parent, anchorChild: current };
      }

      current = parent;
    }

    return anchorElement.parentElement
      ? { parent: anchorElement.parentElement, anchorChild: anchorElement }
      : null;
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

  const ADJUSTABLE_STYLE_PROPS = [
    "display",
    "flexDirection",
    "justifyContent",
    "alignItems",
    "alignSelf",
    "flexGrow",
    "flexBasis",
    "minWidth",
    "minHeight",
    "width",
    "height",
    "gap",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "backgroundColor",
    "backgroundImage",
    "borderRadius",
    "opacity",
    "boxShadow"
  ];

  const DEFAULT_FILL_HEX = "#000000";
  const DEFAULT_FILL_ALPHA = 0.2;
  const DEFAULT_FILL_CSS = `rgba(0, 0, 0, ${DEFAULT_FILL_ALPHA})`;
  const DEFAULT_FILL_OVERLAY_LAYER = `linear-gradient(${DEFAULT_FILL_CSS}, ${DEFAULT_FILL_CSS})`;
  const DEFAULT_SHADOW_ALPHA = 0.2;
  const DEFAULT_SHADOW_X = 0;
  const DEFAULT_SHADOW_Y = 4;
  const DEFAULT_SHADOW_BLUR = 4;

  const SHADOW_PRESETS = {
    none: "",
    outer: `${DEFAULT_SHADOW_X}px ${DEFAULT_SHADOW_Y}px ${DEFAULT_SHADOW_BLUR}px rgba(0, 0, 0, ${DEFAULT_SHADOW_ALPHA})`,
    inner: `inset ${DEFAULT_SHADOW_X}px ${DEFAULT_SHADOW_Y}px ${DEFAULT_SHADOW_BLUR}px rgba(0, 0, 0, ${DEFAULT_SHADOW_ALPHA})`
  };

  function parsePixelValue(value, fallback = 0) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
  }

  function parseLengthValue(value, basis = 0, fallback = 0) {
    if (!value) {
      return fallback;
    }

    const normalized = String(value).trim();
    if (normalized.endsWith("%")) {
      const percent = Number.parseFloat(normalized);
      return Number.isFinite(percent) ? Math.round((basis * percent) / 100) : fallback;
    }

    return parsePixelValue(normalized, fallback);
  }

  function clampNumber(value, min, max, fallback = min) {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.min(max, Math.max(min, parsed));
  }

  function normalizeHexColor(value) {
    const normalized = String(value || "").trim().replace(/^#/, "");
    if (/^[\da-fA-F]{3}$/.test(normalized)) {
      return `#${normalized
        .split("")
        .map((char) => `${char}${char}`)
        .join("")
        .toLowerCase()}`;
    }
    if (/^[\da-fA-F]{6}$/.test(normalized)) {
      return `#${normalized.toLowerCase()}`;
    }
    return "";
  }

  function clampAlpha(value, fallback = 1) {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.min(1, Math.max(0, parsed));
  }

  function formatAlphaPercent(alpha = 1) {
    return `${Math.round(clampAlpha(alpha, 1) * 100)}%`;
  }

  function parseAdjustColor(value) {
    if (!value || value === "transparent") {
      return null;
    }

    const normalizedHex = normalizeHexColor(value);
    if (normalizedHex) {
      return {
        css: normalizedHex,
        hex: normalizedHex,
        alpha: 1,
        label: `${normalizedHex.replace(/^#/, "").toUpperCase()} ${formatAlphaPercent(1)}`
      };
    }

    const match = String(value).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([.\d]+))?\)/i);
    if (!match) {
      return null;
    }

    const hex = `#${match
      .slice(1, 4)
      .map((item) => Number.parseInt(item, 10).toString(16).padStart(2, "0"))
      .join("")}`;
    const alpha = clampAlpha(match[4], 1);
    const css = alpha >= 1 ? hex : `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`;

    return {
      css,
      hex,
      alpha,
      label: `${hex.replace(/^#/, "").toUpperCase()} ${formatAlphaPercent(alpha)}`
    };
  }

  function parseAdjustColorInputValue(value) {
    const raw = String(value || "").trim();
    if (!raw) {
      return null;
    }

    const direct = parseAdjustColor(raw);
    if (direct) {
      return direct;
    }

    const match = raw.match(/^#?([\da-fA-F]{3}|[\da-fA-F]{6})(?:\s+(\d{1,3})%)?$/);
    if (!match) {
      return null;
    }

    const hex = normalizeHexColor(match[1]);
    if (!hex) {
      return null;
    }

    const alphaPercent = match[2] ? clampNumber(match[2], 0, 100, 100) : 100;
    const alpha = alphaPercent / 100;
    const red = Number.parseInt(hex.slice(1, 3), 16);
    const green = Number.parseInt(hex.slice(3, 5), 16);
    const blue = Number.parseInt(hex.slice(5, 7), 16);

    return {
      hex,
      alpha,
      css: alpha >= 1 ? hex : `rgba(${red}, ${green}, ${blue}, ${alpha})`,
      label: `${hex.replace(/^#/, "").toUpperCase()} ${formatAlphaPercent(alpha)}`
    };
  }

  function buildAdjustColorCss(hex, alpha = 1) {
    const normalizedHex = normalizeHexColor(hex) || DEFAULT_FILL_HEX;
    const normalizedAlpha = clampAlpha(alpha, 1);
    if (normalizedAlpha >= 1) {
      return normalizedHex;
    }

    const red = Number.parseInt(normalizedHex.slice(1, 3), 16);
    const green = Number.parseInt(normalizedHex.slice(3, 5), 16);
    const blue = Number.parseInt(normalizedHex.slice(5, 7), 16);
    return `rgba(${red}, ${green}, ${blue}, ${normalizedAlpha})`;
  }

  function cloneHsvaColor(color) {
    return {
      h: Number.isFinite(color?.h) ? color.h : 0,
      s: Number.isFinite(color?.s) ? color.s : 0,
      v: Number.isFinite(color?.v) ? color.v : 0,
      a: clampAlpha(color?.a, 1)
    };
  }

  function rgbToHsva(red, green, blue, alpha = 1) {
    const r = Math.min(255, Math.max(0, red)) / 255;
    const g = Math.min(255, Math.max(0, green)) / 255;
    const b = Math.min(255, Math.max(0, blue)) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    let h = 0;

    if (delta > 0) {
      if (max === r) {
        h = 60 * (((g - b) / delta) % 6);
      } else if (max === g) {
        h = 60 * ((b - r) / delta + 2);
      } else {
        h = 60 * ((r - g) / delta + 4);
      }
    }

    if (h < 0) {
      h += 360;
    }

    const s = max === 0 ? 0 : (delta / max) * 100;
    const v = max * 100;

    return {
      h,
      s,
      v,
      a: clampAlpha(alpha, 1)
    };
  }

  function hsvaToRgb(color) {
    const h = ((Number.isFinite(color?.h) ? color.h : 0) % 360 + 360) % 360;
    const s = Math.min(100, Math.max(0, Number.isFinite(color?.s) ? color.s : 0)) / 100;
    const v = Math.min(100, Math.max(0, Number.isFinite(color?.v) ? color.v : 0)) / 100;
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let rPrime = 0;
    let gPrime = 0;
    let bPrime = 0;

    if (h < 60) {
      rPrime = c;
      gPrime = x;
    } else if (h < 120) {
      rPrime = x;
      gPrime = c;
    } else if (h < 180) {
      gPrime = c;
      bPrime = x;
    } else if (h < 240) {
      gPrime = x;
      bPrime = c;
    } else if (h < 300) {
      rPrime = x;
      bPrime = c;
    } else {
      rPrime = c;
      bPrime = x;
    }

    return {
      red: Math.round((rPrime + m) * 255),
      green: Math.round((gPrime + m) * 255),
      blue: Math.round((bPrime + m) * 255)
    };
  }

  function hsvaToHex(color) {
    const { red, green, blue } = hsvaToRgb(color);
    return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
  }

  function hsvaToCss(color) {
    return buildAdjustColorCss(hsvaToHex(color), clampAlpha(color?.a, 1));
  }

  function hsvaToHsla(color) {
    const { red, green, blue } = hsvaToRgb(color);
    const r = red / 255;
    const g = green / 255;
    const b = blue / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    const lightness = (max + min) / 2;
    let hue = 0;
    let saturation = 0;

    if (delta > 0) {
      saturation = delta / (1 - Math.abs(2 * lightness - 1));
      if (max === r) {
        hue = 60 * (((g - b) / delta) % 6);
      } else if (max === g) {
        hue = 60 * ((b - r) / delta + 2);
      } else {
        hue = 60 * ((r - g) / delta + 4);
      }
    }

    if (hue < 0) {
      hue += 360;
    }

    return {
      h: Math.round(hue),
      s: Math.round(saturation * 100),
      l: Math.round(lightness * 100),
      a: clampAlpha(color?.a, 1)
    };
  }

  function hslaToHsva(h, s, l, a = 1) {
    const hue = ((Number.parseFloat(h) % 360) + 360) % 360;
    const saturation = Math.min(100, Math.max(0, Number.parseFloat(s))) / 100;
    const lightness = Math.min(100, Math.max(0, Number.parseFloat(l))) / 100;
    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = lightness - chroma / 2;
    let rPrime = 0;
    let gPrime = 0;
    let bPrime = 0;

    if (hue < 60) {
      rPrime = chroma;
      gPrime = x;
    } else if (hue < 120) {
      rPrime = x;
      gPrime = chroma;
    } else if (hue < 180) {
      gPrime = chroma;
      bPrime = x;
    } else if (hue < 240) {
      gPrime = x;
      bPrime = chroma;
    } else if (hue < 300) {
      rPrime = x;
      bPrime = chroma;
    } else {
      rPrime = chroma;
      bPrime = x;
    }

    return rgbToHsva(
      Math.round((rPrime + m) * 255),
      Math.round((gPrime + m) * 255),
      Math.round((bPrime + m) * 255),
      a
    );
  }

  function colorStringToHsva(value, fallback = null) {
    const parsed = parseAdjustColor(value);
    if (!parsed?.hex) {
      return fallback ? cloneHsvaColor(fallback) : null;
    }

    const red = Number.parseInt(parsed.hex.slice(1, 3), 16);
    const green = Number.parseInt(parsed.hex.slice(3, 5), 16);
    const blue = Number.parseInt(parsed.hex.slice(5, 7), 16);
    return rgbToHsva(red, green, blue, parsed.alpha);
  }

  function parseHslColorInputValue(value, alpha = 1) {
    const raw = String(value || "").trim();
    if (!raw) {
      return null;
    }

    const match =
      raw.match(/^hsl\(\s*(-?\d+(?:\.\d+)?)\s*(?:,|\s)\s*(\d+(?:\.\d+)?)%?\s*(?:,|\s)\s*(\d+(?:\.\d+)?)%?\s*\)$/i) ||
      raw.match(/^(-?\d+(?:\.\d+)?)\s+(?:,?\s*)?(\d+(?:\.\d+)?)%?\s+(?:,?\s*)?(\d+(?:\.\d+)?)%?$/i);

    if (!match) {
      return null;
    }

    return hslaToHsva(match[1], match[2], match[3], alpha);
  }

  function parseRgbColorInputValue(value, alpha = 1) {
    const raw = String(value || "").trim();
    if (!raw) {
      return null;
    }

    const match =
      raw.match(/^rgb\(\s*(\d+(?:\.\d+)?)\s*(?:,|\s)\s*(\d+(?:\.\d+)?)\s*(?:,|\s)\s*(\d+(?:\.\d+)?)\s*\)$/i) ||
      raw.match(/^(\d+(?:\.\d+)?)\s+(?:,?\s*)?(\d+(?:\.\d+)?)\s+(?:,?\s*)?(\d+(?:\.\d+)?)$/i);

    if (!match) {
      return null;
    }

    return rgbToHsva(
      clampNumber(match[1], 0, 255, 0),
      clampNumber(match[2], 0, 255, 0),
      clampNumber(match[3], 0, 255, 0),
      alpha
    );
  }

  function formatFillPopoverColorValue(color, format = "hex") {
    if (format === "rgb") {
      const rgb = hsvaToRgb(color);
      return `${rgb.red} ${rgb.green} ${rgb.blue}`;
    }

    if (format === "hsl") {
      const hsla = hsvaToHsla(color);
      return `${hsla.h} ${hsla.s} ${hsla.l}`;
    }

    return hsvaToHex(color).replace(/^#/, "").toUpperCase();
  }

  function formatFillPopoverTripletValue(color, format = "rgb") {
    if (format === "hsl") {
      const hsla = hsvaToHsla(color);
      return [hsla.h, hsla.s, hsla.l];
    }

    const rgb = hsvaToRgb(color);
    return [rgb.red, rgb.green, rgb.blue];
  }

  function parseFillPopoverColorValue(value, format = "hex", alpha = 1) {
    if (format === "rgb") {
      return parseRgbColorInputValue(value, alpha);
    }

    if (format === "hsl") {
      return parseHslColorInputValue(value, alpha);
    }

    const parsed = parseAdjustColorInputValue(value);
    if (!parsed?.hex) {
      return null;
    }

    return colorStringToHsva(parsed.css, { h: 0, s: 0, v: 0, a: alpha });
  }

  function parseFillPopoverTripletValue(values, format = "rgb", alpha = 1) {
    const [first, second, third] = Array.isArray(values) ? values : [];
    if ([first, second, third].some((value) => value == null || String(value).trim() === "")) {
      return null;
    }

    if (format === "hsl") {
      return hslaToHsva(
        clampNumber(first, -360, 360, 0),
        clampNumber(second, 0, 100, 0),
        clampNumber(third, 0, 100, 0),
        alpha
      );
    }

    return rgbToHsva(
      clampNumber(first, 0, 255, 0),
      clampNumber(second, 0, 255, 0),
      clampNumber(third, 0, 255, 0),
      alpha
    );
  }

  function normalizeGradientStop(stop, fallbackColor = null, fallbackPosition = 0) {
    const fallback = fallbackColor || colorStringToHsva(DEFAULT_FILL_CSS) || { h: 0, s: 0, v: 0, a: 1 };
    return {
      ...cloneHsvaColor(stop || fallback),
      position: clampNumber(stop?.position, 0, 100, fallbackPosition)
    };
  }

  function ensureGradientStops(stops, fallbackColor = null) {
    const fallback = fallbackColor || colorStringToHsva(DEFAULT_FILL_CSS) || { h: 0, s: 0, v: 0, a: 1 };
    const normalized = (Array.isArray(stops) ? stops : [])
      .map((stop, index) => normalizeGradientStop(stop, fallback, index === 0 ? 0 : 100))
      .sort((a, b) => a.position - b.position);

    if (normalized.length >= 2) {
      return normalized;
    }

    return [
      normalizeGradientStop(normalized[0] || fallback, fallback, 0),
      normalizeGradientStop(normalized[1] || normalized[0] || fallback, fallback, 100)
    ];
  }

  function buildLinearGradientCss(angle = 0, stops = null) {
    const normalizedStops = ensureGradientStops(stops);
    const normalizedAngle = clampNumber(angle, -360, 360, 0);
    return `linear-gradient(${normalizedAngle}deg, ${normalizedStops
      .map((stop) => `${hsvaToCss(stop)} ${Math.round(stop.position)}%`)
      .join(", ")})`;
  }

  function parseLinearGradientConfig(value, fallbackColor = null) {
    const fallback = fallbackColor || colorStringToHsva(DEFAULT_FILL_CSS) || { h: 0, s: 0, v: 0, a: 1 };
    const raw = String(value || "").trim();
    if (!/linear-gradient/i.test(raw)) {
      return {
        angle: 0,
        stops: ensureGradientStops(null, fallback)
      };
    }

    const bodyMatch = raw.match(/linear-gradient\((.*)\)$/i);
    const body = bodyMatch?.[1] || "";
    const parts = body
      .split(/,(?![^(]*\))/)
      .map((item) => item.trim())
      .filter(Boolean);

    let angle = 0;
    let startIndex = 0;
    if (/^-?\d+(?:\.\d+)?deg$/i.test(parts[0] || "")) {
      angle = clampNumber(parts[0].replace(/deg/i, ""), -360, 360, 0);
      startIndex = 1;
    }

    const stops = parts.slice(startIndex).map((part, index, array) => {
      const colorMatch = part.match(/(#(?:[\da-fA-F]{3}|[\da-fA-F]{6})\b|rgba?\([^)]*\))/i);
      const color = colorStringToHsva(colorMatch?.[1] || "", fallback) || cloneHsvaColor(fallback);
      const positionMatch = part.match(/(-?\d+(?:\.\d+)?)%/);
      const fallbackPosition = array.length <= 1 ? 0 : (index / (array.length - 1)) * 100;
      return {
        ...cloneHsvaColor(color),
        position: clampNumber(positionMatch?.[1], 0, 100, fallbackPosition)
      };
    });

    return {
      angle,
      stops: ensureGradientStops(stops, fallback)
    };
  }

  function formatAdjustColorHexValue(value, fallback = "") {
    const parsed = parseAdjustColor(value);
    if (!parsed?.hex) {
      return fallback;
    }
    return parsed.hex.replace(/^#/, "").toUpperCase();
  }

  function formatAdjustColorAlphaValue(value, fallback = 100) {
    const parsed = parseAdjustColor(value);
    if (!parsed) {
      return String(clampNumber(fallback, 0, 100, 100));
    }
    return String(Math.round(clampAlpha(parsed.alpha, 1) * 100));
  }

  function cssColorToHex(value) {
    if (!value || value === "transparent" || value.includes("rgba(0, 0, 0, 0")) {
      return "";
    }

    const hex = normalizeHexColor(value);
    if (hex) {
      return hex;
    }

    const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!match) {
      return "";
    }

    return `#${match
      .slice(1, 4)
      .map((item) => Number.parseInt(item, 10).toString(16).padStart(2, "0"))
      .join("")}`;
  }

  function getNumberInputDragConfig(input) {
    if (!(input instanceof HTMLInputElement) || input.type !== "number" || input.disabled || input.readOnly) {
      return null;
    }

    const stepAttr = input.getAttribute("step");
    const parsedStep = stepAttr && stepAttr !== "any" ? Number.parseFloat(stepAttr) : 1;
    const step = Number.isFinite(parsedStep) && parsedStep > 0 ? parsedStep : 1;
    const minAttr = input.getAttribute("min");
    const maxAttr = input.getAttribute("max");
    const min = minAttr == null || minAttr === "" ? null : Number.parseFloat(minAttr);
    const max = maxAttr == null || maxAttr === "" ? null : Number.parseFloat(maxAttr);
    const initialValue = Number.parseFloat(input.value || "0");

    return {
      input,
      step,
      min: Number.isFinite(min) ? min : null,
      max: Number.isFinite(max) ? max : null,
      initialValue: Number.isFinite(initialValue) ? initialValue : 0,
      precision: `${step}`.includes(".") ? `${step}`.split(".")[1].length : 0
    };
  }

  function resolveNumberInputTarget(target) {
    const input = target instanceof Element ? target.closest('input[type="number"]') : null;
    return getNumberInputDragConfig(input) ? input : null;
  }

  function syncNumberInputReadyCursor() {
    if (
      !(state.hoveredNumberInput instanceof HTMLInputElement) ||
      !state.hoveredNumberInput.isConnected ||
      !getNumberInputDragConfig(state.hoveredNumberInput)
    ) {
      state.hoveredNumberInput = null;
    }

    const showReadyCursor =
      !state.numberDragSession && state.altKeyPressed && state.hoveredNumberInput instanceof HTMLInputElement;
    document.documentElement.classList.toggle("chat-context-picker-number-drag-ready", showReadyCursor);
  }

  function updateHoveredNumberInput(target, altKey = state.altKeyPressed) {
    state.hoveredNumberInput = resolveNumberInputTarget(target);
    state.altKeyPressed = Boolean(altKey);
    syncNumberInputReadyCursor();
  }

  function clearNumberInputHoverState() {
    state.hoveredNumberInput = null;
    state.altKeyPressed = false;
    syncNumberInputReadyCursor();
  }

  function beginNumberInputDrag(input, event) {
    const config = getNumberInputDragConfig(input);
    if (!config) {
      return false;
    }

    state.numberDragSession = {
      ...config,
      startX: event.clientX,
      lastValue: config.initialValue,
      changed: false,
      previousCursor: document.documentElement.style.cursor,
      previousUserSelect: document.documentElement.style.userSelect
    };
    state.suppressClickUntil = Date.now() + 400;
    document.documentElement.classList.add("chat-context-picker-number-dragging");
    document.documentElement.style.cursor = "ew-resize";
    document.documentElement.style.userSelect = "none";
    input.blur();
    return true;
  }

  function updateNumberInputDrag(event) {
    const session = state.numberDragSession;
    if (!session) {
      return false;
    }

    const deltaX = event.clientX - session.startX;
    let nextValue = session.initialValue + deltaX * session.step;
    if (session.min !== null) {
      nextValue = Math.max(session.min, nextValue);
    }
    if (session.max !== null) {
      nextValue = Math.min(session.max, nextValue);
    }

    if (session.precision === 0) {
      nextValue = Math.round(nextValue);
    } else {
      nextValue = Number.parseFloat(nextValue.toFixed(session.precision));
    }

    if (nextValue === session.lastValue) {
      return true;
    }

    session.lastValue = nextValue;
    session.changed = true;
    session.input.value = String(nextValue);
    session.input.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }

  function finishNumberInputDrag() {
    const session = state.numberDragSession;
    if (!session) {
      return false;
    }

    if (session.changed) {
      session.input.dispatchEvent(new Event("change", { bubbles: true }));
    }

    state.numberDragSession = null;
    document.documentElement.classList.remove("chat-context-picker-number-dragging");
    document.documentElement.style.cursor = session.previousCursor || "";
    document.documentElement.style.userSelect = session.previousUserSelect || "";
    return true;
  }

  function getShadowLayers(boxShadow) {
    if (!boxShadow || boxShadow === "none") {
      return { outer: false, inner: false };
    }

    const layers = String(boxShadow)
      .split(/,(?![^(]*\))/)
      .map((item) => item.trim())
      .filter(Boolean);

    function isVisibleShadowLayer(layer) {
      const normalized = String(layer || "").trim().toLowerCase();
      if (!normalized || normalized === "none") {
        return false;
      }
      if (/rgba?\([^)]*,\s*0(?:\.0+)?\s*\)/i.test(normalized)) {
        return false;
      }

      const numericValues = normalized.match(/-?\d*\.?\d+px/g) || [];
      return numericValues.some((value) => Math.abs(Number.parseFloat(value)) > 0);
    }

    return layers.reduce(
      (result, layer) => {
        if (!isVisibleShadowLayer(layer)) {
          return result;
        }
        if (/inset/i.test(layer)) {
          result.inner = true;
        } else {
          result.outer = true;
        }
        return result;
      },
      { outer: false, inner: false }
    );
  }

  function splitShadowLayerStrings(boxShadow) {
    if (!boxShadow || boxShadow === "none") {
      return [];
    }

    return String(boxShadow)
      .split(/,(?![^(]*\))/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function getDefaultShadowConfig(shadowType = "outer") {
    return {
      type: shadowType,
      x: DEFAULT_SHADOW_X,
      y: DEFAULT_SHADOW_Y,
      blur: DEFAULT_SHADOW_BLUR,
      colorHex: DEFAULT_FILL_HEX,
      alpha: DEFAULT_SHADOW_ALPHA
    };
  }

  function normalizeShadowLayerEntry(layer, fallbackType = "outer") {
    const shadowType = layer?.type === "inner" || layer?.config?.type === "inner" ? "inner" : fallbackType;
    return {
      type: shadowType,
      visible: layer?.visible !== false,
      config: {
        ...(layer?.config || getDefaultShadowConfig(shadowType)),
        type: shadowType
      }
    };
  }

  function parseShadowConfigFromLayer(layer, shadowType = "outer") {
    const normalized = String(layer || "").trim();
    if (!normalized || normalized === "none") {
      return getDefaultShadowConfig(shadowType);
    }

    const color = parseAdjustColor(normalized) || parseAdjustColor(DEFAULT_FILL_CSS);
    const numberMatches = normalized.match(/-?\d*\.?\d+px/g) || [];

    return {
      type: shadowType,
      x: Number.parseFloat(numberMatches[0] || `${DEFAULT_SHADOW_X}`) || DEFAULT_SHADOW_X,
      y: Number.parseFloat(numberMatches[1] || `${DEFAULT_SHADOW_Y}`) || DEFAULT_SHADOW_Y,
      blur: Number.parseFloat(numberMatches[2] || `${DEFAULT_SHADOW_BLUR}`) || DEFAULT_SHADOW_BLUR,
      colorHex: color?.hex || DEFAULT_FILL_HEX,
      alpha: color?.alpha ?? DEFAULT_SHADOW_ALPHA
    };
  }

  function formatShadowConfigToLayer(config) {
    if (!config) {
      return "";
    }

    const alpha = clampAlpha(config.alpha, DEFAULT_SHADOW_ALPHA);
    const color = parseAdjustColor(config.colorHex || DEFAULT_FILL_HEX) || parseAdjustColor(DEFAULT_FILL_HEX);
    const hex = color?.hex || DEFAULT_FILL_HEX;
    const red = Number.parseInt(hex.slice(1, 3), 16);
    const green = Number.parseInt(hex.slice(3, 5), 16);
    const blue = Number.parseInt(hex.slice(5, 7), 16);
    const colorCss = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    const inset = config.type === "inner" ? "inset " : "";

    return `${inset}${Math.round(config.x)}px ${Math.round(config.y)}px ${Math.round(config.blur)}px ${colorCss}`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getVisibilityIconMarkup(isVisible = true) {
    return icon(isVisible ? "eye" : "eyeOff");
  }

  function getFillBaseRowMarkup(isActive = false, isVisible = true) {
    return `
      <div class="chat-context-picker-adjust-style-row chat-context-picker-adjust-fill-row" data-adjust-row="fill" data-state="${isActive ? "active" : "default"}">
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
          <input class="chat-context-picker-adjust-style-alpha-input" type="number" min="0" max="100" step="1" data-adjust-alpha="backgroundColor" />
          <span class="chat-context-picker-adjust-style-alpha-label">%</span>
        </label>
        <span class="chat-context-picker-adjust-input-divider" aria-hidden="true"></span>
        <button class="chat-context-picker-adjust-row-action" type="button" data-action="toggle-fill-visibility" aria-label="显示或隐藏填充" title="显示或隐藏填充">
          <span class="chat-context-picker-adjust-row-action-icon">${getVisibilityIconMarkup(isVisible)}</span>
        </button>
        <button class="chat-context-picker-adjust-row-action" type="button" data-action="clear-fill" aria-label="移除填充" title="移除填充">
          <span class="chat-context-picker-adjust-row-action-icon">${icon("minus")}</span>
        </button>
      </div>
    `;
  }

  function getFillOverlayRowMarkup(layer, index, isActive = false) {
    const visible = layer?.visible !== false;
    const colorHex = layer?.colorHex || DEFAULT_FILL_HEX;
    const colorCss = layer?.colorCss || DEFAULT_FILL_CSS;
    return `
      <div class="chat-context-picker-adjust-style-row chat-context-picker-adjust-fill-row" data-adjust-row="fill-overlay" data-overlay-index="${index}" data-state="${isActive ? "active" : "default"}" data-visible="${visible ? "true" : "false"}">
        <span class="chat-context-picker-adjust-fill-prefix">
          <button class="chat-context-picker-adjust-swatch-button" type="button" data-action="open-fill-overlay-picker" data-overlay-index="${index}" aria-label="选择叠加填充颜色" title="选择叠加填充颜色">
            <span class="chat-context-picker-adjust-swatch" style="--swatch-color:${colorCss}; border-color: transparent;"></span>
            <input class="chat-context-picker-adjust-native-color" type="color" data-adjust-overlay-input="backgroundColor" data-overlay-index="${index}" value="${escapeHtml(colorHex)}" />
          </button>
        </span>
        <span class="chat-context-picker-adjust-input-divider" aria-hidden="true"></span>
        <input class="chat-context-picker-adjust-style-input" type="text" data-adjust-overlay-text="backgroundColor" data-overlay-index="${index}" value="${escapeHtml(formatAdjustColorHexValue(colorCss))}" spellcheck="false" />
        <span class="chat-context-picker-adjust-input-divider" aria-hidden="true"></span>
        <label class="chat-context-picker-adjust-style-alpha-field">
          <input class="chat-context-picker-adjust-style-alpha-input" type="number" min="0" max="100" step="1" data-adjust-overlay-alpha="backgroundColor" data-overlay-index="${index}" value="${escapeHtml(formatAdjustColorAlphaValue(colorCss))}" />
          <span class="chat-context-picker-adjust-style-alpha-label">%</span>
        </label>
        <span class="chat-context-picker-adjust-input-divider" aria-hidden="true"></span>
        <button class="chat-context-picker-adjust-row-action" type="button" data-action="toggle-fill-overlay-visibility" data-overlay-index="${index}" aria-label="显示或隐藏叠加填充" title="显示或隐藏叠加填充">
          <span class="chat-context-picker-adjust-row-action-icon">${getVisibilityIconMarkup(visible)}</span>
        </button>
        <button class="chat-context-picker-adjust-row-action" type="button" data-action="clear-fill-overlay" data-overlay-index="${index}" aria-label="移除叠加填充" title="移除叠加填充">
          <span class="chat-context-picker-adjust-row-action-icon">${icon("minus")}</span>
        </button>
      </div>
    `;
  }

  function getShadowBaseRowMarkup(shadowType, isActive = false, isVisible = true) {
    const isInner = shadowType === "inner";
    const label = isInner ? "内阴影" : "外阴影";
    return `
      <div class="chat-context-picker-adjust-style-row" data-action="set-shadow-type" data-shadow-type="${shadowType}" data-adjust-row="shadow-${shadowType}" data-state="${isActive ? "active" : "default"}" role="button" tabindex="0">
        <span class="chat-context-picker-adjust-shadow-preview chat-context-picker-adjust-shadow-preview-${shadowType}"></span>
        <span class="chat-context-picker-adjust-input-divider" aria-hidden="true"></span>
        <div class="chat-context-picker-adjust-style-label">${label}</div>
        <button class="chat-context-picker-adjust-row-action" type="button" data-action="toggle-shadow-visibility" data-shadow-type="${shadowType}" aria-label="显示或隐藏${label}" title="显示或隐藏${label}">
          <span class="chat-context-picker-adjust-row-action-icon">${getVisibilityIconMarkup(isVisible)}</span>
        </button>
        <button class="chat-context-picker-adjust-row-action" type="button" data-action="clear-shadow" data-shadow-type="${shadowType}" aria-label="移除${label}" title="移除${label}">
          <span class="chat-context-picker-adjust-row-action-icon">${icon("minus")}</span>
        </button>
      </div>
    `;
  }

  function getShadowOverlayRowMarkup(layer, index, isActive = false) {
    const visible = layer?.visible !== false;
    const shadowType = layer?.type === "inner" || layer?.config?.type === "inner" ? "inner" : "outer";
    const label = shadowType === "inner" ? "内阴影" : "外阴影";
    return `
      <div class="chat-context-picker-adjust-style-row" data-action="open-shadow-overlay" data-shadow-type="${shadowType}" data-adjust-row="shadow-overlay" data-overlay-index="${index}" data-state="${isActive ? "active" : "default"}" data-visible="${visible ? "true" : "false"}" role="button" tabindex="0">
        <span class="chat-context-picker-adjust-shadow-preview chat-context-picker-adjust-shadow-preview-${shadowType}"></span>
        <span class="chat-context-picker-adjust-input-divider" aria-hidden="true"></span>
        <div class="chat-context-picker-adjust-style-label">${label}</div>
        <button class="chat-context-picker-adjust-row-action" type="button" data-action="toggle-shadow-overlay-visibility" data-overlay-index="${index}" aria-label="显示或隐藏${label}" title="显示或隐藏${label}">
          <span class="chat-context-picker-adjust-row-action-icon">${getVisibilityIconMarkup(visible)}</span>
        </button>
        <button class="chat-context-picker-adjust-row-action" type="button" data-action="clear-shadow-overlay" data-overlay-index="${index}" aria-label="移除${label}" title="移除${label}">
          <span class="chat-context-picker-adjust-row-action-icon">${icon("minus")}</span>
        </button>
      </div>
    `;
  }

  function refreshAdjustPopoverControlRefs() {
    if (!state.adjustPopover) {
      return;
    }

    state.adjustControls = {
      ...state.adjustControls,
      body: state.adjustPopover.querySelector(".chat-context-picker-adjust-body"),
      fillStack: state.adjustPopover.querySelector('[data-adjust-stack="fill"]'),
      shadowStack: state.adjustPopover.querySelector('[data-adjust-stack="shadow"]'),
      backgroundColorInput: state.adjustPopover.querySelector('[data-adjust-input="backgroundColor"]'),
      backgroundColorText: state.adjustPopover.querySelector('[data-adjust-text="backgroundColor"]'),
      backgroundColorAlpha: state.adjustPopover.querySelector('[data-adjust-alpha="backgroundColor"]'),
      backgroundColorRow: state.adjustPopover.querySelector('[data-adjust-row="fill"]'),
      backgroundColorSwatch: state.adjustPopover.querySelector('[data-adjust-swatch="backgroundColor"]'),
      widthRow: state.adjustPopover.querySelector('[data-adjust-size-row="width"]'),
      heightRow: state.adjustPopover.querySelector('[data-adjust-size-row="height"]'),
      outerShadowRow: state.adjustPopover.querySelector('[data-adjust-row="shadow-outer"]'),
      innerShadowRow: state.adjustPopover.querySelector('[data-adjust-row="shadow-inner"]')
    };
  }

  function renderAdjustLayerRows(target) {
    const persistedTarget = ensureAdjustLayerState(target);
    if (!persistedTarget || !state.adjustControls) {
      return;
    }

    const fillLayers = persistedTarget.adjustFillOverlayLayers || [];
    const isFillPopoverOpen = Boolean(state.fillPopover?.dataset.open === "true" && state.adjustTarget);
    if (state.adjustControls.fillStack) {
      state.adjustControls.fillStack.innerHTML = [
        ...fillLayers.map((layer, index) =>
          getFillOverlayRowMarkup(layer, index, isFillPopoverOpen && state.fillPopoverOverlayIndex === index)
        ),
        getFillBaseRowMarkup(
          isFillPopoverOpen && state.fillPopoverOverlayIndex === null,
          persistedTarget.adjustFillVisible !== false
        )
      ].join("");
    }

    const shadowOverlayLayers = persistedTarget.adjustAddedOuterShadowLayers || [];
    const shadowMarkup = [];
    shadowOverlayLayers.forEach((layer, index) => {
      shadowMarkup.push(
        getShadowOverlayRowMarkup(
          layer,
          index,
          Boolean(state.shadowPopover?.dataset.open === "true" && state.adjustTarget) &&
            state.shadowPopoverOverlayIndex === index
        )
      );
    });
    if (state.adjustControls.shadowStack) {
      state.adjustControls.shadowStack.innerHTML = shadowMarkup.join("");
    }

    refreshAdjustPopoverControlRefs();
  }

  function captureAdjustableStyleSnapshot(element) {
    return ADJUSTABLE_STYLE_PROPS.reduce((snapshot, prop) => {
      snapshot[prop] = element?.style?.[prop] || "";
      return snapshot;
    }, {});
  }

  function applyAdjustableStyleSnapshot(element, snapshot) {
    if (!(element instanceof Element) || !snapshot) {
      return;
    }

    for (const prop of ADJUSTABLE_STYLE_PROPS) {
      element.style[prop] = snapshot[prop] || "";
    }
  }

  function areStyleSnapshotsEqual(a, b) {
    return ADJUSTABLE_STYLE_PROPS.every((prop) => (a?.[prop] || "") === (b?.[prop] || ""));
  }

  function formatAdjustColorValue(value) {
    const parsed = parseAdjustColor(value);
    return parsed ? parsed.label : "无填充";
  }

  function getResolvedBorderRadius(styles, rect) {
    const basis = Math.min(rect.width || 0, rect.height || 0);
    return Math.max(
      parseLengthValue(styles.borderTopLeftRadius, basis, 0),
      parseLengthValue(styles.borderTopRightRadius, basis, 0),
      parseLengthValue(styles.borderBottomRightRadius, basis, 0),
      parseLengthValue(styles.borderBottomLeftRadius, basis, 0)
    );
  }

  function getAdjustFillInfo(styles) {
    const backgroundImage = styles.backgroundImage && styles.backgroundImage !== "none" ? styles.backgroundImage : "";
    const parsedColor = parseAdjustColor(styles.backgroundColor);
    const backgroundColor = parsedColor?.hex || "";
    const backgroundColorCss = parsedColor?.css || "";
    const isGradient = /gradient/i.test(backgroundImage);

    if (isGradient) {
      return {
        backgroundColor,
        backgroundColorCss,
        backgroundImage,
        backgroundVisible: true,
        fillType: "gradient",
        fillLabel: "线性渐变"
      };
    }

    return {
      backgroundColor,
      backgroundColorCss,
      backgroundImage,
      backgroundVisible: Boolean(parsedColor),
      fillType: backgroundColor ? "color" : "none",
      fillLabel: parsedColor ? parsedColor.label : "无填充"
    };
  }

  function hydrateAdjustLayerState(target, values = null) {
    const persistedTarget = findSelectedTarget(target) || target;
    if (!persistedTarget) {
      return null;
    }

    const element = getTargetElement(persistedTarget);
    const styles = window.getComputedStyle(element);
    const currentValues = values || getAdjustValues(persistedTarget);
    const shadowLayers = getShadowLayers(styles.boxShadow);

    persistedTarget.adjustFillEnabled = currentValues.backgroundVisible;
    persistedTarget.adjustFillVisible = currentValues.backgroundVisible;
    persistedTarget.adjustFillType = currentValues.fillType || "none";
    persistedTarget.adjustStoredBackgroundColor = currentValues.backgroundColorCss || currentValues.backgroundColor || "";
    persistedTarget.adjustStoredBackgroundHex = currentValues.backgroundColor || "";
    persistedTarget.adjustStoredBackgroundImage = currentValues.backgroundImage || "";
    persistedTarget.adjustFillOverlayLayers = [];
    const shadowLayerStrings = splitShadowLayerStrings(styles.boxShadow);
    const outerLayer = shadowLayerStrings.find((layer) => !/inset/i.test(layer));
    const innerLayer = shadowLayerStrings.find((layer) => /inset/i.test(layer));
    persistedTarget.adjustShadowOuterConfig = parseShadowConfigFromLayer(outerLayer, "outer");
    persistedTarget.adjustShadowInnerConfig = parseShadowConfigFromLayer(innerLayer, "inner");
    persistedTarget.adjustAddedOuterShadowLayers = shadowLayerStrings.map((layer) =>
      normalizeShadowLayerEntry(
        {
          type: /inset/i.test(layer) ? "inner" : "outer",
          visible: true,
          config: parseShadowConfigFromLayer(layer, /inset/i.test(layer) ? "inner" : "outer")
        },
        /inset/i.test(layer) ? "inner" : "outer"
      )
    );
    persistedTarget.adjustShadowOuterEnabled = false;
    persistedTarget.adjustShadowOuterVisible = false;
    persistedTarget.adjustShadowInnerEnabled = false;
    persistedTarget.adjustShadowInnerVisible = false;
    persistedTarget.adjustShadowActiveLayer = persistedTarget.adjustAddedOuterShadowLayers[0]?.type || "outer";

    return persistedTarget;
  }

  function ensureAdjustLayerState(target, values = null) {
    const persistedTarget = findSelectedTarget(target) || target;
    if (!persistedTarget) {
      return null;
    }

    const currentValues = values || getAdjustValues(persistedTarget);

    if (typeof persistedTarget.adjustFillEnabled !== "boolean") {
      persistedTarget.adjustFillEnabled = currentValues.backgroundVisible;
    }
    if (typeof persistedTarget.adjustFillVisible !== "boolean") {
      persistedTarget.adjustFillVisible = currentValues.backgroundVisible;
    }
    if (!persistedTarget.adjustStoredBackgroundColor && currentValues.backgroundColor) {
      persistedTarget.adjustStoredBackgroundColor = currentValues.backgroundColorCss || currentValues.backgroundColor;
    }
    if (!persistedTarget.adjustStoredBackgroundHex && currentValues.backgroundColor) {
      persistedTarget.adjustStoredBackgroundHex = currentValues.backgroundColor;
    }
    if (!persistedTarget.adjustStoredBackgroundImage && currentValues.backgroundImage) {
      persistedTarget.adjustStoredBackgroundImage = currentValues.backgroundImage;
    }
    if (!persistedTarget.adjustFillType) {
      persistedTarget.adjustFillType = currentValues.fillType || "none";
    }
    if (!Array.isArray(persistedTarget.adjustFillOverlayLayers)) {
      persistedTarget.adjustFillOverlayLayers = [];
    }
    if (!Array.isArray(persistedTarget.adjustAddedOuterShadowLayers)) {
      persistedTarget.adjustAddedOuterShadowLayers = [];
    }
    persistedTarget.adjustAddedOuterShadowLayers = (persistedTarget.adjustAddedOuterShadowLayers || []).map((layer) =>
      normalizeShadowLayerEntry(layer, layer?.type === "inner" ? "inner" : "outer")
    );
    if (!persistedTarget.adjustAddedOuterShadowLayers.length) {
      if (persistedTarget.adjustShadowOuterEnabled) {
        persistedTarget.adjustAddedOuterShadowLayers.push(
          normalizeShadowLayerEntry(
            {
              type: "outer",
              visible: persistedTarget.adjustShadowOuterVisible !== false,
              config: persistedTarget.adjustShadowOuterConfig || getDefaultShadowConfig("outer")
            },
            "outer"
          )
        );
      }
      if (persistedTarget.adjustShadowInnerEnabled) {
        persistedTarget.adjustAddedOuterShadowLayers.push(
          normalizeShadowLayerEntry(
            {
              type: "inner",
              visible: persistedTarget.adjustShadowInnerVisible !== false,
              config: persistedTarget.adjustShadowInnerConfig || getDefaultShadowConfig("inner")
            },
            "inner"
          )
        );
      }
    }
    if (!persistedTarget.adjustShadowOuterConfig) {
      const outerLayer = splitShadowLayerStrings(
        window.getComputedStyle(getTargetElement(persistedTarget)).boxShadow
      ).find((layer) => !/inset/i.test(layer));
      persistedTarget.adjustShadowOuterConfig = parseShadowConfigFromLayer(outerLayer, "outer");
    }
    if (!persistedTarget.adjustShadowInnerConfig) {
      const innerLayer = splitShadowLayerStrings(
        window.getComputedStyle(getTargetElement(persistedTarget)).boxShadow
      ).find((layer) => /inset/i.test(layer));
      persistedTarget.adjustShadowInnerConfig = parseShadowConfigFromLayer(innerLayer, "inner");
    }
    persistedTarget.adjustShadowOuterEnabled = false;
    persistedTarget.adjustShadowOuterVisible = false;
    persistedTarget.adjustShadowInnerEnabled = false;
    persistedTarget.adjustShadowInnerVisible = false;
    if (!persistedTarget.adjustShadowActiveLayer) {
      persistedTarget.adjustShadowActiveLayer = persistedTarget.adjustAddedOuterShadowLayers[0]?.type || "outer";
    }

    return persistedTarget;
  }

  function applyFillLayerState(target) {
    const persistedTarget = ensureAdjustLayerState(target);
    if (!persistedTarget) {
      return;
    }

    const element = getTargetElement(persistedTarget);
    if (!(element instanceof Element)) {
      return;
    }

    if (!persistedTarget.adjustFillEnabled || !persistedTarget.adjustFillVisible) {
      element.style.backgroundColor = "transparent";
      element.style.backgroundImage = "none";
      return;
    }

    if (persistedTarget.adjustFillType === "gradient" && persistedTarget.adjustStoredBackgroundImage) {
      const layers = [
        ...(persistedTarget.adjustFillOverlayLayers || [])
          .filter((layer) => layer?.visible !== false)
          .map((layer) => {
            const color = layer?.colorCss || DEFAULT_FILL_CSS;
            return `linear-gradient(${color}, ${color})`;
          }),
        persistedTarget.adjustStoredBackgroundImage
      ].filter(Boolean);
      element.style.backgroundImage = layers.join(", ");
      if (persistedTarget.adjustStoredBackgroundColor) {
        element.style.backgroundColor = persistedTarget.adjustStoredBackgroundColor;
      }
      return;
    }

    const overlayLayers = (persistedTarget.adjustFillOverlayLayers || [])
      .filter((layer) => layer?.visible !== false)
      .map((layer) => {
        const color = layer?.colorCss || DEFAULT_FILL_CSS;
        return `linear-gradient(${color}, ${color})`;
      });
    element.style.backgroundImage = overlayLayers.length ? overlayLayers.join(", ") : "none";
    element.style.backgroundColor = persistedTarget.adjustStoredBackgroundColor || DEFAULT_FILL_CSS;
  }

  function applyShadowLayerState(target) {
    const persistedTarget = ensureAdjustLayerState(target);
    if (!persistedTarget) {
      return;
    }

    const element = getTargetElement(persistedTarget);
    if (!(element instanceof Element)) {
      return;
    }

    const layers = [];
    const addedOuterLayers = (persistedTarget.adjustAddedOuterShadowLayers || [])
      .filter((layer) => layer?.visible !== false)
      .map((layer) => {
        const shadowType = layer?.type === "inner" || layer?.config?.type === "inner" ? "inner" : "outer";
        return formatShadowConfigToLayer({
          ...(layer?.config || getDefaultShadowConfig(shadowType)),
          type: shadowType
        });
      });
    layers.push(...addedOuterLayers);
    element.style.boxShadow = layers.length ? layers.join(", ") : "none";
  }

  function getParentFlexContext(element) {
    const parent = element?.parentElement;
    if (!(parent instanceof Element)) {
      return {
        parent: null,
        isFlex: false,
        direction: "row",
        alignItems: "stretch",
        rect: null
      };
    }

    const styles = window.getComputedStyle(parent);
    const isFlex = styles.display === "flex" || styles.display === "inline-flex";
    return {
      parent,
      isFlex,
      direction: styles.flexDirection.startsWith("column") ? "column" : "row",
      alignItems: styles.alignItems || "stretch",
      rect: parent.getBoundingClientRect()
    };
  }

  function getAdjustSizeMode(target, prop) {
    const element = getTargetElement(target);
    if (!(element instanceof Element)) {
      return "fixed";
    }

    const styles = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const parentContext = getParentFlexContext(element);
    const inlineValue = prop === "width" ? element.style.width : element.style.height;
    const inlineMin = prop === "width" ? element.style.minWidth : element.style.minHeight;
    const computedValue = prop === "width" ? styles.width : styles.height;
    const alignSelf = styles.alignSelf || "auto";
    const flexGrow = Number.parseFloat(styles.flexGrow || "0");
    const onMainAxis =
      (prop === "width" && parentContext.direction === "row") ||
      (prop === "height" && parentContext.direction === "column");

    if (parentContext.isFlex) {
      if (onMainAxis && flexGrow > 0.01) {
        return "fill";
      }
      if (!onMainAxis) {
        const stretches = alignSelf === "stretch" || (alignSelf === "auto" && parentContext.alignItems === "stretch");
        if (stretches && (!inlineValue || inlineValue === "auto" || inlineValue === "100%")) {
          return "fill";
        }
      }
    }

    if (inlineValue === "100%") {
      return "fill";
    }

    if (inlineValue === "fit-content" || inlineValue === "max-content" || inlineMin === "fit-content") {
      return "hug";
    }

    if (computedValue === "fit-content" || computedValue === "max-content" || computedValue === "min-content") {
      return "hug";
    }

    if (!inlineValue || inlineValue === "auto") {
      const parentRect = parentContext.rect;
      const size = prop === "width" ? rect.width : rect.height;
      const parentSize = parentRect ? (prop === "width" ? parentRect.width : parentRect.height) : 0;
      if (parentRect && size > 0 && parentSize > 0 && size < parentSize - 2) {
        return "hug";
      }
      if (computedValue === "auto") {
        return "hug";
      }
    }

    return "fixed";
  }

  function getAdjustValues(target) {
    const element = getTargetElement(target);
    const styles = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const isFlex = styles.display === "flex" || styles.display === "inline-flex";
    const fillInfo = getAdjustFillInfo(styles);
    const shadowLayers = getShadowLayers(styles.boxShadow);

    return {
      layoutDirection: isFlex ? (styles.flexDirection.startsWith("column") ? "column" : "row") : "none",
      justifyContent: styles.justifyContent || "flex-start",
      alignItems: styles.alignItems || "stretch",
      width: Math.round(rect.width),
      widthMode: getAdjustSizeMode(target, "width"),
      height: Math.round(rect.height),
      heightMode: getAdjustSizeMode(target, "height"),
      gap: parsePixelValue(styles.gap),
      paddingTop: parsePixelValue(styles.paddingTop),
      paddingRight: parsePixelValue(styles.paddingRight),
      paddingBottom: parsePixelValue(styles.paddingBottom),
      paddingLeft: parsePixelValue(styles.paddingLeft),
      backgroundColor: fillInfo.backgroundColor,
      backgroundColorCss: fillInfo.backgroundColorCss,
      backgroundImage: fillInfo.backgroundImage,
      backgroundVisible: fillInfo.backgroundVisible,
      fillType: fillInfo.fillType,
      fillLabel: fillInfo.fillLabel,
      borderRadius: getResolvedBorderRadius(styles, rect),
      opacity: Math.round(Number.parseFloat(styles.opacity || "1") * 100),
      shadowOuterVisible: shadowLayers.outer,
      shadowInnerVisible: shadowLayers.inner
    };
  }

  function syncAdjustSegments(prop, value) {
    if (!state.adjustPopover) {
      return;
    }

    const buttons = state.adjustPopover.querySelectorAll(`[data-adjust-prop="${prop}"]`);
    buttons.forEach((button) => {
      button.dataset.state = button.dataset.adjustValue === value ? "active" : "inactive";
    });
  }

  function syncAdjustAlignmentGrid(values) {
    if (!state.adjustPopover) {
      return;
    }

    const buttons = state.adjustPopover.querySelectorAll("[data-adjust-horizontal][data-adjust-vertical]");
    const physicalAlignment = getPhysicalAlignment(values);
    buttons.forEach((button) => {
      const isActive =
        values.layoutDirection !== "none" &&
        button.dataset.adjustHorizontal === physicalAlignment.horizontal &&
        button.dataset.adjustVertical === physicalAlignment.vertical;
      button.dataset.state = isActive ? "active" : "inactive";
    });
  }

  function physicalPositionToFlex(value) {
    if (value === "center") {
      return "center";
    }
    return value === "right" || value === "bottom" ? "flex-end" : "flex-start";
  }

  function normalizeFlexPosition(value, fallback = "flex-start") {
    if (value === "center" || value === "flex-end" || value === "flex-start") {
      return value;
    }
    if (value === "end") {
      return "flex-end";
    }
    if (value === "start" || value === "stretch") {
      return "flex-start";
    }
    return fallback;
  }

  function getPhysicalAlignment(values) {
    const direction = values?.layoutDirection === "column" ? "column" : "row";
    const justify = normalizeFlexPosition(values?.justifyContent, "flex-start");
    const align = normalizeFlexPosition(values?.alignItems, "flex-start");

    if (direction === "column") {
      return {
        horizontal:
          align === "center" ? "center" : align === "flex-end" ? "right" : "left",
        vertical:
          justify === "center" ? "center" : justify === "flex-end" ? "bottom" : "top"
      };
    }

    return {
      horizontal:
        justify === "center" ? "center" : justify === "flex-end" ? "right" : "left",
      vertical:
        align === "center" ? "center" : align === "flex-end" ? "bottom" : "top"
    };
  }

  function getAdjustPromptText(target) {
    const values = getAdjustValues(target);
    const physicalAlignment = getPhysicalAlignment(values);
    const directionLabel =
      values.layoutDirection === "row" ? "横向" : values.layoutDirection === "column" ? "纵向" : "关闭";
    const horizontalLabel =
      {
        left: "左",
        center: "中",
        right: "右"
      }[physicalAlignment.horizontal] || physicalAlignment.horizontal;
    const verticalLabel =
      {
        top: "上",
        center: "中",
        bottom: "下"
      }[physicalAlignment.vertical] || physicalAlignment.vertical;
    const persistedTarget = ensureAdjustLayerState(target, values);
    const shadowLabels = [];
    (persistedTarget?.adjustAddedOuterShadowLayers || []).forEach((layer) => {
      const shadowType = layer?.type === "inner" || layer?.config?.type === "inner" ? "内阴影" : "外阴影";
      shadowLabels.push(layer?.visible === false ? `${shadowType}（隐藏）` : shadowType);
    });

    return [
      `布局：${directionLabel}，尺寸 ${values.width}px × ${values.height}px，对齐 ${verticalLabel}${horizontalLabel}，间距 ${values.gap}px，内边距 上${values.paddingTop}px 右${values.paddingRight}px 下${values.paddingBottom}px 左${values.paddingLeft}px。`,
      `外观：不透明度 ${values.opacity}% ，圆角 ${values.borderRadius}px。`,
      `填充：${
        persistedTarget?.adjustFillEnabled
          ? persistedTarget.adjustFillVisible
            ? persistedTarget.adjustFillType === "gradient"
              ? "线性渐变"
              : formatAdjustColorValue(
                  persistedTarget.adjustStoredBackgroundColor || values.backgroundColorCss || values.backgroundColor
                ) || "无"
            : "已隐藏"
          : "无"
      }。`,
      `阴影：${shadowLabels.length ? shadowLabels.join("、") : "无"}。`
    ].join("\n");
  }

  function refreshAdjustPromptText(target) {
    const persistedTarget = findSelectedTarget(target) || target;
    if (!persistedTarget) {
      return;
    }

    persistedTarget.adjustPromptText = getAdjustPromptText(persistedTarget);
  }

  function getVisibleOrStoredBackgroundColor(target = state.adjustTarget) {
    const persistedTarget = findSelectedTarget(target) || target;
    if (!persistedTarget) {
      return "";
    }

    ensureAdjustLayerState(persistedTarget);
    return persistedTarget.adjustStoredBackgroundColor || "";
  }

  function toggleBackgroundVisibility() {
    if (!state.adjustTarget) {
      return;
    }

    const persistedTarget = ensureAdjustLayerState(state.adjustTarget);
    if (!persistedTarget.adjustFillEnabled) {
      return;
    }

    persistedTarget.adjustFillVisible = !persistedTarget.adjustFillVisible;
    applyFillLayerState(persistedTarget);
    refreshAdjustPromptText(persistedTarget);
    syncAdjustPopoverFromTarget(persistedTarget);
    renderSelection();
    commitAdjustChanges();
  }

  function clearBackgroundFill() {
    if (!state.adjustTarget) {
      return;
    }

    const persistedTarget = ensureAdjustLayerState(state.adjustTarget);
    persistedTarget.adjustFillEnabled = false;
    persistedTarget.adjustFillVisible = false;
    persistedTarget.adjustFillOverlayLayers = [];
    closeFillPopover();
    applyFillLayerState(persistedTarget);
    refreshAdjustPromptText(persistedTarget);
    syncAdjustPopoverFromTarget(persistedTarget);
    renderSelection();
    commitAdjustChanges();
  }

  function toggleShadowType(shadowType) {
    if (!state.adjustTarget) {
      return;
    }

    const persistedTarget = ensureAdjustLayerState(state.adjustTarget);
    const enabledKey = shadowType === "inner" ? "adjustShadowInnerEnabled" : "adjustShadowOuterEnabled";
    const visibleKey = shadowType === "inner" ? "adjustShadowInnerVisible" : "adjustShadowOuterVisible";
    if (!persistedTarget[enabledKey]) {
      return;
    }

    persistedTarget[visibleKey] = !persistedTarget[visibleKey];
    persistedTarget.adjustShadowActiveLayer = shadowType;
    applyShadowLayerState(persistedTarget);
    refreshAdjustPromptText(persistedTarget);
    syncAdjustPopoverFromTarget(persistedTarget);
    renderSelection();
    commitAdjustChanges();
  }

  function getActiveShadowConfig(target = state.adjustTarget, shadowType = state.shadowPopoverType) {
    const persistedTarget = ensureAdjustLayerState(target);
    if (!persistedTarget) {
      return null;
    }

    if (state.shadowPopoverOverlayIndex !== null) {
      const overlayType = state.shadowPopoverType === "inner" ? "inner" : "outer";
      return (
        persistedTarget.adjustAddedOuterShadowLayers?.[state.shadowPopoverOverlayIndex]?.config ||
        getDefaultShadowConfig(overlayType)
      );
    }

    return shadowType === "inner"
      ? persistedTarget.adjustShadowInnerConfig || getDefaultShadowConfig("inner")
      : persistedTarget.adjustShadowOuterConfig || getDefaultShadowConfig("outer");
  }

  function getActiveFillConfig(target = state.adjustTarget) {
    const persistedTarget = ensureAdjustLayerState(target);
    if (!persistedTarget) {
      return null;
    }

    if (state.fillPopoverOverlayIndex !== null) {
      const layer = persistedTarget.adjustFillOverlayLayers?.[state.fillPopoverOverlayIndex];
      if (!layer) {
        return null;
      }
      return (
        parseAdjustColor(layer.colorCss || layer.colorHex || DEFAULT_FILL_CSS) ||
        parseAdjustColor(DEFAULT_FILL_CSS)
      );
    }

    return (
      parseAdjustColor(
        persistedTarget.adjustStoredBackgroundColor ||
        persistedTarget.adjustStoredBackgroundHex ||
        DEFAULT_FILL_CSS
      ) ||
      parseAdjustColor(DEFAULT_FILL_CSS)
    );
  }

  function getActiveFillPopoverColor() {
    if (state.fillPopoverMode === "gradient") {
      const stops = ensureGradientStops(state.fillPopoverGradientStops, state.fillPopoverSolidColor);
      const index = clampNumber(
        state.fillPopoverGradientActiveStop,
        0,
        Math.max(0, stops.length - 1),
        0
      );
      return cloneHsvaColor(stops[index]);
    }

    return cloneHsvaColor(state.fillPopoverSolidColor || colorStringToHsva(DEFAULT_FILL_CSS) || { h: 0, s: 0, v: 0, a: 1 });
  }

  function renderFillPopoverControls() {
    if (!state.fillPopover || !state.fillControls) {
      return;
    }

    const isOverlay = state.fillPopoverOverlayIndex !== null;
    const mode = isOverlay ? "solid" : state.fillPopoverMode === "gradient" ? "gradient" : "solid";
    const solidColor = cloneHsvaColor(
      state.fillPopoverSolidColor || colorStringToHsva(DEFAULT_FILL_CSS) || { h: 0, s: 0, v: 0, a: 1 }
    );
    const gradientStops = ensureGradientStops(state.fillPopoverGradientStops, solidColor);
    const activeStopIndex =
      mode === "gradient"
        ? clampNumber(state.fillPopoverGradientActiveStop, 0, Math.max(0, gradientStops.length - 1), 0)
        : 0;
    const activeColor = mode === "gradient" ? cloneHsvaColor(gradientStops[activeStopIndex]) : cloneHsvaColor(solidColor);
    const satLeft = `${Math.min(100, Math.max(0, activeColor.s))}%`;
    const satTop = `${100 - Math.min(100, Math.max(0, activeColor.v))}%`;
    state.fillPopoverGradientStops = gradientStops;
    state.fillPopoverGradientActiveStop = activeStopIndex;
    state.fillControls.modeSolid.dataset.state = mode === "solid" ? "active" : "inactive";
    state.fillControls.modeGradient.dataset.state = mode === "gradient" ? "active" : "inactive";
    state.fillControls.modeGradient.disabled = isOverlay;
    state.fillControls.modeGradient.setAttribute("aria-disabled", isOverlay ? "true" : "false");

    if (state.fillControls.gradientControls) {
      state.fillControls.gradientControls.hidden = mode !== "gradient";
      state.fillControls.gradientControls.style.display = mode === "gradient" ? "flex" : "none";
    }
    if (state.fillControls.gradientStrip) {
      state.fillControls.gradientStrip.hidden = mode !== "gradient";
      state.fillControls.gradientStrip.style.display = mode === "gradient" ? "block" : "none";
    }
    if (mode === "gradient") {
      if (state.fillControls.gradientTrack) {
        state.fillControls.gradientTrack.style.setProperty(
          "--chat-fill-gradient-preview",
          buildLinearGradientCss(90, gradientStops)
        );
      }
      if (state.fillControls.gradientStopsLayer) {
        state.fillControls.gradientStopsLayer.innerHTML = gradientStops
          .map(
            (stop, index) => `
              <button
                class="chat-context-picker-fill-gradient-stop"
                type="button"
                data-fill-stop-index="${index}"
                data-state="${index === activeStopIndex ? "active" : "inactive"}"
                aria-label="选择渐变节点 ${index + 1}"
                title="选择渐变节点 ${index + 1}"
                style="left:${stop.position}%; --stop-color:${hsvaToCss(stop)}"
              ></button>
            `
          )
          .join("");
      }
      state.fillControls.gradientStops = [
        ...(state.fillControls.gradientStopsLayer?.querySelectorAll("[data-fill-stop-index]") || [])
      ];
      if (state.fillControls.angleInput) {
        state.fillControls.angleInput.value = String(Math.round(clampNumber(state.fillPopoverGradientAngle, -360, 360, 0)));
      }
    }

    if (state.fillControls.svPanel) {
      state.fillControls.svPanel.style.backgroundColor = `hsl(${Math.round(activeColor.h)} 100% 50%)`;
    }
    if (state.fillControls.svThumb) {
      state.fillControls.svThumb.style.left = satLeft;
      state.fillControls.svThumb.style.top = satTop;
    }
    if (state.fillControls.formatLabel) {
      state.fillControls.formatLabel.textContent =
        state.fillPopoverFormat === "rgb" ? "RGB" : state.fillPopoverFormat === "hsl" ? "HSL" : "Hex";
    }
    if (state.fillControls.formatTrigger) {
      state.fillControls.formatTrigger.setAttribute("aria-expanded", state.fillPopoverFormatMenuOpen ? "true" : "false");
    }
    if (state.fillControls.formatMenu) {
      state.fillControls.formatMenu.hidden = !state.fillPopoverFormatMenuOpen;
      if (state.fillPopoverFormatMenuOpen && state.fillControls.formatTrigger) {
        const triggerRect = state.fillControls.formatTrigger.getBoundingClientRect();
        const menuHeight = state.fillControls.formatMenu.offsetHeight || 110;
        const spaceBelow = window.innerHeight - triggerRect.bottom - 8;
        const spaceAbove = triggerRect.top - 8;
        state.fillControls.formatMenu.dataset.side =
          spaceBelow < menuHeight && spaceAbove > spaceBelow ? "top" : "bottom";
      } else {
        delete state.fillControls.formatMenu.dataset.side;
      }
    }
    if (state.fillControls.formatOptions?.length) {
      state.fillControls.formatOptions.forEach((button) => {
        button.dataset.state = button.dataset.fillFormatOption === state.fillPopoverFormat ? "active" : "inactive";
      });
    }
    if (state.fillControls.valueInput) {
      const showSingleValue = state.fillPopoverFormat === "hex";
      state.fillControls.valueInput.hidden = !showSingleValue;
      state.fillControls.valueInput.style.display = showSingleValue ? "" : "none";
      if (showSingleValue) {
        state.fillControls.valueInput.value = formatFillPopoverColorValue(activeColor, state.fillPopoverFormat);
        state.fillControls.valueInput.placeholder = "EE0F0F";
      }
    }
    if (state.fillControls.tripletField) {
      const showTriplet = state.fillPopoverFormat === "rgb" || state.fillPopoverFormat === "hsl";
      state.fillControls.tripletField.hidden = !showTriplet;
      state.fillControls.tripletField.style.display = showTriplet ? "grid" : "none";
      if (showTriplet && state.fillControls.tripletInputs?.length === 3) {
        const tripletValues = formatFillPopoverTripletValue(activeColor, state.fillPopoverFormat);
        const tripletConfig =
          state.fillPopoverFormat === "hsl"
            ? [
                { min: "0", max: "360", step: "1", placeholder: "0" },
                { min: "0", max: "100", step: "1", placeholder: "100" },
                { min: "0", max: "100", step: "1", placeholder: "50" }
              ]
            : [
                { min: "0", max: "255", step: "1", placeholder: "255" },
                { min: "0", max: "255", step: "1", placeholder: "255" },
                { min: "0", max: "255", step: "1", placeholder: "255" }
              ];
        state.fillControls.tripletInputs.forEach((field, index) => {
          field.value = String(tripletValues[index] ?? "");
          field.min = tripletConfig[index].min;
          field.max = tripletConfig[index].max;
          field.step = tripletConfig[index].step;
          field.placeholder = tripletConfig[index].placeholder;
        });
      }
    }
    if (state.fillControls.alphaInput) {
      state.fillControls.alphaInput.value = String(Math.round(clampAlpha(activeColor.a, 1) * 100));
    }

    if (state.fillPopover?.dataset.open === "true") {
      requestAnimationFrame(() => {
        const anchorRect = getFillPopoverAnchorRect();
        if (anchorRect) {
          state.fillPopoverAnchorRect = anchorRect;
          positionFillPopover(anchorRect);
        }
      });
    }
  }

  function syncFillPopoverFromTarget(target = state.adjustTarget) {
    if (!state.fillPopover || !target) {
      return;
    }

    const persistedTarget = ensureAdjustLayerState(target);
    if (!persistedTarget) {
      return;
    }

    const fallbackColor = colorStringToHsva(DEFAULT_FILL_CSS) || { h: 0, s: 0, v: 0, a: 1 };
    const activeConfig = getActiveFillConfig(target);
    const solidColor = colorStringToHsva(activeConfig?.css || activeConfig?.hex || DEFAULT_FILL_CSS, fallbackColor) || cloneHsvaColor(fallbackColor);
    const isOverlay = state.fillPopoverOverlayIndex !== null;
    const nextMode = isOverlay
      ? "solid"
      : persistedTarget.adjustFillType === "gradient" && persistedTarget.adjustStoredBackgroundImage
        ? "gradient"
        : "solid";

    state.fillPopoverMode = nextMode;
    state.fillPopoverSolidColor = cloneHsvaColor(solidColor);
    if (nextMode === "gradient") {
      const gradientConfig = parseLinearGradientConfig(persistedTarget.adjustStoredBackgroundImage, solidColor);
      state.fillPopoverGradientStops = gradientConfig.stops;
      state.fillPopoverGradientAngle = gradientConfig.angle;
    } else {
      state.fillPopoverGradientStops = ensureGradientStops(null, solidColor);
      state.fillPopoverGradientAngle = 0;
    }
    state.fillPopoverGradientActiveStop = clampNumber(
      state.fillPopoverGradientActiveStop,
      0,
      Math.max(0, (state.fillPopoverGradientStops?.length || 1) - 1),
      0
    );
    state.fillPopoverFormat = ["hex", "rgb", "hsl"].includes(state.fillPopoverFormat) ? state.fillPopoverFormat : "hex";
    state.fillPopoverFormatMenuOpen = false;
    renderFillPopoverControls();
  }

  function applyFillPopoverState({ commit = false, sync = true } = {}) {
    if (!state.adjustTarget) {
      return;
    }

    const persistedTarget = ensureAdjustLayerState(state.adjustTarget);
    if (!persistedTarget) {
      return;
    }

    const overlayIndex = state.fillPopoverOverlayIndex;
    if (overlayIndex !== null) {
      const overlayLayers = [...(persistedTarget.adjustFillOverlayLayers || [])];
      if (!overlayLayers[overlayIndex]) {
        closeFillPopover();
        return;
      }

      const color = getActiveFillPopoverColor();
      overlayLayers[overlayIndex] = {
        ...overlayLayers[overlayIndex],
        visible: true,
        colorHex: hsvaToHex(color),
        colorCss: hsvaToCss(color)
      };
      persistedTarget.adjustFillOverlayLayers = overlayLayers;
    } else if (state.fillPopoverMode === "gradient") {
      const gradientStops = ensureGradientStops(state.fillPopoverGradientStops, state.fillPopoverSolidColor);
      const startColor = gradientStops[0];
      persistedTarget.adjustFillEnabled = true;
      persistedTarget.adjustFillVisible = true;
      persistedTarget.adjustFillType = "gradient";
      persistedTarget.adjustStoredBackgroundHex = hsvaToHex(startColor);
      persistedTarget.adjustStoredBackgroundColor = hsvaToCss(startColor);
      persistedTarget.adjustStoredBackgroundImage = buildLinearGradientCss(state.fillPopoverGradientAngle, gradientStops);
    } else {
      const color = cloneHsvaColor(state.fillPopoverSolidColor || colorStringToHsva(DEFAULT_FILL_CSS) || { h: 0, s: 0, v: 0, a: 1 });
      persistedTarget.adjustFillEnabled = true;
      persistedTarget.adjustFillVisible = true;
      persistedTarget.adjustFillType = "color";
      persistedTarget.adjustStoredBackgroundHex = hsvaToHex(color);
      persistedTarget.adjustStoredBackgroundColor = hsvaToCss(color);
      persistedTarget.adjustStoredBackgroundImage = "";
    }

    applyFillLayerState(persistedTarget);
    refreshAdjustPromptText(persistedTarget);
    if (sync) {
      syncFillPopoverFromTarget(persistedTarget);
      syncAdjustPopoverFromTarget(persistedTarget);
    }
    renderSelection();

    if (commit) {
      commitAdjustChanges();
    }
  }

  function setActiveFillPopoverColor(nextColor, { commit = false, sync = true } = {}) {
    if (state.fillPopoverMode === "gradient") {
      const stops = ensureGradientStops(state.fillPopoverGradientStops, state.fillPopoverSolidColor);
      const index = clampNumber(state.fillPopoverGradientActiveStop, 0, Math.max(0, stops.length - 1), 0);
      stops[index] = {
        ...stops[index],
        ...nextColor,
        a: nextColor?.a == null ? stops[index].a : clampAlpha(nextColor.a, stops[index].a)
      };
      state.fillPopoverGradientStops = stops;
    } else {
      const current = cloneHsvaColor(state.fillPopoverSolidColor || colorStringToHsva(DEFAULT_FILL_CSS) || { h: 0, s: 0, v: 0, a: 1 });
      state.fillPopoverSolidColor = {
        ...current,
        ...nextColor,
        a: nextColor?.a == null ? current.a : clampAlpha(nextColor.a, current.a)
      };
    }

    applyFillPopoverState({ commit, sync });
  }

  function setFillPopoverMode(mode, { commit = false, sync = true } = {}) {
    if (state.fillPopoverOverlayIndex !== null) {
      return;
    }

    const nextMode = mode === "gradient" ? "gradient" : "solid";
    if (nextMode === state.fillPopoverMode) {
      return;
    }

    const baseColor = cloneHsvaColor(state.fillPopoverSolidColor || getActiveFillPopoverColor());
    state.fillPopoverMode = nextMode;
    if (nextMode === "gradient") {
      state.fillPopoverGradientStops = ensureGradientStops(
        [
          { ...cloneHsvaColor(baseColor), position: 0 },
          { ...cloneHsvaColor(baseColor), position: 100 }
        ],
        baseColor
      );
      state.fillPopoverGradientActiveStop = 0;
      state.fillPopoverGradientAngle = clampNumber(state.fillPopoverGradientAngle, -360, 360, 0);
    } else {
      state.fillPopoverSolidColor = cloneHsvaColor(baseColor);
    }
    applyFillPopoverState({ commit, sync });
  }

  function addFillPopoverGradientStop() {
    if (state.fillPopoverMode !== "gradient" || state.fillPopoverOverlayIndex !== null) {
      return;
    }

    const stops = ensureGradientStops(state.fillPopoverGradientStops, state.fillPopoverSolidColor);
    const activeIndex = clampNumber(state.fillPopoverGradientActiveStop, 0, Math.max(0, stops.length - 1), 0);
    const hasNext = activeIndex < stops.length - 1;
    const leftStop = hasNext ? stops[activeIndex] : stops[Math.max(0, activeIndex - 1)];
    const rightStop = hasNext ? stops[activeIndex + 1] : stops[activeIndex];
    const insertIndex = hasNext ? activeIndex + 1 : activeIndex;
    const fallbackPosition = Math.round((leftStop.position + rightStop.position) / 2);
    const newPosition = clampNumber(
      fallbackPosition,
      hasNext ? leftStop.position + 1 : leftStop.position === rightStop.position ? Math.max(0, rightStop.position - 1) : leftStop.position + 1,
      hasNext ? rightStop.position - 1 : Math.max(0, rightStop.position - 1),
      fallbackPosition
    );

    stops.splice(insertIndex, 0, {
      ...cloneHsvaColor(stops[activeIndex]),
      position: newPosition
    });
    state.fillPopoverGradientStops = stops;
    state.fillPopoverGradientActiveStop = insertIndex;
    applyFillPopoverState({ commit: true, sync: true });
  }

  function swapFillPopoverGradientStops() {
    if (state.fillPopoverMode !== "gradient" || state.fillPopoverOverlayIndex !== null) {
      return;
    }

    const stops = ensureGradientStops(state.fillPopoverGradientStops, state.fillPopoverSolidColor);
    const activeIndex = clampNumber(state.fillPopoverGradientActiveStop, 0, Math.max(0, stops.length - 1), 0);
    state.fillPopoverGradientStops = [...stops]
      .reverse()
      .map((stop) => ({
        ...cloneHsvaColor(stop),
        position: 100 - stop.position
      }))
      .sort((a, b) => a.position - b.position);
    state.fillPopoverGradientActiveStop = Math.max(0, stops.length - 1 - activeIndex);
    applyFillPopoverState({ commit: true, sync: true });
  }

  function beginFillPopoverDrag(type, event, extras = {}) {
    if (!state.fillPopover) {
      return;
    }

    state.fillPopoverDragSession = {
      type,
      pointerId: event.pointerId,
      stopIndex: Number.isInteger(extras.stopIndex) ? extras.stopIndex : null
    };
    updateFillPopoverDrag(event, false);
  }

  function updateFillPopoverDrag(event, commit = false) {
    if (!state.fillPopoverDragSession || !state.fillControls) {
      return false;
    }

    const activeColor = getActiveFillPopoverColor();
    if (!activeColor) {
      return false;
    }

    if (state.fillPopoverDragSession.type === "sv" && state.fillControls.svPanel) {
      const rect = state.fillControls.svPanel.getBoundingClientRect();
      const s = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
      const v = Math.min(100, Math.max(0, 100 - ((event.clientY - rect.top) / rect.height) * 100));
      setActiveFillPopoverColor({ s, v }, { commit, sync: true });
      return true;
    }

    if (state.fillPopoverDragSession.type === "gradient-stop" && state.fillControls.gradientTrack) {
      const rect = state.fillControls.gradientTrack.getBoundingClientRect();
      const stops = ensureGradientStops(state.fillPopoverGradientStops, state.fillPopoverSolidColor);
      const index = clampNumber(
        state.fillPopoverDragSession.stopIndex,
        0,
        Math.max(0, stops.length - 1),
        0
      );
      const previous = index > 0 ? stops[index - 1].position + 1 : 0;
      const next = index < stops.length - 1 ? stops[index + 1].position - 1 : 100;
      const position = clampNumber(((event.clientX - rect.left) / rect.width) * 100, previous, next, stops[index].position);
      stops[index] = {
        ...stops[index],
        position
      };
      state.fillPopoverGradientStops = stops;
      state.fillPopoverGradientActiveStop = index;
      applyFillPopoverState({ commit, sync: true });
      return true;
    }

    return false;
  }

  function finishFillPopoverDrag(event) {
    if (!state.fillPopoverDragSession) {
      return false;
    }

    updateFillPopoverDrag(event, true);
    state.fillPopoverDragSession = null;
    return true;
  }

  function updateAdjustFillColorValue({ overlayIndex = null, hex = null, alpha = null, commit = false, sync = true } = {}) {
    if (!state.adjustTarget) {
      return;
    }

    const persistedTarget = ensureAdjustLayerState(state.adjustTarget);
    if (!persistedTarget) {
      return;
    }

    const isOverlay = Number.isInteger(overlayIndex) && overlayIndex >= 0;
    const current = isOverlay
      ? parseAdjustColor(
          persistedTarget.adjustFillOverlayLayers?.[overlayIndex]?.colorCss ||
          persistedTarget.adjustFillOverlayLayers?.[overlayIndex]?.colorHex ||
          DEFAULT_FILL_CSS
        ) || parseAdjustColor(DEFAULT_FILL_CSS)
      : parseAdjustColor(
          persistedTarget.adjustStoredBackgroundColor ||
          persistedTarget.adjustStoredBackgroundHex ||
          DEFAULT_FILL_CSS
        ) || parseAdjustColor(DEFAULT_FILL_CSS);

    const nextHex = normalizeHexColor(hex) || current?.hex || DEFAULT_FILL_HEX;
    const nextAlpha = alpha == null
      ? clampAlpha(current?.alpha, 1)
      : clampNumber(alpha, 0, 100, Math.round(clampAlpha(current?.alpha, 1) * 100)) / 100;
    const nextCss = buildAdjustColorCss(nextHex, nextAlpha);

    if (isOverlay) {
      const layer = persistedTarget.adjustFillOverlayLayers?.[overlayIndex];
      if (!layer) {
        return;
      }
      layer.colorHex = nextHex;
      layer.colorCss = nextCss;
    } else {
      persistedTarget.adjustStoredBackgroundHex = nextHex;
      persistedTarget.adjustStoredBackgroundColor = nextCss;
      persistedTarget.adjustStoredBackgroundImage = "";
      persistedTarget.adjustFillType = "color";
      persistedTarget.adjustFillEnabled = true;
      persistedTarget.adjustFillVisible = true;
    }

    applyFillLayerState(persistedTarget);
    refreshAdjustPromptText(persistedTarget);
    if (sync) {
      syncAdjustPopoverFromTarget(persistedTarget);
    }
    renderSelection();

    if (commit) {
      commitAdjustChanges();
    }
  }

  function syncShadowPopoverFromTarget(target = state.adjustTarget) {
    if (!state.shadowPopover || !target) {
      return;
    }

    const config = getActiveShadowConfig(target, state.shadowPopoverType);
    if (!config) {
      return;
    }

    state.shadowControls.segments?.forEach((segment) => {
      segment.dataset.state = segment.dataset.shadowPopoverType === state.shadowPopoverType ? "active" : "inactive";
    });

    if (state.shadowControls.x) {
      state.shadowControls.x.value = String(Math.round(config.x));
    }
    if (state.shadowControls.y) {
      state.shadowControls.y.value = String(Math.round(config.y));
    }
    if (state.shadowControls.blur) {
      state.shadowControls.blur.value = String(Math.round(config.blur));
    }
    if (state.shadowControls.colorInput) {
      state.shadowControls.colorInput.value = config.colorHex || DEFAULT_FILL_HEX;
    }
    if (state.shadowControls.colorText) {
      state.shadowControls.colorText.value = (config.colorHex || DEFAULT_FILL_HEX).replace(/^#/, "").toUpperCase();
    }
    if (state.shadowControls.alpha) {
      state.shadowControls.alpha.value = String(Math.round(clampAlpha(config.alpha, DEFAULT_SHADOW_ALPHA) * 100));
    }
    if (state.shadowControls.swatch) {
      const preview = parseAdjustColor(config.colorHex || DEFAULT_FILL_HEX) || parseAdjustColor(DEFAULT_FILL_HEX);
      const hex = preview?.hex || DEFAULT_FILL_HEX;
      const red = Number.parseInt(hex.slice(1, 3), 16);
      const green = Number.parseInt(hex.slice(3, 5), 16);
      const blue = Number.parseInt(hex.slice(5, 7), 16);
      state.shadowControls.swatch.style.setProperty("--swatch-color", `rgba(${red}, ${green}, ${blue}, ${clampAlpha(config.alpha, DEFAULT_SHADOW_ALPHA)})`);
    }
  }

  function positionFillPopover(anchorRect) {
    if (!state.fillPopover || !anchorRect) {
      return;
    }

    const measuredRect = state.fillPopover.getBoundingClientRect();
    const popoverWidth = Math.min(Math.ceil(measuredRect.width || state.fillPopover.offsetWidth || 280), window.innerWidth - 32);
    const popoverHeight = Math.min(Math.ceil(measuredRect.height || state.fillPopover.offsetHeight || 454), window.innerHeight - 32);
    const viewportPadding = 16;
    const anchorGap = 12;
    let left = anchorRect.right + anchorGap;
    let top = anchorRect.top;

    if (left + popoverWidth > window.innerWidth - viewportPadding) {
      left = anchorRect.left - popoverWidth - anchorGap;
    }

    left = Math.max(viewportPadding, Math.min(left, window.innerWidth - popoverWidth - viewportPadding));
    top = Math.max(viewportPadding, Math.min(top, window.innerHeight - popoverHeight - viewportPadding));

    state.fillPopover.style.left = `${left}px`;
    state.fillPopover.style.top = `${top}px`;
  }

  function getFillPopoverAnchorRect() {
    if (!state.adjustPopover) {
      return state.fillPopoverAnchorRect;
    }

    const row =
      state.fillPopoverOverlayIndex !== null
        ? state.adjustPopover.querySelector(
            `[data-adjust-row="fill-overlay"][data-overlay-index="${state.fillPopoverOverlayIndex}"]`
          )
        : state.adjustPopover.querySelector('[data-adjust-row="fill"]');

    return row?.getBoundingClientRect?.() || state.fillPopoverAnchorRect;
  }

  function positionShadowPopover(anchorRect) {
    if (!state.shadowPopover || !anchorRect) {
      return;
    }

    const popoverWidth = Math.min(state.shadowPopover.offsetWidth || 294, window.innerWidth - 32);
    const popoverHeight = Math.min(state.shadowPopover.offsetHeight || 240, window.innerHeight - 32);
    const viewportPadding = 16;
    const anchorGap = 12;
    let left = anchorRect.right + anchorGap;
    let top = anchorRect.top;

    if (left + popoverWidth > window.innerWidth - viewportPadding) {
      left = anchorRect.left - popoverWidth - anchorGap;
    }

    left = Math.max(viewportPadding, Math.min(left, window.innerWidth - popoverWidth - viewportPadding));
    top = Math.max(viewportPadding, Math.min(top, window.innerHeight - popoverHeight - viewportPadding));

    state.shadowPopover.style.left = `${left}px`;
    state.shadowPopover.style.top = `${top}px`;
  }

  function openFillPopover(anchorRect = null, { overlayIndex = null } = {}) {
    if (!state.adjustTarget) {
      return;
    }

    ensureFillPopover();
    closeSizeMenu();
    closeShadowPopover();
    state.fillPopoverFormatMenuOpen = false;
    state.fillPopoverOverlayIndex = Number.isInteger(overlayIndex) && overlayIndex >= 0 ? overlayIndex : null;
    state.fillPopoverAnchorRect = anchorRect || state.fillPopoverAnchorRect;
    syncFillPopoverFromTarget(state.adjustTarget);
    state.fillPopover.dataset.open = "true";
    syncAdjustPopoverFromTarget(state.adjustTarget);
    state.fillPopoverAnchorRect = getFillPopoverAnchorRect();
    positionFillPopover(state.fillPopoverAnchorRect);
    requestAnimationFrame(() => {
      if (!state.fillPopover || state.fillPopover.dataset.open !== "true") {
        return;
      }
      state.fillPopoverAnchorRect = getFillPopoverAnchorRect();
      positionFillPopover(state.fillPopoverAnchorRect);
    });
  }

  function openShadowPopover(shadowType = "outer", anchorRect = null, { overlayIndex = null } = {}) {
    if (!state.adjustTarget) {
      return;
    }

    ensureShadowPopover();
    closeSizeMenu();
    closeFillPopover();
    state.shadowPopoverType = shadowType === "inner" ? "inner" : "outer";
    state.shadowPopoverOverlayIndex = Number.isInteger(overlayIndex) && overlayIndex >= 0 ? overlayIndex : null;
    state.shadowPopoverAnchorRect = anchorRect || state.shadowPopoverAnchorRect;
    syncShadowPopoverFromTarget(state.adjustTarget);
    state.shadowPopover.dataset.open = "true";
    syncAdjustPopoverFromTarget(state.adjustTarget);
    positionShadowPopover(anchorRect || state.shadowPopoverAnchorRect);
  }

  function closeFillPopover() {
    if (!state.fillPopover) {
      return;
    }
    state.fillPopover.dataset.open = "false";
    state.fillPopoverDragSession = null;
    state.fillPopoverFormatMenuOpen = false;
    state.fillPopoverOverlayIndex = null;
    state.fillPopoverAnchorRect = null;
    if (state.adjustTarget) {
      syncAdjustPopoverFromTarget(state.adjustTarget);
    }
  }

  function syncSizeMenuFromTarget(target = state.adjustTarget) {
    if (!state.sizeMenu || !target || !state.sizeMenuProp) {
      return;
    }

    const currentMode = getAdjustSizeMode(target, state.sizeMenuProp);
    state.sizeMenuControls.items?.forEach((item) => {
      item.dataset.state = item.dataset.sizeMode === currentMode ? "active" : "inactive";
    });
  }

  function positionSizeMenu(anchorRect) {
    if (!state.sizeMenu || !anchorRect) {
      return;
    }

    const menuWidth = Math.min(state.sizeMenu.offsetWidth || 156, window.innerWidth - 32);
    const menuHeight = Math.min(state.sizeMenu.offsetHeight || 112, window.innerHeight - 32);
    const viewportPadding = 16;
    const anchorGap = 8;
    let left = anchorRect.left;
    let top = anchorRect.bottom + anchorGap;

    if (left + menuWidth > window.innerWidth - viewportPadding) {
      left = anchorRect.right - menuWidth;
    }
    if (top + menuHeight > window.innerHeight - viewportPadding) {
      top = anchorRect.top - menuHeight - anchorGap;
    }

    left = Math.max(viewportPadding, Math.min(left, window.innerWidth - menuWidth - viewportPadding));
    top = Math.max(viewportPadding, Math.min(top, window.innerHeight - menuHeight - viewportPadding));

    state.sizeMenu.style.left = `${left}px`;
    state.sizeMenu.style.top = `${top}px`;
  }

  function openSizeMenu(prop, anchorRect = null) {
    if (!state.adjustTarget) {
      return;
    }

    ensureSizeMenu();
    closeFillPopover();
    closeShadowPopover();
    state.sizeMenuProp = prop === "height" ? "height" : "width";
    state.sizeMenuAnchorRect = anchorRect || state.sizeMenuAnchorRect;
    syncSizeMenuFromTarget(state.adjustTarget);
    state.sizeMenu.dataset.open = "true";
    syncAdjustPopoverFromTarget(state.adjustTarget);
    positionSizeMenu(anchorRect || state.sizeMenuAnchorRect);
  }

  function closeSizeMenu() {
    if (!state.sizeMenu) {
      return;
    }
    state.sizeMenu.dataset.open = "false";
    state.sizeMenuProp = null;
    state.sizeMenuAnchorRect = null;
    if (state.adjustTarget) {
      syncAdjustPopoverFromTarget(state.adjustTarget);
    }
  }

  function applyAdjustSizeMode(prop, mode, { commit = false, sync = true } = {}) {
    if (!state.adjustTarget || !prop) {
      return;
    }

    const element = getTargetElement(state.adjustTarget);
    if (!(element instanceof Element)) {
      return;
    }

    const normalizedProp = prop === "height" ? "height" : "width";
    const targetMode = ["hug", "fixed", "fill"].includes(mode) ? mode : "fixed";
    const rect = element.getBoundingClientRect();
    const parentContext = getParentFlexContext(element);
    const isMainAxis =
      (normalizedProp === "width" && parentContext.direction === "row") ||
      (normalizedProp === "height" && parentContext.direction === "column");
    const sizeValue = `${Math.max(0, Math.round(normalizedProp === "width" ? rect.width : rect.height))}px`;

    if (!state.adjustStyleBaseline) {
      state.adjustStyleBaseline = captureAdjustableStyleSnapshot(element);
    }

    if (normalizedProp === "width") {
      element.style.minWidth = "";
    } else {
      element.style.minHeight = "";
    }

    if (targetMode === "fixed") {
      if (isMainAxis) {
        element.style.flexGrow = "0";
        element.style.flexBasis = "auto";
      }
      if (normalizedProp === "width") {
        element.style.alignSelf = element.style.alignSelf === "stretch" ? "" : element.style.alignSelf;
        element.style.width = sizeValue;
      } else {
        element.style.alignSelf = element.style.alignSelf === "stretch" ? "" : element.style.alignSelf;
        element.style.height = sizeValue;
      }
    }

    if (targetMode === "hug") {
      if (isMainAxis) {
        element.style.flexGrow = "0";
        element.style.flexBasis = "auto";
      }
      if (normalizedProp === "width") {
        element.style.width = "fit-content";
        if (parentContext.isFlex && parentContext.direction === "column") {
          element.style.alignSelf = "flex-start";
        }
      } else {
        element.style.height = "fit-content";
        if (parentContext.isFlex && parentContext.direction === "row") {
          element.style.alignSelf = "flex-start";
        }
      }
    }

    if (targetMode === "fill") {
      if (parentContext.isFlex) {
        if (isMainAxis) {
          element.style.flexGrow = "1";
          element.style.flexBasis = "0px";
          if (normalizedProp === "width") {
            element.style.width = "auto";
            element.style.minWidth = "0px";
          } else {
            element.style.height = "auto";
            element.style.minHeight = "0px";
          }
        } else {
          element.style.alignSelf = "stretch";
          if (normalizedProp === "width") {
            element.style.width = "auto";
          } else {
            element.style.height = "auto";
          }
        }
      } else if (normalizedProp === "width") {
        element.style.width = "100%";
      } else {
        element.style.height = "100%";
      }
    }

    refreshAdjustPromptText(state.adjustTarget);
    if (sync) {
      syncSizeMenuFromTarget(state.adjustTarget);
      syncAdjustPopoverFromTarget(state.adjustTarget);
    }
    renderSelection();

    if (commit) {
      commitAdjustChanges();
    }
  }

  function closeShadowPopover() {
    if (!state.shadowPopover) {
      return;
    }
    state.shadowPopover.dataset.open = "false";
    state.shadowPopoverOverlayIndex = null;
    state.shadowPopoverAnchorRect = null;
    if (state.adjustTarget) {
      syncAdjustPopoverFromTarget(state.adjustTarget);
    }
  }

  function setShadowPopoverType(
    shadowType,
    { ensureEnabled = false, commit = false, syncAdjust = false, syncShadow = true } = {}
  ) {
    if (!state.adjustTarget) {
      return;
    }

    const persistedTarget = ensureAdjustLayerState(state.adjustTarget);
    const previousType = state.shadowPopoverType === "inner" ? "inner" : "outer";
    const previousOverlayIndex = state.shadowPopoverOverlayIndex;
    state.shadowPopoverType = shadowType === "inner" ? "inner" : "outer";
    state.shadowPopoverOverlayIndex = previousOverlayIndex;

    if (ensureEnabled) {
      if (previousOverlayIndex !== null) {
        const overlayLayers = [...(persistedTarget.adjustAddedOuterShadowLayers || [])];
        const currentLayer = overlayLayers[previousOverlayIndex];
        if (currentLayer) {
          overlayLayers[previousOverlayIndex] = {
            ...currentLayer,
            type: state.shadowPopoverType,
            visible: currentLayer.visible !== false,
            config: {
              ...(currentLayer.config || getDefaultShadowConfig(previousType)),
              type: state.shadowPopoverType
            }
          };
          persistedTarget.adjustAddedOuterShadowLayers = overlayLayers;
        } else {
          state.shadowPopoverOverlayIndex = null;
        }
      } else if (previousType !== state.shadowPopoverType) {
        const previousConfig =
          previousType === "inner"
            ? persistedTarget.adjustShadowInnerConfig || getDefaultShadowConfig("inner")
            : persistedTarget.adjustShadowOuterConfig || getDefaultShadowConfig("outer");

        if (state.shadowPopoverType === "inner") {
          persistedTarget.adjustShadowInnerEnabled = true;
          persistedTarget.adjustShadowInnerVisible = true;
          persistedTarget.adjustShadowInnerConfig = {
            ...previousConfig,
            type: "inner"
          };
          persistedTarget.adjustShadowOuterEnabled = false;
          persistedTarget.adjustShadowOuterVisible = false;
        } else {
          persistedTarget.adjustShadowOuterEnabled = true;
          persistedTarget.adjustShadowOuterVisible = true;
          persistedTarget.adjustShadowOuterConfig = {
            ...previousConfig,
            type: "outer"
          };
          persistedTarget.adjustShadowInnerEnabled = false;
          persistedTarget.adjustShadowInnerVisible = false;
        }
      } else if (state.shadowPopoverType === "inner") {
        persistedTarget.adjustShadowInnerEnabled = true;
        persistedTarget.adjustShadowInnerVisible = true;
        persistedTarget.adjustShadowInnerConfig = persistedTarget.adjustShadowInnerConfig || getDefaultShadowConfig("inner");
        if (previousOverlayIndex === null) {
          persistedTarget.adjustShadowOuterEnabled = false;
          persistedTarget.adjustShadowOuterVisible = false;
        }
      } else {
        persistedTarget.adjustShadowOuterEnabled = true;
        persistedTarget.adjustShadowOuterVisible = true;
        persistedTarget.adjustShadowOuterConfig = persistedTarget.adjustShadowOuterConfig || getDefaultShadowConfig("outer");
        if (previousOverlayIndex === null) {
          persistedTarget.adjustShadowInnerEnabled = false;
          persistedTarget.adjustShadowInnerVisible = false;
        }
      }
      persistedTarget.adjustShadowActiveLayer = state.shadowPopoverType;
      applyShadowLayerState(persistedTarget);
      refreshAdjustPromptText(persistedTarget);
      renderSelection();
      if (syncAdjust) {
        syncAdjustPopoverFromTarget(persistedTarget);
      }
      if (commit) {
        commitAdjustChanges();
      }
    }

    if (syncShadow) {
      syncShadowPopoverFromTarget(state.adjustTarget);
    }
  }

  function applyShadowPopoverInput(prop, rawValue, { commit = false, sync = true } = {}) {
    if (!state.adjustTarget) {
      return;
    }

    const persistedTarget = ensureAdjustLayerState(state.adjustTarget);
    const shadowType = state.shadowPopoverType === "inner" ? "inner" : "outer";
    const configKey = shadowType === "inner" ? "adjustShadowInnerConfig" : "adjustShadowOuterConfig";
    const enabledKey = shadowType === "inner" ? "adjustShadowInnerEnabled" : "adjustShadowOuterEnabled";
    const visibleKey = shadowType === "inner" ? "adjustShadowInnerVisible" : "adjustShadowOuterVisible";
    const overlayIndex = state.shadowPopoverOverlayIndex;
    const config = {
      ...(
        overlayIndex !== null && shadowType === "outer"
          ? persistedTarget.adjustAddedOuterShadowLayers?.[overlayIndex]?.config || getDefaultShadowConfig("outer")
          : persistedTarget[configKey] || getDefaultShadowConfig(shadowType)
      ),
      type: shadowType
    };

    persistedTarget.adjustShadowActiveLayer = shadowType;
    if (overlayIndex === null) {
      persistedTarget[enabledKey] = true;
      persistedTarget[visibleKey] = true;
    }

    if (prop === "x") {
      config.x = clampNumber(rawValue, -999, 999, config.x);
    }
    if (prop === "y") {
      config.y = clampNumber(rawValue, -999, 999, config.y);
    }
    if (prop === "blur") {
      config.blur = clampNumber(rawValue, 0, 999, config.blur);
    }
    if (prop === "alpha") {
      config.alpha = clampNumber(rawValue, 0, 100, Math.round((config.alpha ?? DEFAULT_SHADOW_ALPHA) * 100)) / 100;
    }
    if (prop === "color") {
      const normalized = normalizeHexColor(rawValue);
      if (normalized) {
        config.colorHex = normalized;
      }
    }

    if (overlayIndex !== null) {
      persistedTarget.adjustAddedOuterShadowLayers = [...(persistedTarget.adjustAddedOuterShadowLayers || [])];
      if (persistedTarget.adjustAddedOuterShadowLayers[overlayIndex]) {
        persistedTarget.adjustAddedOuterShadowLayers[overlayIndex] = {
          ...persistedTarget.adjustAddedOuterShadowLayers[overlayIndex],
          type: shadowType,
          visible: true,
          config
        };
      }
    } else {
      persistedTarget[configKey] = config;
    }
    applyShadowLayerState(persistedTarget);
    refreshAdjustPromptText(persistedTarget);
    if (sync) {
      syncShadowPopoverFromTarget(persistedTarget);
      syncAdjustPopoverFromTarget(persistedTarget);
    }
    renderSelection();

    if (commit) {
      commitAdjustChanges();
    }
  }

  function syncAdjustPopoverFromTarget(target) {
    if (!state.adjustPopover || !target) {
      return;
    }

    const values = getAdjustValues(target);
    const persistedTarget = ensureAdjustLayerState(target, values);
    renderAdjustLayerRows(persistedTarget);
    const isFillPopoverOpen = state.fillPopover?.dataset.open === "true";
    const isShadowPopoverOpen = state.shadowPopover?.dataset.open === "true";
    const isSizeMenuOpen = state.sizeMenu?.dataset.open === "true";
    const activeSizeMenuProp = isSizeMenuOpen ? state.sizeMenuProp : null;
    const activeBaseShadowType =
      isShadowPopoverOpen && state.shadowPopoverOverlayIndex === null ? state.shadowPopoverType : null;
    syncAdjustSegments("layoutDirection", values.layoutDirection);
    syncAdjustAlignmentGrid(values);
    const baseFillSwatch = persistedTarget?.adjustFillType === "gradient" && persistedTarget?.adjustStoredBackgroundImage
      ? persistedTarget.adjustStoredBackgroundImage
      : persistedTarget?.adjustStoredBackgroundColor || values.backgroundColorCss || values.backgroundColor;
    const baseFillLabel = persistedTarget?.adjustFillType === "gradient"
      ? "线性渐变"
      : formatAdjustColorValue(persistedTarget?.adjustStoredBackgroundColor || values.backgroundColorCss || values.backgroundColor);

    if (state.adjustControls.backgroundColorInput) {
      state.adjustControls.backgroundColorInput.value =
        persistedTarget?.adjustStoredBackgroundHex || values.backgroundColor || DEFAULT_FILL_HEX;
    }
    if (state.adjustControls.backgroundColorText) {
      state.adjustControls.backgroundColorText.value = persistedTarget?.adjustFillEnabled
        ? (
            persistedTarget?.adjustFillType === "gradient"
              ? "线性渐变"
              : formatAdjustColorHexValue(persistedTarget?.adjustStoredBackgroundColor || values.backgroundColorCss || values.backgroundColor)
          ) || "无填充"
        : "无填充";
      state.adjustControls.backgroundColorText.readOnly = !persistedTarget?.adjustFillEnabled || persistedTarget?.adjustFillType === "gradient";
    }
    if (state.adjustControls.backgroundColorAlpha) {
      state.adjustControls.backgroundColorAlpha.value = persistedTarget?.adjustFillEnabled
        ? formatAdjustColorAlphaValue(persistedTarget?.adjustStoredBackgroundColor || values.backgroundColorCss || values.backgroundColor, 100)
        : "100";
      state.adjustControls.backgroundColorAlpha.readOnly = !persistedTarget?.adjustFillEnabled || persistedTarget?.adjustFillType === "gradient";
    }
    if (state.adjustControls.backgroundColorRow) {
      state.adjustControls.backgroundColorRow.dataset.state =
        isFillPopoverOpen && state.fillPopoverOverlayIndex === null ? "active" : "default";
      state.adjustControls.backgroundColorRow.dataset.visible =
        persistedTarget?.adjustFillEnabled && persistedTarget?.adjustFillVisible ? "true" : "false";
    }
    if (state.adjustControls.backgroundColorSwatch) {
      state.adjustControls.backgroundColorSwatch.dataset.empty = persistedTarget?.adjustFillEnabled ? "false" : "true";
      state.adjustControls.backgroundColorSwatch.style.setProperty(
        "--swatch-color",
        persistedTarget?.adjustFillEnabled ? baseFillSwatch : "transparent"
      );
      state.adjustControls.backgroundColorSwatch.style.borderColor = persistedTarget?.adjustFillEnabled ? "transparent" : "#ebebeb";
    }
    if (state.adjustControls.width) {
      state.adjustControls.width.value = String(values.width);
      state.adjustControls.width.readOnly = values.widthMode !== "fixed";
      state.adjustControls.width.setAttribute("aria-readonly", values.widthMode !== "fixed" ? "true" : "false");
      state.adjustControls.width.title =
        values.widthMode === "fixed" ? "固定宽度" : values.widthMode === "hug" ? "当前为 Hug 自适应宽度" : "当前为 Fill 填满宽度";
    }
    if (state.adjustControls.widthRow) {
      state.adjustControls.widthRow.dataset.sizeMode = values.widthMode;
      state.adjustControls.widthRow.dataset.sizeMenuOpen = activeSizeMenuProp === "width" ? "true" : "false";
      const widthButton = state.adjustControls.widthRow.querySelector('[data-action="open-size-menu"]');
      if (widthButton) {
        widthButton.dataset.state = activeSizeMenuProp === "width" ? "active" : "default";
        widthButton.setAttribute("aria-expanded", activeSizeMenuProp === "width" ? "true" : "false");
      }
    }
    if (state.adjustControls.height) {
      state.adjustControls.height.value = String(values.height);
      state.adjustControls.height.readOnly = values.heightMode !== "fixed";
      state.adjustControls.height.setAttribute("aria-readonly", values.heightMode !== "fixed" ? "true" : "false");
      state.adjustControls.height.title =
        values.heightMode === "fixed" ? "固定高度" : values.heightMode === "hug" ? "当前为 Hug 自适应高度" : "当前为 Fill 填满高度";
    }
    if (state.adjustControls.heightRow) {
      state.adjustControls.heightRow.dataset.sizeMode = values.heightMode;
      state.adjustControls.heightRow.dataset.sizeMenuOpen = activeSizeMenuProp === "height" ? "true" : "false";
      const heightButton = state.adjustControls.heightRow.querySelector('[data-action="open-size-menu"]');
      if (heightButton) {
        heightButton.dataset.state = activeSizeMenuProp === "height" ? "active" : "default";
        heightButton.setAttribute("aria-expanded", activeSizeMenuProp === "height" ? "true" : "false");
      }
    }
    if (state.adjustControls.borderRadius) {
      state.adjustControls.borderRadius.value = String(values.borderRadius);
    }
    if (state.adjustControls.opacity) {
      state.adjustControls.opacity.value = String(values.opacity);
    }
    if (state.adjustControls.gap) {
      state.adjustControls.gap.value = String(values.gap);
    }
    if (state.adjustControls.paddingTop) {
      state.adjustControls.paddingTop.value = String(values.paddingTop);
    }
    if (state.adjustControls.paddingRight) {
      state.adjustControls.paddingRight.value = String(values.paddingRight);
    }
    if (state.adjustControls.paddingBottom) {
      state.adjustControls.paddingBottom.value = String(values.paddingBottom);
    }
    if (state.adjustControls.paddingLeft) {
      state.adjustControls.paddingLeft.value = String(values.paddingLeft);
    }
    if (state.adjustControls.shadowStack) {
      const hasShadowLayer = Boolean(
        (persistedTarget?.adjustAddedOuterShadowLayers || []).length
      );
      state.adjustControls.shadowStack.dataset.empty = hasShadowLayer ? "false" : "true";
      state.adjustControls.shadowStack.hidden = !hasShadowLayer;

      const shadowRows = state.adjustControls.shadowStack.querySelectorAll('[data-adjust-row="shadow-overlay"]');
      shadowRows.forEach((row) => {
        row.dataset.state = "default";
      });

      if (isShadowPopoverOpen) {
        const activeRow =
          state.shadowPopoverOverlayIndex !== null
            ? state.adjustControls.shadowStack.querySelector(`[data-adjust-row="shadow-overlay"][data-overlay-index="${state.shadowPopoverOverlayIndex}"]`)
            : null;
        if (activeRow) {
          activeRow.dataset.state = "active";
        }
      }
    }

    if (isFillPopoverOpen) {
      syncFillPopoverFromTarget(persistedTarget);
    }

    if (isSizeMenuOpen) {
      syncSizeMenuFromTarget(persistedTarget);
    }
  }

  function positionAdjustPopover(target, anchorRect = null) {
    if (!state.adjustPopover) {
      return;
    }

    const rect = mergeRects(getTargetClientRects(target)) || getTargetElement(target).getBoundingClientRect();
    const popoverWidth = Math.min(state.adjustPopover.offsetWidth || 320, window.innerWidth - 32);
    const popoverHeight = Math.min(state.adjustPopover.offsetHeight || 680, window.innerHeight - 32);
    const viewportPadding = 16;
    const placement = getNonOverlappingPopoverPosition(rect, popoverWidth, popoverHeight, {
      desiredTop: (anchorRect || rect).top - 8,
      desiredLeft: rect.left
    });
    const top = placement.top;

    const availableHeight = Math.max(240, window.innerHeight - top - viewportPadding);
    state.adjustPopover.style.maxHeight = `${availableHeight}px`;
    state.adjustPopover.style.overflow = "hidden";
    if (state.adjustControls?.body) {
      const headerHeight =
        (state.adjustPopover.querySelector(".chat-context-picker-adjust-header")?.offsetHeight || 0) +
        (state.adjustPopover.querySelector(".chat-context-picker-adjust-divider")?.offsetHeight || 0);
      const bodyMaxHeight = Math.max(160, availableHeight - headerHeight - 24);
      state.adjustControls.body.style.maxHeight = `${bodyMaxHeight}px`;
    }

    state.adjustPopover.style.left = `${placement.left}px`;
    state.adjustPopover.style.top = `${top}px`;
  }

  function isAdjustOpen() {
    return Boolean(state.adjustPopover && state.adjustPopover.dataset.open === "true");
  }

  function commitAdjustChanges() {
    if (!state.adjustTarget) {
      return;
    }

    const element = getTargetElement(state.adjustTarget);
    const currentSnapshot = captureAdjustableStyleSnapshot(element);
    if (!state.adjustStyleBaseline || areStyleSnapshotsEqual(state.adjustStyleBaseline, currentSnapshot)) {
      return;
    }

    pushHistoryEntry({
      type: "style-inline",
      element,
      snapshot: state.adjustStyleBaseline
    });
    state.adjustStyleBaseline = currentSnapshot;
  }

  function openAdjustPopover(target, anchorRect = null) {
    ensureAdjustPopover();
    ensureSizeMenu();
    ensureFillPopover();
    ensureShadowPopover();
    closePromptPopover();
    commitAdjustChanges();
    closeSizeMenu();
    closeFillPopover();
    closeShadowPopover();

    const persistedTarget = findSelectedTarget(target) || target;
    hydrateAdjustLayerState(persistedTarget);
    state.adjustTarget = persistedTarget;
    state.adjustStyleBaseline = captureAdjustableStyleSnapshot(getTargetElement(persistedTarget));
    syncAdjustPopoverFromTarget(persistedTarget);
    positionAdjustPopover(persistedTarget, anchorRect);
    state.adjustPopover.dataset.open = "true";
    state.hoveredTarget = null;
    state.hoveredSelectedTarget = persistedTarget;
    refreshHighlights();
  }

  function closeAdjustPopover() {
    if (!state.adjustPopover) {
      return;
    }

    commitAdjustChanges();
    closeSizeMenu();
    closeFillPopover();
    closeShadowPopover();
    state.adjustPopover.dataset.open = "false";
    state.adjustTarget = null;
    state.adjustStyleBaseline = null;
    refreshHighlights();
  }

  function applyAdjustAlignment(horizontal, vertical, { commit = false } = {}) {
    if (!state.adjustTarget) {
      return;
    }

    const element = getTargetElement(state.adjustTarget);
    if (!(element instanceof Element)) {
      return;
    }

    if (!state.adjustStyleBaseline) {
      state.adjustStyleBaseline = captureAdjustableStyleSnapshot(element);
    }

    if (!/flex/.test(window.getComputedStyle(element).display)) {
      element.style.display = "flex";
      if (!element.style.flexDirection) {
        element.style.flexDirection = "row";
      }
    }

    const direction = window.getComputedStyle(element).flexDirection.startsWith("column") ? "column" : "row";
    if (direction === "column") {
      element.style.justifyContent = physicalPositionToFlex(vertical);
      element.style.alignItems = physicalPositionToFlex(horizontal);
    } else {
      element.style.justifyContent = physicalPositionToFlex(horizontal);
      element.style.alignItems = physicalPositionToFlex(vertical);
    }

    refreshAdjustPromptText(state.adjustTarget);
    syncAdjustPopoverFromTarget(state.adjustTarget);
    renderSelection();

    if (commit) {
      commitAdjustChanges();
    }
  }

  function applyAdjustControl(prop, rawValue, { commit = false, sync = true } = {}) {
    if (!state.adjustTarget) {
      return;
    }

    const element = getTargetElement(state.adjustTarget);
    if (!(element instanceof Element)) {
      return;
    }

    if (!state.adjustStyleBaseline) {
      state.adjustStyleBaseline = captureAdjustableStyleSnapshot(element);
    }

    if (prop === "layoutDirection") {
      const currentValues = getAdjustValues(state.adjustTarget);
      const currentPhysicalAlignment = getPhysicalAlignment(currentValues);
      if (rawValue === "none") {
        element.style.display = "";
        element.style.flexDirection = "";
        element.style.justifyContent = "";
        element.style.alignItems = "";
      } else {
        element.style.display = "flex";
        element.style.flexDirection = rawValue;
        if (rawValue === "column") {
          element.style.justifyContent = physicalPositionToFlex(currentPhysicalAlignment.vertical);
          element.style.alignItems = physicalPositionToFlex(currentPhysicalAlignment.horizontal);
        } else {
          element.style.justifyContent = physicalPositionToFlex(currentPhysicalAlignment.horizontal);
          element.style.alignItems = physicalPositionToFlex(currentPhysicalAlignment.vertical);
        }
      }
      syncAdjustSegments("layoutDirection", rawValue);
    }

    if (prop === "width") {
      element.style.width = `${clampNumber(rawValue, 0, 9999, 0)}px`;
    }

    if (prop === "height") {
      element.style.height = `${clampNumber(rawValue, 0, 9999, 0)}px`;
    }

    if (prop === "gap") {
      element.style.gap = `${clampNumber(rawValue, 0, 999, 0)}px`;
    }

    if (prop === "paddingTop") {
      element.style.paddingTop = `${clampNumber(rawValue, 0, 999, 0)}px`;
    }

    if (prop === "paddingRight") {
      element.style.paddingRight = `${clampNumber(rawValue, 0, 999, 0)}px`;
    }

    if (prop === "paddingBottom") {
      element.style.paddingBottom = `${clampNumber(rawValue, 0, 999, 0)}px`;
    }

    if (prop === "paddingLeft") {
      element.style.paddingLeft = `${clampNumber(rawValue, 0, 999, 0)}px`;
    }

    if (prop === "backgroundColor") {
      const parsed = parseAdjustColorInputValue(rawValue);
      const persistedTarget = ensureAdjustLayerState(state.adjustTarget);
      if (parsed) {
        persistedTarget.adjustStoredBackgroundColor = parsed.css;
        persistedTarget.adjustStoredBackgroundHex = parsed.hex;
        persistedTarget.adjustStoredBackgroundImage = "";
        persistedTarget.adjustFillType = "color";
        persistedTarget.adjustFillEnabled = true;
        persistedTarget.adjustFillVisible = true;
      } else {
        persistedTarget.adjustFillType = "none";
        persistedTarget.adjustFillEnabled = false;
        persistedTarget.adjustFillVisible = false;
        persistedTarget.adjustFillOverlayLayers = [];
        persistedTarget.adjustStoredBackgroundHex = "";
      }
      applyFillLayerState(persistedTarget);
    }

    if (prop === "borderRadius") {
      element.style.borderRadius = `${clampNumber(rawValue, 0, 999, 0)}px`;
    }

    if (prop === "opacity") {
      element.style.opacity = String(clampNumber(rawValue, 0, 100, 100) / 100);
    }

    if (prop === "shadowType") {
      const persistedTarget = ensureAdjustLayerState(state.adjustTarget);
      if (rawValue === "outer") {
        persistedTarget.adjustShadowOuterEnabled = true;
        persistedTarget.adjustShadowOuterVisible = true;
        persistedTarget.adjustShadowActiveLayer = "outer";
      } else if (rawValue === "inner") {
        persistedTarget.adjustShadowInnerEnabled = true;
        persistedTarget.adjustShadowInnerVisible = true;
        persistedTarget.adjustShadowActiveLayer = "inner";
      } else {
        persistedTarget.adjustShadowOuterEnabled = false;
        persistedTarget.adjustShadowOuterVisible = false;
        persistedTarget.adjustShadowInnerEnabled = false;
        persistedTarget.adjustShadowInnerVisible = false;
      }
      applyShadowLayerState(persistedTarget);
    }

    refreshAdjustPromptText(state.adjustTarget);
    if (sync) {
      syncAdjustPopoverFromTarget(state.adjustTarget);
    }
    renderSelection();

    if (commit) {
      commitAdjustChanges();
    }
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
    state.selectedTargets = [];
    state.hoveredTarget = null;
    state.hoveredSelectedTarget = null;
    pushSelectionHistory(previous);
    renderSelection();
    refreshHighlights();
    closePromptPopover();
    closeAdjustPopover();
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
    const isLayoutMode = state.selectionMode === "layout";
    const layoutSummary = isLayoutMode
      ? [
          "### 布局调整说明",
          "- 当前任务类型：移动已选元素的位置 / 调整这些元素的排列顺序",
          `- 当前选中顺序：${items.map((item) => `目标 ${item.index}`).join(" -> ") || "无"}`,
          "- 如果没有额外提示词，默认优先理解为对这些目标做移动位置或重排，而不是仅修改样式",
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
            ? "该目标用于布局移动/顺序调整，请结合其他已选目标一起理解其移动位置或重排关系。"
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
    if (!state.active) {
      return;
    }

    updateHoveredNumberInput(event.target, event.altKey);

    if (isPromptOpen()) {
      return;
    }

    if (state.fillPopoverDragSession) {
      event.preventDefault();
      updateFillPopoverDrag(event, false);
      return;
    }

    if (state.numberDragSession) {
      event.preventDefault();
      updateNumberInputDrag(event);
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
      const clickedInsideFillPopover = Boolean(event.target?.closest?.(".chat-context-picker-fill-popover"));
      const clickedInsideShadowPopover = Boolean(event.target?.closest?.(".chat-context-picker-shadow-popover"));
      if (clickedInsideAdjust || clickedInsideSizeMenu || clickedInsideFillPopover || clickedInsideShadowPopover) {
        return;
      }
      closeAdjustPopover();
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
      event.preventDefault();
      finishFillPopoverDrag(event);
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
    if (state.highlightsVisible) {
      refreshHighlights();
    }
    if (isAdjustOpen() && state.adjustTarget) {
      positionAdjustPopover(state.adjustTarget);
    }
    if (state.fillPopover?.dataset.open === "true" && state.adjustTarget) {
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

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "c" && state.selectedTargets.length) {
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
})();
