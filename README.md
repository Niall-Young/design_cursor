# Design cursor

Design cursor is a Chrome/Edge extension for selecting elements on a web page and copying them as structured context for AI-assisted UI editing.

## License

This project is distributed under the `PolyForm Noncommercial 1.0.0` license. You can use, study, and modify it for noncommercial purposes, but not use it directly for commercial purposes.

## What It Does

- Select one or more elements or text fragments directly on a page
- Keep a running selection list in the extension panel
- Copy structured context for use in tools like Codex, Cursor, ChatGPT, or other AI editors
- Include useful metadata such as:
  - page title and URL
  - selector information
  - text content
  - size and position
  - key computed styles
  - related HTML snippet

## Install

1. Open `chrome://extensions/` in Chrome or Edge
2. Enable Developer Mode
3. Click `Load unpacked`
4. Select this repository folder

## Usage

1. Open the page you want to edit
2. Click the extension icon, or use the shortcut:

```text
Mac: Command+Shift+Y
Windows: Ctrl+Shift+Y
```

3. Hover over the page to preview selectable targets
4. Click to add elements or text to the selection
5. Copy the collected context from the panel
6. Paste it into your AI editor and describe the change you want

## Current Scope

This project is currently a DOM-level MVP. It does not yet include:

- source code mapping
- React/Vue component identification
- screenshot capture
- framework-aware component metadata
- IDE or local dev server integration

## Future Ideas

- Copy prompt-ready context templates
- Capture screenshots alongside DOM data
- Detect React/Vue component names and props
- Support lasso or area selection
- Map selected targets back to local source files
