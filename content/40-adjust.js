// Adjustment mode utilities and the fill/shadow/style editor logic live here.
const ADJUSTABLE_STYLE_PROPS = [
  "color",
  "fontSize",
  "fontWeight",
  "lineHeight",
  "textAlign",
  "display",
  "flexDirection",
  "justifyContent",
  "alignItems",
  "alignSelf",
  "flexGrow",
  "flexBasis",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
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
  "boxShadow",
  "filter",
  "fill",
  "stroke"
];

const ADJUSTABLE_CHILD_MARGIN_PROPS = [
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft"
];

const ADJUSTABLE_SVG_STYLE_PROPS = [
  "color",
  "fill",
  "fillOpacity",
  "stroke",
  "strokeOpacity",
  "strokeWidth",
  "strokeLinecap",
  "strokeLinejoin",
  "filter",
  "opacity"
];

const SVG_PAINT_SELECTOR = "path, circle, ellipse, rect, line, polyline, polygon, text, use";
const ADJUST_LAYOUT_PROPS = new Set([
  "layoutDirection",
  "width",
  "height",
  "gap",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft"
]);

const DEFAULT_FILL_HEX = "#000000";
const DEFAULT_FILL_ALPHA = 0.2;
const DEFAULT_FILL_CSS = `rgba(0, 0, 0, ${DEFAULT_FILL_ALPHA})`;
const DEFAULT_BASE_FILL_HEX = "#FFFFFF";
const DEFAULT_BASE_FILL_ALPHA = 1;
const DEFAULT_BASE_FILL_CSS = buildAdjustColorCss(DEFAULT_BASE_FILL_HEX, DEFAULT_BASE_FILL_ALPHA);
const DEFAULT_FILL_OVERLAY_LAYER = `linear-gradient(${DEFAULT_FILL_CSS}, ${DEFAULT_FILL_CSS})`;
const DEFAULT_SHADOW_ALPHA = 0.2;
const ADJUST_MAX_BORDER_RADIUS = 999;

function getAdjustTargetElement(target) {
  const element = getTargetElement(target);
  if (!(element instanceof Element)) {
    return element;
  }

  const lock = state.hoverLock;
  const mirrorClone = lock?.mirror?.clone;
  if (!(mirrorClone instanceof Element) || lock.targetElement !== element) {
    return element;
  }

  const rect = element.getBoundingClientRect();
  const styles = window.getComputedStyle(element);
  if (rect.width > 0 && rect.height > 0 && styles.display !== "none" && styles.visibility !== "hidden") {
    return element;
  }

  return mirrorClone;
}
const DEFAULT_SHADOW_X = 0;
const DEFAULT_SHADOW_Y = 4;
const DEFAULT_SHADOW_BLUR = 4;

const SHADOW_PRESETS = {
  none: "",
  outer: `${DEFAULT_SHADOW_X}px ${DEFAULT_SHADOW_Y}px ${DEFAULT_SHADOW_BLUR}px rgba(0, 0, 0, ${DEFAULT_SHADOW_ALPHA})`,
  inner: `inset ${DEFAULT_SHADOW_X}px ${DEFAULT_SHADOW_Y}px ${DEFAULT_SHADOW_BLUR}px rgba(0, 0, 0, ${DEFAULT_SHADOW_ALPHA})`
};

function createAdjustLayerId(prefix = "layer") {
  state.adjustLayerIdCounter = Number.isFinite(state.adjustLayerIdCounter) ? state.adjustLayerIdCounter + 1 : 1;
  return `${prefix}-${state.adjustLayerIdCounter}`;
}

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

function normalizeAdjustBorderRadius(value, fallback = 0) {
  return Math.round(clampNumber(value, 0, ADJUST_MAX_BORDER_RADIUS, fallback));
}

function isTextAdjustTarget(target) {
  return target?.kind === "text" && target.node?.nodeType === Node.TEXT_NODE;
}

function getAdjustTextNode(target) {
  return isTextAdjustTarget(target) ? target.node : null;
}

function getAdjustTextContent(target) {
  const textNode = getAdjustTextNode(target);
  return textNode ? textNode.textContent || "" : "";
}

function normalizeFontWeightValue(value, fallback = 400) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "bold") {
    return 700;
  }
  if (normalized === "normal") {
    return 400;
  }

  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.round(clampNumber(parsed, 1, 1000, fallback));
}

function normalizeTextAlignValue(value, fallback = "left") {
  const normalized = String(value || "").trim().toLowerCase();
  if (["left", "center", "right"].includes(normalized)) {
    return normalized;
  }
  if (normalized === "start" || normalized === "-webkit-left") {
    return "left";
  }
  if (normalized === "end" || normalized === "-webkit-right") {
    return "right";
  }
  if (normalized === "-webkit-center") {
    return "center";
  }
  return fallback;
}

function parseLineHeightValue(value, fontSize = 0, fallback = 0) {
  const normalized = String(value || "").trim().toLowerCase();
  const fontSizeValue = Number.parseFloat(fontSize);
  const fallbackValue = Number.isFinite(fontSizeValue) && fontSizeValue > 0 ? Math.round(fontSizeValue * 1.2) : fallback;
  if (!normalized || normalized === "normal") {
    return fallbackValue;
  }
  if (normalized.endsWith("px")) {
    return parsePixelValue(normalized, fallbackValue);
  }

  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) {
    return fallbackValue;
  }
  if (parsed > 0 && parsed < 10 && Number.isFinite(fontSizeValue) && fontSizeValue > 0) {
    return Math.round(parsed * fontSizeValue);
  }
  return Math.round(parsed);
}

function formatAdjustTextPreview(value) {
  return truncate(String(value || "").replace(/\s+/g, " ").trim(), 80) || "空";
}

function getAdjustSizeConstraintText(values) {
  const constraints = [];
  if (values.minWidth !== "") {
    constraints.push(`最小宽度 ${values.minWidth}px`);
  }
  if (values.maxWidth !== "") {
    constraints.push(`最大宽度 ${values.maxWidth}px`);
  }
  if (values.minHeight !== "") {
    constraints.push(`最小高度 ${values.minHeight}px`);
  }
  if (values.maxHeight !== "") {
    constraints.push(`最大高度 ${values.maxHeight}px`);
  }
  return constraints.length ? `，限制 ${constraints.join("、")}` : "";
}

function getAdjustSizeLimitProp(prop, mode) {
  const normalizedProp = prop === "height" ? "height" : "width";
  const normalizedMode = mode === "min" ? "min" : "max";
  if (normalizedProp === "height") {
    return normalizedMode === "min" ? "minHeight" : "maxHeight";
  }
  return normalizedMode === "min" ? "minWidth" : "maxWidth";
}

function normalizeAdjustSizeInputMode(mode, fallback = "fixed") {
  return ["hug", "fixed", "fill"].includes(mode) ? mode : fallback;
}

function isAdjustSizeLimitMode(mode) {
  return mode === "min" || mode === "max";
}

function getStoredAdjustSizeInputMode(target, prop, fallback = "fixed") {
  const persistedTarget = findSelectedTarget(target) || target;
  const normalizedProp = prop === "height" ? "height" : "width";
  const mode = persistedTarget?.adjustSizeInputModes?.[normalizedProp];
  return normalizeAdjustSizeInputMode(mode, fallback);
}

function setStoredAdjustSizeInputMode(target, prop, mode) {
  const persistedTarget = findSelectedTarget(target) || target;
  if (!persistedTarget) {
    return;
  }

  const normalizedProp = prop === "height" ? "height" : "width";
  const normalizedMode = normalizeAdjustSizeInputMode(mode, "");
  if (!normalizedMode) {
    return;
  }
  persistedTarget.adjustSizeInputModes = {
    ...(persistedTarget.adjustSizeInputModes || {}),
    [normalizedProp]: normalizedMode
  };
}

function parseAdjustSizeLimitKey(key) {
  const normalized = String(key || "").trim();
  if (normalized === "minWidth") {
    return { prop: "width", mode: "min", styleProp: "minWidth" };
  }
  if (normalized === "maxWidth") {
    return { prop: "width", mode: "max", styleProp: "maxWidth" };
  }
  if (normalized === "minHeight") {
    return { prop: "height", mode: "min", styleProp: "minHeight" };
  }
  if (normalized === "maxHeight") {
    return { prop: "height", mode: "max", styleProp: "maxHeight" };
  }
  return null;
}

function getInlineSizeLimitValue(element, prop, mode) {
  const styleProp = getAdjustSizeLimitProp(prop, mode);
  const value = element?.style?.[styleProp] || "";
  if (!value) {
    return "";
  }
  return String(parsePixelValue(value, 0));
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

  const rawValue = String(value).trim();
  const normalizedValue = rawValue.replace(/\s+/g, "").toLowerCase();
  if (normalizedValue === "transparent" || normalizedValue === "none") {
    return null;
  }

  const normalizedHex = normalizeHexColor(rawValue);
  if (normalizedHex) {
    return {
      css: normalizedHex,
      hex: normalizedHex,
      alpha: 1,
      label: `${normalizedHex.replace(/^#/, "").toUpperCase()} ${formatAlphaPercent(1)}`
    };
  }

  const match = rawValue.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([.\d]+))?\)/i);
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

function isDefaultTransparentPaint(value) {
  const normalizedValue = String(value || "").trim().replace(/\s+/g, "").toLowerCase();
  return (
    normalizedValue === "transparent" ||
    normalizedValue === "rgba(0,0,0,0)" ||
    normalizedValue === "rgb(0,0,0,0)"
  );
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

function getFillSvThumbPosition(color, format = "hex") {
  if (format === "hsl") {
    const hsla = hsvaToHsla(color);
    return {
      left: `${clampNumber(hsla.s, 0, 100, 0)}%`,
      top: `${100 - clampNumber(hsla.l, 0, 100, 0)}%`
    };
  }

  return {
    left: `${clampNumber(color?.s, 0, 100, 0)}%`,
    top: `${100 - clampNumber(color?.v, 0, 100, 0)}%`
  };
}

function getFillSvDragColor(baseColor, xRatio, yRatio, format = "hex") {
  const normalizedX = clampNumber(xRatio, 0, 1, 0);
  const normalizedY = clampNumber(yRatio, 0, 1, 0);

  if (format === "hsl") {
    const hsla = hsvaToHsla(baseColor);
    return hslaToHsva(
      hsla.h,
      normalizedX * 100,
      100 - normalizedY * 100,
      clampAlpha(baseColor?.a, 1)
    );
  }

  return {
    s: normalizedX * 100,
    v: 100 - normalizedY * 100
  };
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
  if (
    !(input instanceof HTMLInputElement) ||
    input.dataset.chatContextPickerNumeric !== "true" ||
    input.disabled ||
    input.readOnly
  ) {
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
  if (
    target instanceof Element &&
    target.closest(".chat-context-picker-number-drag-ready-overlay") &&
    getNumberInputDragConfig(state.numberDragReadyInput)
  ) {
    return state.numberDragReadyInput;
  }
  const input = target instanceof Element ? target.closest('input[data-chat-context-picker-numeric="true"]') : null;
  return getNumberInputDragConfig(input) ? input : null;
}

function removeNumberInputReadyOverlay() {
  state.numberDragReadyOverlay?.remove();
  state.numberDragReadyOverlay = null;
}

function syncNumberInputReadyOverlay(input) {
  if (!input || !document.body) {
    removeNumberInputReadyOverlay();
    return;
  }

  const rect = input.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    removeNumberInputReadyOverlay();
    return;
  }

  if (!state.numberDragReadyOverlay) {
    const overlay = document.createElement("div");
    overlay.className = "chat-context-picker-number-drag-ready-overlay";
    overlay.setAttribute("aria-hidden", "true");
    document.body.appendChild(overlay);
    state.numberDragReadyOverlay = overlay;
  }

  Object.assign(state.numberDragReadyOverlay.style, {
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`
  });
}

function syncNumberInputReadyCursor() {
  if (
    !(state.hoveredNumberInput instanceof HTMLInputElement) ||
    !state.hoveredNumberInput.isConnected ||
    !getNumberInputDragConfig(state.hoveredNumberInput)
  ) {
    state.hoveredNumberInput = null;
  }

  const nextReadyInput =
    !state.numberDragSession && state.altKeyPressed && state.hoveredNumberInput instanceof HTMLInputElement
      ? state.hoveredNumberInput
      : null;
  if (state.numberDragReadyInput && state.numberDragReadyInput !== nextReadyInput) {
    delete state.numberDragReadyInput.dataset.chatContextPickerNumberDragReady;
    state.numberDragReadyInput.style.cursor = state.numberDragReadyPreviousInputCursor || "";
    removeNumberInputReadyOverlay();
    state.numberDragReadyInput = null;
    state.numberDragReadyPreviousInputCursor = null;
  }
  if (nextReadyInput && state.numberDragReadyInput !== nextReadyInput) {
    state.numberDragReadyInput = nextReadyInput;
    state.numberDragReadyPreviousInputCursor = nextReadyInput.style.cursor;
    nextReadyInput.dataset.chatContextPickerNumberDragReady = "true";
    nextReadyInput.style.cursor = "ew-resize";
  }
  if (nextReadyInput) {
    syncNumberInputReadyOverlay(nextReadyInput);
  } else {
    removeNumberInputReadyOverlay();
  }
  if (nextReadyInput && state.numberDragReadyPreviousCursor === null) {
    state.numberDragReadyPreviousCursor = document.documentElement.style.cursor;
    document.documentElement.style.cursor = "ew-resize";
  } else if (!nextReadyInput && state.numberDragReadyPreviousCursor !== null) {
    document.documentElement.style.cursor = state.numberDragReadyPreviousCursor || "";
    state.numberDragReadyPreviousCursor = null;
  }
  document.documentElement.classList.toggle("chat-context-picker-number-drag-ready", Boolean(nextReadyInput));
}

function updateHoveredNumberInput(target, altKey = state.altKeyPressed) {
  state.hoveredNumberInput = resolveNumberInputTarget(target);
  state.altKeyPressed = Boolean(altKey);
  syncNumberInputReadyCursor();
}

function updateHoveredNumberInputFromPointerState(altKey = state.altKeyPressed) {
  let target = null;
  if (Number.isFinite(state.lastPointerClientX) && Number.isFinite(state.lastPointerClientY)) {
    target = document.elementFromPoint(state.lastPointerClientX, state.lastPointerClientY);
  }
  if (!target && document.activeElement instanceof Element) {
    target = document.activeElement;
  }
  updateHoveredNumberInput(target, altKey);
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
  if (state.numberDragReadyInput) {
    delete state.numberDragReadyInput.dataset.chatContextPickerNumberDragReady;
    state.numberDragReadyInput.style.cursor = state.numberDragReadyPreviousInputCursor || "";
    removeNumberInputReadyOverlay();
    state.numberDragReadyInput = null;
    state.numberDragReadyPreviousInputCursor = null;
  }
  const previousReadyCursor = state.numberDragReadyPreviousCursor;
  state.numberDragReadyPreviousCursor = null;
  document.documentElement.classList.remove("chat-context-picker-number-drag-ready");

  state.numberDragSession = {
    ...config,
    startX: event.clientX,
    lastValue: config.initialValue,
    changed: false,
    previousCursor: previousReadyCursor !== null ? previousReadyCursor : document.documentElement.style.cursor,
    previousUserSelect: document.documentElement.style.userSelect
  };
  state.suppressClickUntil = Date.now() + 400;
  beginAdjustTargetHighlightInteraction();
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
  state.hoveredNumberInput = null;
  state.altKeyPressed = false;
  document.documentElement.classList.remove("chat-context-picker-number-dragging");
  document.documentElement.style.cursor = session.previousCursor || "";
  document.documentElement.style.userSelect = session.previousUserSelect || "";
  syncNumberInputReadyCursor();
  syncAdjustTargetHighlightSuppression();
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

function splitShadowLayerStrings(boxShadow) {
  if (!boxShadow || boxShadow === "none") {
    return [];
  }

  return String(boxShadow)
    .split(/,(?![^(]*\))/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function applyComputedShadowStateToTarget(target, stylesBoxShadow) {
  const persistedTarget = findSelectedTarget(target) || target;
  if (!persistedTarget) {
    return null;
  }

  const shadowLayerStrings = splitShadowLayerStrings(stylesBoxShadow).filter((layer) => isVisibleShadowLayer(layer));
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

function clearPendingAdjustShadowHydration() {
  if (state.adjustShadowHydrationTimer) {
    window.clearTimeout(state.adjustShadowHydrationTimer);
    state.adjustShadowHydrationTimer = null;
  }
}

function scheduleAdjustShadowHydration(target) {
  clearPendingAdjustShadowHydration();

  const persistedTarget = findSelectedTarget(target) || target;
  if (!persistedTarget) {
    return;
  }

  persistedTarget.adjustShadowStateDirty = false;
  state.adjustShadowHydrationTimer = window.setTimeout(() => {
    state.adjustShadowHydrationTimer = null;

    if (!state.adjustTarget || !isSameTarget(state.adjustTarget, persistedTarget) || persistedTarget.adjustShadowStateDirty) {
      return;
    }

    const element = getAdjustTargetElement(persistedTarget);
    if (!(element instanceof Element)) {
      return;
    }

    applyComputedShadowStateToTarget(persistedTarget, window.getComputedStyle(element).boxShadow);
    setAdjustPromptBaselines(persistedTarget);
    syncAdjustPopoverFromTarget(persistedTarget);
    renderSelectionAndHighlights();
  }, 80);
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
    id: layer?.id || createAdjustLayerId("shadow"),
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
  const lengthValues = normalized
    .replace(/rgba?\([^)]*\)/gi, " ")
    .replace(/\binset\b/gi, " ")
    .match(/-?\d*\.?\d+(?:px)?/g)
    ?.map((value) => Number.parseFloat(value))
    .filter((value) => Number.isFinite(value)) || [];

  return {
    type: shadowType,
    x: Number.isFinite(lengthValues[0]) ? lengthValues[0] : DEFAULT_SHADOW_X,
    y: Number.isFinite(lengthValues[1]) ? lengthValues[1] : DEFAULT_SHADOW_Y,
    blur: Number.isFinite(lengthValues[2]) ? lengthValues[2] : DEFAULT_SHADOW_BLUR,
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

function renderSelectionAndHighlights() {
  syncHoverLockMirrorFromTarget();
  renderSelection();
  refreshHighlights();
}

function getVisibilityIconMarkup(isVisible = true) {
  return icon(isVisible ? "eye" : "eyeOff");
}

function getTextColorRowMarkup(isActive = false) {
  return `
    <div class="chat-context-picker-adjust-style-row chat-context-picker-adjust-fill-row" data-adjust-row="fill" data-state="${isActive ? "active" : "default"}" data-visible="true">
      <span class="chat-context-picker-adjust-fill-prefix">
        <button class="chat-context-picker-adjust-swatch-button" type="button" data-action="open-fill-picker" aria-label="选择文字颜色" title="选择文字颜色">
          <span class="chat-context-picker-adjust-swatch" data-adjust-swatch="backgroundColor"></span>
          <input class="chat-context-picker-adjust-native-color" type="color" data-adjust-input="backgroundColor" />
        </button>
      </span>
      <span class="chat-context-picker-adjust-input-divider" aria-hidden="true"></span>
      <input class="chat-context-picker-adjust-style-input" type="text" data-adjust-text="backgroundColor" spellcheck="false" aria-label="文字颜色" title="文字颜色" />
      <span class="chat-context-picker-adjust-input-divider" aria-hidden="true"></span>
      <label class="chat-context-picker-adjust-style-alpha-field">
        <input class="chat-context-picker-adjust-style-alpha-input" type="text" inputmode="decimal" min="0" max="100" step="1" data-chat-context-picker-numeric="true" data-adjust-alpha="backgroundColor" aria-label="文字颜色透明度" title="文字颜色透明度" />
        <span class="chat-context-picker-adjust-style-alpha-label">%</span>
      </label>
    </div>
  `;
}

function getFillBaseRowMarkup(isActive = false, isVisible = true) {
  return `
    <div class="chat-context-picker-adjust-style-row chat-context-picker-adjust-fill-row" data-adjust-row="fill" data-adjust-selection-kind="fill" data-adjust-selection-key="fill:base" data-state="${isActive ? "active" : "default"}">
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
    <div class="chat-context-picker-adjust-style-row chat-context-picker-adjust-fill-row" data-adjust-row="fill-overlay" data-adjust-selection-kind="fill" data-adjust-selection-key="fill:overlay:${index}" data-overlay-index="${index}" data-state="${isActive ? "active" : "default"}" data-visible="${visible ? "true" : "false"}">
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
        <input class="chat-context-picker-adjust-style-alpha-input" type="text" inputmode="decimal" min="0" max="100" step="1" data-chat-context-picker-numeric="true" data-adjust-overlay-alpha="backgroundColor" data-overlay-index="${index}" value="${escapeHtml(formatAdjustColorAlphaValue(colorCss))}" />
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
    <div class="chat-context-picker-adjust-style-row" data-action="set-shadow-type" data-shadow-type="${shadowType}" data-adjust-row="shadow-${shadowType}" data-adjust-selection-kind="shadow" data-adjust-selection-key="shadow:base:${shadowType}" data-state="${isActive ? "active" : "default"}" role="button" tabindex="0">
      <button class="chat-context-picker-adjust-shadow-preview-button" type="button" data-action="set-shadow-type" data-shadow-type="${shadowType}" aria-label="打开${label}属性" title="打开${label}属性">
        <span class="chat-context-picker-adjust-shadow-preview chat-context-picker-adjust-shadow-preview-${shadowType}"></span>
      </button>
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
    <div class="chat-context-picker-adjust-style-row" data-action="open-shadow-overlay" data-shadow-type="${shadowType}" data-adjust-row="shadow-overlay" data-adjust-selection-kind="shadow" data-adjust-selection-key="shadow:overlay:${index}" data-overlay-index="${index}" data-state="${isActive ? "active" : "default"}" data-visible="${visible ? "true" : "false"}" role="button" tabindex="0">
      <button class="chat-context-picker-adjust-shadow-preview-button" type="button" data-action="open-shadow-overlay" data-shadow-type="${shadowType}" data-overlay-index="${index}" aria-label="打开${label}属性" title="打开${label}属性">
        <span class="chat-context-picker-adjust-shadow-preview chat-context-picker-adjust-shadow-preview-${shadowType}"></span>
      </button>
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
    title: state.adjustPopover.querySelector(".chat-context-picker-adjust-title"),
    associationRow: state.adjustPopover.querySelector(".chat-context-picker-association-row"),
    associationModeToggle: state.adjustPopover.querySelector('[data-action="toggle-association-mode"]'),
    textSection: state.adjustPopover.querySelector('[data-adjust-section="text"]'),
    textDivider: state.adjustPopover.querySelector('[data-adjust-divider="text"]'),
    layoutSection: state.adjustPopover.querySelector('[data-adjust-section="layout"]'),
    layoutDivider: state.adjustPopover.querySelector('[data-adjust-divider="layout"]'),
    layoutDirectionGroup: state.adjustPopover.querySelector('[data-adjust-layout-advanced="direction"]'),
    layoutAdvancedRow: state.adjustPopover.querySelector('[data-adjust-layout-advanced="alignment"]'),
    paddingSection: state.adjustPopover.querySelector('[data-adjust-section="padding"]'),
    paddingDivider: state.adjustPopover.querySelector('[data-adjust-divider="padding"]'),
    paddingTitle: state.adjustPopover.querySelector('[data-adjust-padding-title]'),
    opacityRow: state.adjustPopover.querySelector('[data-adjust-appearance-row="opacity"]'),
    borderRadiusRow: state.adjustPopover.querySelector('[data-adjust-appearance-row="border-radius"]'),
    resourceActions: state.adjustPopover.querySelector('[data-adjust-resource-actions]'),
    resourceDownloadButton: state.adjustPopover.querySelector('[data-action="download-resource"]'),
    fillStack: state.adjustPopover.querySelector('[data-adjust-stack="fill"]'),
    shadowStack: state.adjustPopover.querySelector('[data-adjust-stack="shadow"]'),
    backgroundColorInput: state.adjustPopover.querySelector('[data-adjust-input="backgroundColor"]'),
    backgroundColorText: state.adjustPopover.querySelector('[data-adjust-text="backgroundColor"]'),
    backgroundColorAlpha: state.adjustPopover.querySelector('[data-adjust-alpha="backgroundColor"]'),
    backgroundColorRow: state.adjustPopover.querySelector('[data-adjust-row="fill"]'),
    backgroundColorSwatch: state.adjustPopover.querySelector('[data-adjust-swatch="backgroundColor"]'),
    textContent: state.adjustPopover.querySelector('[data-adjust-textarea="textContent"]'),
    textColorInput: state.adjustPopover.querySelector('[data-adjust-input="textColor"]'),
    textColorText: state.adjustPopover.querySelector('[data-adjust-text="textColor"]'),
    textColorSwatch: state.adjustPopover.querySelector('[data-adjust-swatch="textColor"]'),
    fontSize: state.adjustPopover.querySelector('[data-adjust-input="fontSize"]'),
    fontWeight: state.adjustPopover.querySelector('[data-adjust-input="fontWeight"]'),
    lineHeight: state.adjustPopover.querySelector('[data-adjust-input="lineHeight"]'),
    widthRow: state.adjustPopover.querySelector('[data-adjust-size-row="width"]'),
    heightRow: state.adjustPopover.querySelector('[data-adjust-size-row="height"]'),
    outerShadowRow: state.adjustPopover.querySelector('[data-adjust-row="shadow-outer"]'),
    innerShadowRow: state.adjustPopover.querySelector('[data-adjust-row="shadow-inner"]')
  };
  state.associationModeToggle = state.adjustControls.associationModeToggle;
  syncAssociationModeControl();
}

function getAdjustLayerSelectableRows(kind = null) {
  if (!state.adjustPopover) {
    return [];
  }

  const selector = kind
    ? `[data-adjust-selection-key][data-adjust-selection-kind="${kind}"]`
    : "[data-adjust-selection-key]";
  return [...state.adjustPopover.querySelectorAll(selector)];
}

function syncAdjustLayerRowSelection() {
  if (!state.adjustPopover) {
    return;
  }

  const selectedKeys = new Set(state.adjustLayerSelectionKeys || []);
  getAdjustLayerSelectableRows().forEach((row) => {
    row.dataset.selected = selectedKeys.has(row.dataset.adjustSelectionKey) ? "true" : "false";
  });
}

function clearAdjustLayerSelection() {
  state.adjustLayerSelectionKind = null;
  state.adjustLayerSelectionKeys = [];
  state.adjustLayerSelectionAnchorKey = null;
  syncAdjustLayerRowSelection();
}

function pruneAdjustLayerSelection() {
  const kind = state.adjustLayerSelectionKind;
  if (!kind) {
    syncAdjustLayerRowSelection();
    return;
  }

  const availableKeys = new Set(
    getAdjustLayerSelectableRows(kind).map((row) => row.dataset.adjustSelectionKey).filter(Boolean)
  );
  state.adjustLayerSelectionKeys = (state.adjustLayerSelectionKeys || []).filter((key) => availableKeys.has(key));
  if (!state.adjustLayerSelectionKeys.length) {
    clearAdjustLayerSelection();
    return;
  }

  if (!availableKeys.has(state.adjustLayerSelectionAnchorKey)) {
    state.adjustLayerSelectionAnchorKey = state.adjustLayerSelectionKeys[state.adjustLayerSelectionKeys.length - 1] || null;
  }
  syncAdjustLayerRowSelection();
}

function setAdjustLayerSelection(kind, keys, anchorKey = null) {
  const normalizedKeys = [...new Set((keys || []).filter(Boolean))];
  if (!kind || !normalizedKeys.length) {
    clearAdjustLayerSelection();
    return;
  }

  state.adjustLayerSelectionKind = kind;
  state.adjustLayerSelectionKeys = normalizedKeys;
  state.adjustLayerSelectionAnchorKey = anchorKey || normalizedKeys[normalizedKeys.length - 1] || null;
  pruneAdjustLayerSelection();
}

function getOrderedAdjustLayerSelectionKeys(kind = state.adjustLayerSelectionKind) {
  if (!kind || !state.adjustLayerSelectionKeys.length) {
    return [];
  }

  const selected = new Set(state.adjustLayerSelectionKeys);
  return getAdjustLayerSelectableRows(kind)
    .map((row) => row.dataset.adjustSelectionKey)
    .filter((key) => key && selected.has(key));
}

function shouldSelectAdjustLayerRowFromClick(event, row) {
  if (!row) {
    return false;
  }

  const target = event.target;
  if (!(target instanceof Element)) {
    return false;
  }

  if (
    target.closest(
      'button, input, textarea, select, label, [contenteditable="true"], [data-adjust-text], [data-adjust-alpha], [data-adjust-overlay-text], [data-adjust-overlay-alpha]'
    )
  ) {
    return false;
  }

  const rect = row.getBoundingClientRect();
  const localX = event.clientX - rect.left;
  const gutterWidth = Math.min(24, Math.max(16, rect.width * 0.075));
  return localX <= gutterWidth || localX >= rect.width - gutterWidth;
}

function selectAdjustLayerRow(row, { shiftKey = false } = {}) {
  if (!(row instanceof Element)) {
    return;
  }

  const kind = row.dataset.adjustSelectionKind || null;
  const key = row.dataset.adjustSelectionKey || null;
  if (!kind || !key) {
    return;
  }

  const activeElement = document.activeElement;
  if (
    activeElement instanceof HTMLElement &&
    state.adjustPopover?.contains(activeElement) &&
    (activeElement.matches("input, textarea, select") || activeElement.isContentEditable)
  ) {
    activeElement.blur();
  }

  const rows = getAdjustLayerSelectableRows(kind);
  if (!rows.length) {
    return;
  }

  if (shiftKey && state.adjustLayerSelectionKind === kind) {
    const nextKeys = new Set(state.adjustLayerSelectionKeys || []);
    nextKeys.add(key);
    setAdjustLayerSelection(kind, [...nextKeys], key);
    return;
  }

  setAdjustLayerSelection(kind, [key], key);
}

function normalizeFillOverlayLayerEntry(layer) {
  return {
    id: layer?.id || createAdjustLayerId("fill"),
    visible: layer?.visible !== false,
    colorHex: layer?.colorHex || DEFAULT_FILL_HEX,
    colorCss: layer?.colorCss || DEFAULT_FILL_CSS
  };
}

function cloneFillOverlayLayer(layer, { preserveId = true } = {}) {
  return normalizeFillOverlayLayerEntry({
    ...layer,
    id: preserveId ? layer?.id : null
  });
}

function createFillLayerFromClipboardEntry(entry) {
  if (!entry) {
    return cloneFillOverlayLayer(null);
  }

  if (entry.role === "overlay" && entry.layer) {
    return cloneFillOverlayLayer(entry.layer, { preserveId: false });
  }

  return {
    id: entry.id || createAdjustLayerId("fill"),
    visible: entry.visible !== false,
    colorHex: entry.colorHex || DEFAULT_BASE_FILL_HEX,
    colorCss: entry.colorCss || DEFAULT_BASE_FILL_CSS
  };
}

function cloneShadowConfig(config, shadowType = "outer") {
  const normalized = config || getDefaultShadowConfig(shadowType);
  return {
    type: shadowType,
    x: Number.isFinite(Number(normalized.x)) ? Number(normalized.x) : 0,
    y: Number.isFinite(Number(normalized.y)) ? Number(normalized.y) : 4,
    blur: Number.isFinite(Number(normalized.blur)) ? Number(normalized.blur) : 16,
    spread: Number.isFinite(Number(normalized.spread)) ? Number(normalized.spread) : 0,
    color: normalized.color || DEFAULT_FILL_CSS
  };
}

function cloneShadowLayer(layer, { preserveId = true } = {}) {
  const shadowType = layer?.type === "inner" || layer?.config?.type === "inner" ? "inner" : "outer";
  return normalizeShadowLayerEntry(
    {
      id: preserveId ? layer?.id : null,
      type: shadowType,
      visible: layer?.visible !== false,
      config: cloneShadowConfig(layer?.config, shadowType)
    },
    shadowType
  );
}

function buildAdjustLayerClipboardData() {
  if (!state.adjustTarget || !state.adjustLayerSelectionKind || !state.adjustLayerSelectionKeys.length) {
    return null;
  }

  const persistedTarget = ensureAdjustLayerState(state.adjustTarget);
  if (!persistedTarget) {
    return null;
  }

  if (state.adjustLayerSelectionKind === "fill") {
    const entries = [];
    getOrderedAdjustLayerSelectionKeys("fill").forEach((key) => {
      if (key === "fill:base" && persistedTarget.adjustFillEnabled) {
        entries.push({
          role: "base",
          visible: persistedTarget.adjustFillVisible !== false,
          fillType: persistedTarget.adjustFillType || "color",
          colorCss: persistedTarget.adjustStoredBackgroundColor || DEFAULT_BASE_FILL_CSS,
          colorHex: persistedTarget.adjustStoredBackgroundHex || DEFAULT_BASE_FILL_HEX,
          backgroundImage: persistedTarget.adjustStoredBackgroundImage || ""
        });
        return;
      }

      if (key.startsWith("fill:overlay:")) {
        const index = Number.parseInt(key.split(":").pop() || "-1", 10);
        const layer = persistedTarget.adjustFillOverlayLayers?.[index];
        if (layer) {
          entries.push({
            role: "overlay",
            layer: cloneFillOverlayLayer(layer)
          });
        }
      }
    });

    return entries.length ? { kind: "fill", entries } : null;
  }

  if (state.adjustLayerSelectionKind === "shadow") {
    const entries = [];
    getOrderedAdjustLayerSelectionKeys("shadow").forEach((key) => {
      if (key.startsWith("shadow:overlay:")) {
        const index = Number.parseInt(key.split(":").pop() || "-1", 10);
        const layer = persistedTarget.adjustAddedOuterShadowLayers?.[index];
        if (layer) {
          entries.push(cloneShadowLayer(layer));
        }
      }
    });

    return entries.length ? { kind: "shadow", entries } : null;
  }

  return null;
}

function copyAdjustLayerSelection() {
  const clipboardData = buildAdjustLayerClipboardData();
  if (!clipboardData) {
    showToast("请先选中颜色层或阴影层");
    return false;
  }

  state.adjustLayerClipboard = clipboardData;
  const label = clipboardData.kind === "fill" ? "颜色层" : "阴影层";
  showToast(`已复制${clipboardData.entries.length}个${label}`);
  return true;
}

function pasteAdjustLayerSelection() {
  if (!state.adjustTarget || !state.adjustLayerClipboard) {
    showToast("当前没有可粘贴的图层");
    return false;
  }

  const persistedTarget = ensureAdjustLayerState(state.adjustTarget);
  if (!persistedTarget) {
    return false;
  }

  if (state.adjustLayerClipboard.kind === "fill") {
    const clipboardEntries = state.adjustLayerClipboard.entries || [];
    if (!clipboardEntries.length) {
      return false;
    }

    const targetHasFill =
      persistedTarget.adjustFillEnabled ||
      Boolean((persistedTarget.adjustFillOverlayLayers || []).length);
    const pastedOverlayLayers = [];
    let shouldSelectBase = false;

    if (!targetHasFill) {
      const baseIndex = clipboardEntries.length - 1;
      const baseEntry = clipboardEntries[baseIndex];
      const baseLayer = createFillLayerFromClipboardEntry(baseEntry);

      persistedTarget.adjustFillEnabled = true;
      persistedTarget.adjustFillVisible = baseEntry?.visible !== false;
      persistedTarget.adjustFillType = baseEntry?.role === "base" ? (baseEntry.fillType || "color") : "color";
      persistedTarget.adjustStoredBackgroundColor = baseLayer.colorCss || DEFAULT_BASE_FILL_CSS;
      persistedTarget.adjustStoredBackgroundHex = baseLayer.colorHex || DEFAULT_BASE_FILL_HEX;
      persistedTarget.adjustStoredBackgroundImage =
        baseEntry?.role === "base" && baseEntry.fillType === "gradient" ? (baseEntry.backgroundImage || "") : "";
      shouldSelectBase = true;

      clipboardEntries.forEach((entry, index) => {
        if (index === baseIndex) {
          return;
        }
        pastedOverlayLayers.push(createFillLayerFromClipboardEntry(entry));
      });
    } else {
      clipboardEntries.forEach((entry) => {
        pastedOverlayLayers.push(createFillLayerFromClipboardEntry(entry));
      });
    }

    if (pastedOverlayLayers.length) {
      persistedTarget.adjustFillOverlayLayers = [
        ...pastedOverlayLayers,
        ...(persistedTarget.adjustFillOverlayLayers || [])
      ];
    }

    applyFillLayerState(persistedTarget);
    refreshAdjustPromptText(persistedTarget);
    syncAssociatedAdjustTargetsFromSource();
    syncAdjustPopoverFromTarget(persistedTarget);
    renderSelectionAndHighlights();
    commitAdjustChanges();
    setAdjustLayerSelection(
      "fill",
      [
        ...pastedOverlayLayers.map((_, index) => `fill:overlay:${index}`),
        ...(shouldSelectBase ? ["fill:base"] : [])
      ],
      pastedOverlayLayers.length ? `fill:overlay:${pastedOverlayLayers.length - 1}` : shouldSelectBase ? "fill:base" : null
    );
    showToast(`已粘贴${state.adjustLayerClipboard.entries.length}个颜色层`);
    return true;
  }

  if (state.adjustLayerClipboard.kind === "shadow") {
    const layers = state.adjustLayerClipboard.entries.map((entry) => cloneShadowLayer(entry, { preserveId: false }));
    if (!layers.length) {
      return false;
    }

    persistedTarget.adjustAddedOuterShadowLayers = [
      ...layers,
      ...(persistedTarget.adjustAddedOuterShadowLayers || [])
    ];
    persistedTarget.adjustShadowActiveLayer = layers[0]?.type || persistedTarget.adjustShadowActiveLayer || "outer";
    applyShadowLayerState(persistedTarget);
    refreshAdjustPromptText(persistedTarget);
    syncAssociatedAdjustTargetsFromSource();
    syncAdjustPopoverFromTarget(persistedTarget);
    renderSelectionAndHighlights();
    commitAdjustChanges();
    setAdjustLayerSelection(
      "shadow",
      layers.map((_, index) => `shadow:overlay:${index}`),
      layers.length ? `shadow:overlay:${layers.length - 1}` : null
    );
    showToast(`已粘贴${layers.length}个阴影层`);
    return true;
  }

  return false;
}

function renderAdjustLayerRows(target) {
  const persistedTarget = ensureAdjustLayerState(target);
  if (!persistedTarget || !state.adjustControls) {
    return;
  }

  const isResourceTarget = isSvgResourceTarget(persistedTarget);
  const isTextTarget = isTextAdjustTarget(persistedTarget);
  const isFillPopoverOpen = Boolean(state.fillPopover?.dataset.open === "true" && state.adjustTarget);
  if (isTextTarget) {
    if (state.adjustControls.fillStack) {
      state.adjustControls.fillStack.innerHTML = getTextColorRowMarkup(
        isFillPopoverOpen && state.fillPopoverSource === "text"
      );
      state.adjustControls.fillStack.dataset.empty = "false";
      state.adjustControls.fillStack.hidden = false;
    }
  } else if (state.adjustControls.fillStack) {
    const fillLayers = isResourceTarget ? [] : (persistedTarget.adjustFillOverlayLayers || []);
    const hasBaseFill = persistedTarget.adjustFillEnabled;
    const hasAnyFillLayer = hasBaseFill || fillLayers.length > 0;
    state.adjustControls.fillStack.innerHTML = [
      ...fillLayers.map((layer, index) =>
        getFillOverlayRowMarkup(layer, index, isFillPopoverOpen && state.fillPopoverOverlayIndex === index)
      ),
      ...(hasBaseFill
        ? [getFillBaseRowMarkup(
            isFillPopoverOpen && state.fillPopoverOverlayIndex === null,
            persistedTarget.adjustFillVisible !== false
          )]
        : [])
    ].join("");
    state.adjustControls.fillStack.dataset.empty = hasAnyFillLayer ? "false" : "true";
    state.adjustControls.fillStack.hidden = !hasAnyFillLayer;
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
  pruneAdjustLayerSelection();
}

function captureAdjustableStyleSnapshot(element, textNode = null) {
  const self = ADJUSTABLE_STYLE_PROPS.reduce((snapshot, prop) => {
    snapshot[prop] = element?.style?.[prop] || "";
    return snapshot;
  }, {});
  const children = element instanceof Element
    ? [...element.children].map((child) => ({
        element: child,
        styles: ADJUSTABLE_CHILD_MARGIN_PROPS.reduce((snapshot, prop) => {
          snapshot[prop] = child?.style?.[prop] || "";
          return snapshot;
        }, {})
      }))
    : [];
  const svgPaint = element instanceof Element && isSvgResourceElement(element)
    ? captureSvgStyleSnapshot(element)
    : [];
  const text = textNode?.nodeType === Node.TEXT_NODE
    ? {
        node: textNode,
        value: textNode.textContent || ""
      }
    : null;

  return { self, children, svgPaint, text };
}

function applyAdjustableStyleSnapshot(element, snapshot) {
  if (!(element instanceof Element) || !snapshot) {
    return;
  }

  const ownSnapshot = snapshot.self || snapshot;
  for (const prop of ADJUSTABLE_STYLE_PROPS) {
    element.style[prop] = ownSnapshot[prop] || "";
  }

  if (Array.isArray(snapshot.children)) {
    snapshot.children.forEach((entry, index) => {
      const child =
        entry?.element instanceof Element && entry.element.parentElement === element
          ? entry.element
          : element.children[index];
      if (!(child instanceof Element) || !entry.styles) {
        return;
      }
      ADJUSTABLE_CHILD_MARGIN_PROPS.forEach((prop) => {
        child.style[prop] = entry.styles[prop] || "";
      });
    });
  }

  applySvgStyleSnapshot(snapshot.svgPaint, element);
  if (snapshot.text?.node?.nodeType === Node.TEXT_NODE && snapshot.text.node.isConnected) {
    snapshot.text.node.textContent = snapshot.text.value || "";
  }
}

function areStyleSnapshotsEqual(a, b) {
  const aSelf = a?.self || a || {};
  const bSelf = b?.self || b || {};
  const ownStylesEqual = ADJUSTABLE_STYLE_PROPS.every((prop) => (aSelf[prop] || "") === (bSelf[prop] || ""));
  if (!ownStylesEqual) {
    return false;
  }

  if (!areSvgStyleSnapshotsEqual(a?.svgPaint, b?.svgPaint)) {
    return false;
  }

  const aText = a?.text || null;
  const bText = b?.text || null;
  if ((aText?.node || null) !== (bText?.node || null) || (aText?.value || "") !== (bText?.value || "")) {
    return false;
  }

  const aChildren = Array.isArray(a?.children) ? a.children : [];
  const bChildren = Array.isArray(b?.children) ? b.children : [];
  if (aChildren.length !== bChildren.length) {
    return false;
  }

  return aChildren.every((entry, index) => {
    const other = bChildren[index];
    if (!other || entry.element !== other.element) {
      return false;
    }
    return ADJUSTABLE_CHILD_MARGIN_PROPS.every((prop) => (entry.styles?.[prop] || "") === (other.styles?.[prop] || ""));
  });
}

function getCurrentAdjustStyleElements(primaryElement = null) {
  const sourceTarget = state.adjustTarget;
  const sourceElement =
    primaryElement instanceof Element
      ? primaryElement
      : sourceTarget
        ? getAdjustTargetElement(sourceTarget)
        : null;

  const elements = [];
  const addElement = (element) => {
    if (element instanceof Element && !elements.includes(element)) {
      elements.push(element);
    }
  };

  addElement(sourceElement);

  if (!state.associationMode || !isElementTarget(sourceTarget)) {
    return elements;
  }

  const realSourceElement = getTargetElement(sourceTarget);
  state.selectedTargets
    .filter(isElementTarget)
    .forEach((target) => {
      const element = getTargetElement(target);
      if (element === realSourceElement || !isAssociatedElementTargetForSource(sourceTarget, target)) {
        return;
      }
      addElement(element);
    });

  return elements;
}

function captureAdjustableStyleGroupSnapshot(elements, sourceTarget = null) {
  const textNode = getAdjustTextNode(sourceTarget);
  const textElement = textNode ? getTargetElement(sourceTarget) : null;

  return {
    items: mergeTargetsByIdentity(
      (elements || [])
        .filter((element) => element instanceof Element)
        .map((element) => createElementTarget(element))
    ).map((target) => {
      const element = getTargetElement(target);
      return {
        element,
        snapshot: captureAdjustableStyleSnapshot(element, element === textElement ? textNode : null)
      };
    })
  };
}

function normalizeAdjustableStyleGroupSnapshot(snapshot, fallbackElement = null) {
  if (snapshot?.items && Array.isArray(snapshot.items)) {
    return {
      items: snapshot.items.filter((item) => item?.element instanceof Element && item.snapshot)
    };
  }

  if (snapshot && fallbackElement instanceof Element) {
    return {
      items: [{
        element: fallbackElement,
        snapshot
      }]
    };
  }

  return { items: [] };
}

function areStyleGroupSnapshotsEqual(a, b) {
  const left = normalizeAdjustableStyleGroupSnapshot(a);
  const right = normalizeAdjustableStyleGroupSnapshot(b);
  if (left.items.length !== right.items.length) {
    return false;
  }

  return left.items.every((entry, index) => {
    const other = right.items[index];
    return (
      other?.element === entry.element &&
      areStyleSnapshotsEqual(entry.snapshot, other.snapshot)
    );
  });
}

function captureCurrentAdjustStyleBaseline(primaryElement = null) {
  return captureAdjustableStyleGroupSnapshot(getCurrentAdjustStyleElements(primaryElement), state.adjustTarget);
}

function syncAssociatedAdjustTargetsFromSource() {
  if (!state.associationMode || !isElementTarget(state.adjustTarget)) {
    return;
  }

  const sourceTarget = state.adjustTarget;
  const sourceElement = getAdjustTargetElement(sourceTarget);
  const realSourceElement = getTargetElement(sourceTarget);
  if (!(sourceElement instanceof Element) || !(realSourceElement instanceof Element)) {
    return;
  }

  const sourceSnapshot = captureAdjustableStyleSnapshot(sourceElement);
  const promptText = sourceTarget.adjustPromptText || "";
  state.selectedTargets
    .filter(isElementTarget)
    .forEach((target) => {
      const element = getTargetElement(target);
      if (element === realSourceElement || !isAssociatedElementTargetForSource(sourceTarget, target)) {
        return;
      }

      applyAdjustableStyleSnapshot(element, sourceSnapshot);
      target.adjustPromptText = promptText;
      target.adjustPreserveSelection = true;
      const rect = mergeRects(getTargetClientRects(target));
      if (rect) {
        target.adjustPreserveRect = rect;
        target.adjustPreservePageRect = {
          left: rect.left + window.scrollX,
          top: rect.top + window.scrollY,
          right: rect.right + window.scrollX,
          bottom: rect.bottom + window.scrollY,
          width: rect.width,
          height: rect.height
        };
      }
    });
}

function normalizeFlexChildMargins(element) {
  if (!(element instanceof Element)) {
    return;
  }

  [...element.children].forEach((child) => {
    if (!(child instanceof HTMLElement)) {
      return;
    }
    ADJUSTABLE_CHILD_MARGIN_PROPS.forEach((prop) => {
      child.style[prop] = "0px";
    });
  });
}

function isAdjustLayoutProp(prop) {
  return ADJUST_LAYOUT_PROPS.has(prop);
}

function formatAdjustColorValue(value) {
  const parsed = parseAdjustColor(value);
  return parsed ? parsed.label : "无填充";
}

function getResolvedBorderRadius(styles, rect) {
  const basis = Math.min(rect.width || 0, rect.height || 0);
  return normalizeAdjustBorderRadius(Math.max(
    parseLengthValue(styles.borderTopLeftRadius, basis, 0),
    parseLengthValue(styles.borderTopRightRadius, basis, 0),
    parseLengthValue(styles.borderBottomRightRadius, basis, 0),
    parseLengthValue(styles.borderBottomLeftRadius, basis, 0)
  ));
}

function getSvgPaintColor(value, styles) {
  const normalized = String(value || "").trim();
  const lower = normalized.toLowerCase();
  if (!normalized || lower === "none" || lower === "transparent" || lower.startsWith("url(")) {
    return null;
  }

  if (lower === "currentcolor") {
    return parseAdjustColor(styles.color);
  }

  return parseAdjustColor(normalized);
}

function getSvgPaintFillInfo(styles, element) {
  const root = getSvgResourceRoot(element);
  const paintElements = root instanceof Element ? [...root.querySelectorAll(SVG_PAINT_SELECTOR)].slice(0, 200) : [];
  const findPaintColor = (prop) => {
    for (const paintElement of paintElements) {
      const paintStyles = window.getComputedStyle(paintElement);
      const color = getSvgPaintColor(paintStyles[prop], paintStyles);
      if (color) {
        return color;
      }
    }
    return getSvgPaintColor(styles[prop], styles);
  };
  const fillColor = findPaintColor("fill");
  const strokeColor = findPaintColor("stroke");
  const color = fillColor || strokeColor || parseAdjustColor(styles.color);
  const svgPaintProp = fillColor ? "fill" : strokeColor ? "stroke" : "fill";

  return {
    backgroundColor: color?.hex || "",
    backgroundColorCss: color?.css || "",
    backgroundImage: "",
    backgroundVisible: Boolean(color),
    fillType: color ? "color" : "none",
    fillLabel: color ? color.label : "无填充",
    svgPaintProp
  };
}

function getAdjustFillInfo(styles, element = null) {
  if (isSvgResourceElement(element)) {
    return getSvgPaintFillInfo(styles, element);
  }

  const backgroundImage = styles.backgroundImage && styles.backgroundImage !== "none" ? styles.backgroundImage : "";
  const parsedColor = isDefaultTransparentPaint(styles.backgroundColor)
    ? null
    : parseAdjustColor(styles.backgroundColor);
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

  const element = getAdjustTargetElement(persistedTarget);
  const styles = window.getComputedStyle(element);
  const currentValues = values || getAdjustValues(persistedTarget);
  const shadowLayers = getShadowLayers(styles.boxShadow);

  persistedTarget.adjustFillEnabled = currentValues.backgroundVisible;
  persistedTarget.adjustFillVisible = currentValues.backgroundVisible;
  persistedTarget.adjustFillType = currentValues.fillType || "none";
  persistedTarget.adjustStoredGap = currentValues.gap;
  persistedTarget.adjustStoredBackgroundColor = currentValues.backgroundColorCss || currentValues.backgroundColor || "";
  persistedTarget.adjustStoredBackgroundHex = currentValues.backgroundColor || "";
  persistedTarget.adjustStoredBackgroundImage = currentValues.backgroundImage || "";
  persistedTarget.adjustSvgPaintProp = currentValues.svgPaintProp || persistedTarget.adjustSvgPaintProp || "fill";
  persistedTarget.adjustFillOverlayLayers = [];
  applyComputedShadowStateToTarget(persistedTarget, styles.boxShadow);

  return persistedTarget;
}

function hasPersistedAdjustLayerState(target) {
  return Boolean(
    target &&
    (
      typeof target.adjustFillEnabled === "boolean" ||
      typeof target.adjustFillVisible === "boolean" ||
      Array.isArray(target.adjustFillOverlayLayers) ||
      typeof target.adjustFillType === "string" ||
      Array.isArray(target.adjustAddedOuterShadowLayers) ||
      target.adjustStoredGap !== undefined ||
      target.adjustStoredBackgroundColor !== undefined ||
      target.adjustStoredBackgroundImage !== undefined ||
      target.adjustSvgPaintProp !== undefined
    )
  );
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
  if (!Number.isFinite(persistedTarget.adjustStoredGap)) {
    persistedTarget.adjustStoredGap = currentValues.gap;
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
  if (isSvgResourceTarget(persistedTarget)) {
    persistedTarget.adjustSvgPaintProp = currentValues.svgPaintProp || persistedTarget.adjustSvgPaintProp || "fill";
  }
  if (!Array.isArray(persistedTarget.adjustFillOverlayLayers)) {
    persistedTarget.adjustFillOverlayLayers = [];
  }
  if (isSvgResourceTarget(persistedTarget)) {
    persistedTarget.adjustFillOverlayLayers = [];
  }
  persistedTarget.adjustFillOverlayLayers = (persistedTarget.adjustFillOverlayLayers || []).map((layer) =>
    normalizeFillOverlayLayerEntry(layer)
  );
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
      window.getComputedStyle(getAdjustTargetElement(persistedTarget)).boxShadow
    ).find((layer) => !/inset/i.test(layer));
    persistedTarget.adjustShadowOuterConfig = parseShadowConfigFromLayer(outerLayer, "outer");
  }
  if (!persistedTarget.adjustShadowInnerConfig) {
    const innerLayer = splitShadowLayerStrings(
      window.getComputedStyle(getAdjustTargetElement(persistedTarget)).boxShadow
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

function getSvgPaintSnapshotElements(element) {
  const root = getSvgResourceRoot(element);
  if (!(root instanceof Element)) {
    return [];
  }

  return [root, ...root.querySelectorAll(SVG_PAINT_SELECTOR)].slice(0, 500);
}

function captureSvgStyleSnapshot(element) {
  return getSvgPaintSnapshotElements(element).map((svgElement) => ({
    element: svgElement,
    styles: ADJUSTABLE_SVG_STYLE_PROPS.reduce((snapshot, prop) => {
      snapshot[prop] = svgElement?.style?.[prop] || "";
      return snapshot;
    }, {})
  }));
}

function applySvgStyleSnapshot(snapshot, targetElement = null) {
  if (!Array.isArray(snapshot)) {
    return;
  }

  const targetElements =
    targetElement instanceof Element ? getSvgPaintSnapshotElements(targetElement) : [];

  snapshot.forEach((entry, index) => {
    const element = targetElement instanceof Element ? targetElements[index] : entry?.element;
    if (!(element instanceof Element) || !entry.styles) {
      return;
    }

    ADJUSTABLE_SVG_STYLE_PROPS.forEach((prop) => {
      element.style[prop] = entry.styles[prop] || "";
    });
  });
}

function areSvgStyleSnapshotsEqual(a, b) {
  const left = Array.isArray(a) ? a : [];
  const right = Array.isArray(b) ? b : [];
  if (left.length !== right.length) {
    return false;
  }

  return left.every((entry, index) => {
    const other = right[index];
    if (!other || entry.element !== other.element) {
      return false;
    }

    return ADJUSTABLE_SVG_STYLE_PROPS.every((prop) => (entry.styles?.[prop] || "") === (other.styles?.[prop] || ""));
  });
}

function shouldApplySvgPaintToElement(element, prop, styles) {
  if (!(element instanceof Element)) {
    return false;
  }

  if (element.tagName?.toLowerCase?.() === "svg") {
    return true;
  }

  const explicitPaint = element.getAttribute(prop) || element.style?.[prop] || "";
  if (String(explicitPaint).trim().toLowerCase() === "none") {
    return false;
  }

  return Boolean(getSvgPaintColor(styles[prop], styles));
}

function applySvgPaintLayerState(target) {
  const element = getSvgResourceRoot(getTargetElement(target));
  if (!(element instanceof Element)) {
    return;
  }

  const paintProp = target.adjustSvgPaintProp === "stroke" ? "stroke" : "fill";
  const paintValue =
    target.adjustFillEnabled && target.adjustFillVisible
      ? target.adjustStoredBackgroundColor || target.adjustStoredBackgroundHex || DEFAULT_FILL_CSS
      : "none";
  const normalizedPaint = paintValue === "none" ? "none" : (parseAdjustColor(paintValue)?.css || DEFAULT_FILL_CSS);

  getSvgPaintSnapshotElements(element).forEach((svgElement) => {
    const styles = window.getComputedStyle(svgElement);
    svgElement.style.color = normalizedPaint === "none" ? "" : normalizedPaint;
    if (normalizedPaint === "none" || shouldApplySvgPaintToElement(svgElement, paintProp, styles)) {
      svgElement.style[paintProp] = normalizedPaint;
    }
  });
}

function applyFillLayerState(target) {
  const persistedTarget = ensureAdjustLayerState(target);
  if (!persistedTarget) {
    return;
  }

  const element = getAdjustTargetElement(persistedTarget);
  if (!(element instanceof Element)) {
    return;
  }

  if (isSvgResourceTarget(persistedTarget)) {
    applySvgPaintLayerState(persistedTarget);
    syncAssociatedAdjustTargetsFromSource();
    return;
  }

  if (!persistedTarget.adjustFillEnabled || !persistedTarget.adjustFillVisible) {
    element.style.backgroundColor = "transparent";
    element.style.backgroundImage = "none";
    syncAssociatedAdjustTargetsFromSource();
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
    syncAssociatedAdjustTargetsFromSource();
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
  syncAssociatedAdjustTargetsFromSource();
}

function formatShadowConfigToDropShadow(config) {
  if (!config) {
    return "";
  }

  const alpha = clampAlpha(config.alpha, DEFAULT_SHADOW_ALPHA);
  const color = parseAdjustColor(config.colorHex || DEFAULT_FILL_HEX) || parseAdjustColor(DEFAULT_FILL_HEX);
  const hex = color?.hex || DEFAULT_FILL_HEX;
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  return `drop-shadow(${Math.round(config.x)}px ${Math.round(config.y)}px ${Math.round(config.blur)}px rgba(${red}, ${green}, ${blue}, ${alpha}))`;
}

function applyShadowLayerState(target) {
  const persistedTarget = ensureAdjustLayerState(target);
  if (!persistedTarget) {
    return;
  }
  persistedTarget.adjustShadowStateDirty = true;

  const element = getAdjustTargetElement(persistedTarget);
  if (!(element instanceof Element)) {
    return;
  }

  const layers = [];
  const addedOuterLayers = (persistedTarget.adjustAddedOuterShadowLayers || [])
    .filter((layer) => layer?.visible !== false)
    .map((layer) => {
      const shadowType = layer?.type === "inner" || layer?.config?.type === "inner" ? "inner" : "outer";
      const config = {
        ...(layer?.config || getDefaultShadowConfig(shadowType)),
        type: shadowType
      };
      return isSvgResourceTarget(persistedTarget) ? formatShadowConfigToDropShadow(config) : formatShadowConfigToLayer(config);
  });
  layers.push(...addedOuterLayers);
  if (isSvgResourceTarget(persistedTarget)) {
    element.style.boxShadow = "none";
    element.style.filter = layers.length ? layers.join(" ") : "";
  } else {
    element.style.boxShadow = layers.length ? layers.join(", ") : "none";
  }
  syncAssociatedAdjustTargetsFromSource();
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
  const element = getAdjustTargetElement(target);
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
  const element = getAdjustTargetElement(target);
  const styles = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  const isFlex = styles.display === "flex" || styles.display === "inline-flex";
  const fillInfo = getAdjustFillInfo(styles, element);
  const shadowLayers = getShadowLayers(styles.boxShadow);
  const fontSize = parsePixelValue(styles.fontSize);
  const textColor = parseAdjustColor(styles.color);
  const widthBaseMode = getAdjustSizeMode(target, "width");
  const heightBaseMode = getAdjustSizeMode(target, "height");
  const widthMode = getStoredAdjustSizeInputMode(target, "width", widthBaseMode);
  const heightMode = getStoredAdjustSizeInputMode(target, "height", heightBaseMode);

  return {
    isTextTarget: isTextAdjustTarget(target),
    textContent: getAdjustTextContent(target),
    fontSize,
    fontWeight: normalizeFontWeightValue(styles.fontWeight),
    lineHeight: parseLineHeightValue(styles.lineHeight, fontSize),
    textAlign: normalizeTextAlignValue(styles.textAlign),
    textColor: textColor?.hex || DEFAULT_FILL_HEX,
    textColorCss: textColor?.css || styles.color || DEFAULT_FILL_HEX,
    layoutDirection: isFlex ? (styles.flexDirection.startsWith("column") ? "column" : "row") : "none",
    justifyContent: styles.justifyContent || "flex-start",
    alignItems: styles.alignItems || "stretch",
    spacingMode: getAdjustGapMode(target),
    width: Math.round(rect.width),
    widthMode,
    widthBaseMode,
    minWidth: getInlineSizeLimitValue(element, "width", "min"),
    maxWidth: getInlineSizeLimitValue(element, "width", "max"),
    height: Math.round(rect.height),
    heightMode,
    heightBaseMode,
    minHeight: getInlineSizeLimitValue(element, "height", "min"),
    maxHeight: getInlineSizeLimitValue(element, "height", "max"),
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
    svgPaintProp: fillInfo.svgPaintProp || "fill",
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
  const direction = values?.layoutDirection === "column" ? "column" : "row";
  const spacingMode = values?.spacingMode || "gap";
  buttons.forEach((button) => {
    let isActive = false;
    if (values.layoutDirection !== "none") {
      if (spacingMode === "auto" || spacingMode === "special") {
        isActive =
          direction === "column"
            ? button.dataset.adjustHorizontal === physicalAlignment.horizontal
            : button.dataset.adjustVertical === physicalAlignment.vertical;
      } else {
        isActive =
          button.dataset.adjustHorizontal === physicalAlignment.horizontal &&
          button.dataset.adjustVertical === physicalAlignment.vertical;
      }
    }
    button.dataset.state = isActive ? "active" : "inactive";
    button.dataset.visualOrientation = direction === "column" ? "vertical" : "horizontal";
  });
}

function physicalPositionToFlex(value) {
  if (value === "center") {
    return "center";
  }
  return value === "right" || value === "bottom" ? "flex-end" : "flex-start";
}

function getAdjustGapMode(target) {
  const element = getAdjustTargetElement(target);
  if (!(element instanceof Element)) {
    return "gap";
  }

  const justifyContent = window.getComputedStyle(element).justifyContent || "";
  if (justifyContent === "space-between") {
    return "auto";
  }
  if (justifyContent === "space-around") {
    return "special";
  }
  return "gap";
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

function captureAdjustFillPromptState(target) {
  const persistedTarget = ensureAdjustLayerState(target);
  if (!persistedTarget) {
    return null;
  }

  return {
    baseEnabled: persistedTarget.adjustFillEnabled === true,
    baseVisible: persistedTarget.adjustFillVisible !== false,
    fillType: persistedTarget.adjustFillType || "none",
    backgroundColor: persistedTarget.adjustStoredBackgroundColor || "",
    backgroundHex: persistedTarget.adjustStoredBackgroundHex || "",
    backgroundImage: persistedTarget.adjustStoredBackgroundImage || "",
    overlays: (persistedTarget.adjustFillOverlayLayers || []).map((layer) => cloneFillOverlayLayer(layer))
  };
}

function captureAdjustShadowPromptState(target) {
  const persistedTarget = ensureAdjustLayerState(target);
  if (!persistedTarget) {
    return null;
  }

  return {
    layers: (persistedTarget.adjustAddedOuterShadowLayers || []).map((layer) => cloneShadowLayer(layer))
  };
}

function setAdjustPromptBaselines(target) {
  const persistedTarget = ensureAdjustLayerState(target);
  if (!persistedTarget) {
    return;
  }

  persistedTarget.adjustFillPromptBaseline = captureAdjustFillPromptState(persistedTarget);
  persistedTarget.adjustShadowPromptBaseline = captureAdjustShadowPromptState(persistedTarget);
}

function isSameFillOverlayLayer(first, second) {
  return (
    (first?.colorCss || "") === (second?.colorCss || "") &&
    (first?.colorHex || "") === (second?.colorHex || "") &&
    (first?.visible !== false) === (second?.visible !== false)
  );
}

function isSameShadowConfig(first, second) {
  return (
    Math.round(Number(first?.x || 0)) === Math.round(Number(second?.x || 0)) &&
    Math.round(Number(first?.y || 0)) === Math.round(Number(second?.y || 0)) &&
    Math.round(Number(first?.blur || 0)) === Math.round(Number(second?.blur || 0)) &&
    (first?.type === "inner" ? "inner" : "outer") === (second?.type === "inner" ? "inner" : "outer") &&
    (normalizeHexColor(first?.colorHex || DEFAULT_FILL_HEX) || DEFAULT_FILL_HEX) ===
      (normalizeHexColor(second?.colorHex || DEFAULT_FILL_HEX) || DEFAULT_FILL_HEX) &&
    Math.round(clampAlpha(first?.alpha, DEFAULT_SHADOW_ALPHA) * 100) ===
      Math.round(clampAlpha(second?.alpha, DEFAULT_SHADOW_ALPHA) * 100)
  );
}

function describeAdjustBaseFill(fillState) {
  if (!fillState?.baseEnabled) {
    return "无填充";
  }

  if (fillState.fillType === "gradient" && fillState.backgroundImage) {
    return "线性渐变";
  }

  return formatAdjustColorValue(fillState.backgroundColor || fillState.backgroundHex || DEFAULT_BASE_FILL_CSS);
}

function describeAdjustFillOverlayLayer(layer) {
  return formatAdjustColorValue(layer?.colorCss || layer?.colorHex || DEFAULT_FILL_CSS);
}

function describeAdjustShadowLayer(layer) {
  const shadowType = layer?.type === "inner" || layer?.config?.type === "inner" ? "内阴影" : "外阴影";
  const config = layer?.config || getDefaultShadowConfig(shadowType === "内阴影" ? "inner" : "outer");
  const colorCss = buildAdjustColorCss(config.colorHex || DEFAULT_FILL_HEX, config.alpha ?? DEFAULT_SHADOW_ALPHA);
  return `${shadowType}，X ${Math.round(config.x)}px，Y ${Math.round(config.y)}px，Blur ${Math.round(config.blur)}px，颜色 ${formatAdjustColorValue(colorCss)}`;
}

function buildAdjustFillOperationLogs(target) {
  const persistedTarget = ensureAdjustLayerState(target);
  const baseline = persistedTarget?.adjustFillPromptBaseline || captureAdjustFillPromptState(target);
  if (!persistedTarget || !baseline) {
    return [];
  }

  const operations = [];
  const current = captureAdjustFillPromptState(persistedTarget);

  if (!baseline.baseEnabled && current.baseEnabled) {
    operations.push(`新增基础填充：${describeAdjustBaseFill(current)}`);
  } else if (baseline.baseEnabled && !current.baseEnabled) {
    operations.push("删除基础填充");
  } else if (baseline.baseEnabled && current.baseEnabled) {
    if (baseline.baseVisible !== current.baseVisible) {
      operations.push(`${current.baseVisible ? "显示" : "隐藏"}基础填充`);
    }

    const baseChanged =
      baseline.fillType !== current.fillType ||
      (current.fillType === "gradient"
        ? (baseline.backgroundImage || "") !== (current.backgroundImage || "")
        : (baseline.backgroundColor || "") !== (current.backgroundColor || ""));
    if (baseChanged) {
      operations.push(`将基础填充改为 ${describeAdjustBaseFill(current)}`);
    }
  }

  const baselineOverlays = baseline.overlays || [];
  const currentOverlays = current.overlays || [];
  const baselineById = new Map(baselineOverlays.map((layer, index) => [layer.id, { layer, index }]));
  const currentById = new Map(currentOverlays.map((layer, index) => [layer.id, { layer, index }]));

  baselineOverlays.forEach((layer, index) => {
    if (!currentById.has(layer.id)) {
      operations.push(`删除第 ${index + 1} 个叠加填充层`);
    }
  });

  currentOverlays.forEach((layer, index) => {
    if (!baselineById.has(layer.id)) {
      operations.push(`新增第 ${index + 1} 个叠加填充层：${describeAdjustFillOverlayLayer(layer)}`);
      return;
    }

    const baselineEntry = baselineById.get(layer.id)?.layer;
    if (!baselineEntry) {
      return;
    }

    if ((baselineEntry.visible !== false) !== (layer.visible !== false)) {
      operations.push(`${layer.visible !== false ? "显示" : "隐藏"}第 ${index + 1} 个叠加填充层`);
    }

    if (!isSameFillOverlayLayer(baselineEntry, layer) && (baselineEntry.colorCss !== layer.colorCss || baselineEntry.colorHex !== layer.colorHex)) {
      operations.push(`将第 ${index + 1} 个叠加填充层改为 ${describeAdjustFillOverlayLayer(layer)}`);
    }
  });

  return operations;
}

function buildAdjustShadowOperationLogs(target) {
  const persistedTarget = ensureAdjustLayerState(target);
  const baseline = persistedTarget?.adjustShadowPromptBaseline || captureAdjustShadowPromptState(target);
  if (!persistedTarget || !baseline) {
    return [];
  }

  const operations = [];
  const current = captureAdjustShadowPromptState(persistedTarget);
  const baselineLayers = baseline.layers || [];
  const currentLayers = current.layers || [];
  const baselineById = new Map(baselineLayers.map((layer, index) => [layer.id, { layer, index }]));
  const currentById = new Map(currentLayers.map((layer, index) => [layer.id, { layer, index }]));

  baselineLayers.forEach((layer, index) => {
    if (!currentById.has(layer.id)) {
      operations.push(`删除第 ${index + 1} 个阴影层（${layer.type === "inner" ? "内阴影" : "外阴影"}）`);
    }
  });

  currentLayers.forEach((layer, index) => {
    if (!baselineById.has(layer.id)) {
      operations.push(`新增第 ${index + 1} 个阴影层：${describeAdjustShadowLayer(layer)}`);
      return;
    }

    const baselineEntry = baselineById.get(layer.id)?.layer;
    if (!baselineEntry) {
      return;
    }

    if ((baselineEntry.visible !== false) !== (layer.visible !== false)) {
      operations.push(`${layer.visible !== false ? "显示" : "隐藏"}第 ${index + 1} 个阴影层（${layer.type === "inner" ? "内阴影" : "外阴影"}）`);
    }

    const shadowTypeChanged =
      (baselineEntry.type === "inner" ? "inner" : "outer") !== (layer.type === "inner" ? "inner" : "outer");
    const shadowConfigChanged = !isSameShadowConfig(baselineEntry.config, layer.config);
    if (shadowTypeChanged || shadowConfigChanged) {
      operations.push(`将第 ${index + 1} 个阴影层改为 ${describeAdjustShadowLayer(layer)}`);
    }
  });

  return operations;
}

function getAdjustPromptText(target) {
  const values = getAdjustValues(target);
  const isResourceTarget = isSvgResourceTarget(target);
  const isTextTarget = isTextAdjustTarget(target);
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
  const spacingLabel =
    values.spacingMode === "auto"
      ? "Auto（space between）"
      : values.spacingMode === "special"
        ? "Special（space around）"
        : `${values.gap}px`;
  const fillOperations = buildAdjustFillOperationLogs(persistedTarget);
  const shadowOperations = buildAdjustShadowOperationLogs(persistedTarget);
  const sizeConstraintText = getAdjustSizeConstraintText(values);
  const textAlignLabel =
    {
      left: "左对齐",
      center: "居中",
      right: "右对齐"
    }[values.textAlign] || values.textAlign;

  const lines = [];
  if (isTextTarget) {
    lines.push(
      `文字：文案「${formatAdjustTextPreview(values.textContent)}」，字号 ${values.fontSize}px，字重 ${values.fontWeight}，行高 ${values.lineHeight}px，${textAlignLabel}，文字颜色 ${formatAdjustColorValue(values.textColorCss || values.textColor)}。`,
      `布局：尺寸 ${values.width}px × ${values.height}px${sizeConstraintText}，内边距 上${values.paddingTop}px 右${values.paddingRight}px 下${values.paddingBottom}px 左${values.paddingLeft}px。`
    );
  } else if (!isResourceTarget) {
    lines.push(
      `布局：${directionLabel}，尺寸 ${values.width}px × ${values.height}px${sizeConstraintText}，对齐 ${verticalLabel}${horizontalLabel}，间距 ${spacingLabel}，内边距 上${values.paddingTop}px 右${values.paddingRight}px 下${values.paddingBottom}px 左${values.paddingLeft}px。`
    );
  }
  if (isTextTarget || isResourceTarget) {
    lines.push(`外观：不透明度 ${values.opacity}%。`);
  } else {
    lines.push(`外观：不透明度 ${values.opacity}% ，圆角 ${values.borderRadius}px。`);
  }

  if (fillOperations.length) {
    lines.push(`颜色图层操作：${fillOperations.join("；")}。`);
  }

  if (shadowOperations.length) {
    lines.push(`阴影操作：${shadowOperations.join("；")}。`);
  }

  return lines.join("\n");
}

function refreshAdjustPromptText(target) {
  const persistedTarget = findSelectedTarget(target) || target;
  if (!persistedTarget) {
    return;
  }

  const promptText = getAdjustPromptText(persistedTarget);
  persistedTarget.adjustPromptText = promptText;
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
    selectedTarget.adjustPromptText = promptText;
    selectedTarget.adjustPreserveSelection = true;
    if (rect) {
      selectedTarget.adjustPreserveRect = rect;
      selectedTarget.adjustPreservePageRect = persistedTarget.adjustPreservePageRect;
    }
  }
  renderSelection();
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
  syncAssociatedAdjustTargetsFromSource();
  syncAdjustPopoverFromTarget(persistedTarget);
  renderSelectionAndHighlights();
  commitAdjustChanges();
}

function clearBackgroundFill() {
  if (!state.adjustTarget) {
    return;
  }

  const persistedTarget = ensureAdjustLayerState(state.adjustTarget);
  persistedTarget.adjustFillEnabled = false;
  persistedTarget.adjustFillVisible = false;
  persistedTarget.adjustFillType = "none";
  persistedTarget.adjustStoredBackgroundColor = "";
  persistedTarget.adjustStoredBackgroundHex = "";
  persistedTarget.adjustStoredBackgroundImage = "";
  persistedTarget.adjustFillOverlayLayers = [];
  closeFillPopover();
  applyFillLayerState(persistedTarget);
  refreshAdjustPromptText(persistedTarget);
  syncAssociatedAdjustTargetsFromSource();
  syncAdjustPopoverFromTarget(persistedTarget);
  renderSelectionAndHighlights();
  commitAdjustChanges();
}

function updateAdjustTextColorValue({ hex = null, alpha = null, commit = false, sync = true } = {}) {
  if (!state.adjustTarget) {
    return;
  }

  const values = getAdjustValues(state.adjustTarget);
  const current =
    parseAdjustColor(values.textColorCss || values.textColor || DEFAULT_FILL_HEX) ||
    parseAdjustColor(DEFAULT_FILL_HEX);
  const nextHex = normalizeHexColor(hex) || current?.hex || DEFAULT_FILL_HEX;
  const nextAlpha = alpha == null
    ? clampAlpha(current?.alpha, 1)
    : clampNumber(alpha, 0, 100, Math.round(clampAlpha(current?.alpha, 1) * 100)) / 100;

  applyAdjustControl("textColor", buildAdjustColorCss(nextHex, nextAlpha), { commit: false, sync: false });

  if (sync) {
    if (state.fillPopover?.dataset.open === "true" && state.fillPopoverSource === "text") {
      syncFillPopoverFromTarget(state.adjustTarget);
    }
    syncAdjustPopoverFromTarget(state.adjustTarget);
  }

  if (commit) {
    commitAdjustChanges();
  }
}

function clearAdjustTextColor() {
  if (!state.adjustTarget) {
    return;
  }

  applyAdjustControl("textColor", "", { commit: false, sync: false });
  closeFillPopover();
  syncAdjustPopoverFromTarget(state.adjustTarget);
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
  syncAssociatedAdjustTargetsFromSource();
  syncAdjustPopoverFromTarget(persistedTarget);
  renderSelectionAndHighlights();
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
  if (state.fillPopoverSource === "shadow") {
    const shadowConfig = getActiveShadowConfig(target, state.shadowPopoverType);
    if (!shadowConfig) {
      return null;
    }

    return (
      parseAdjustColor(buildAdjustColorCss(shadowConfig.colorHex || DEFAULT_FILL_HEX, shadowConfig.alpha ?? DEFAULT_SHADOW_ALPHA)) ||
      parseAdjustColor(DEFAULT_FILL_CSS)
    );
  }

  if (state.fillPopoverSource === "text") {
    const values = getAdjustValues(target);
    return (
      parseAdjustColor(values.textColorCss || values.textColor || DEFAULT_FILL_HEX) ||
      parseAdjustColor(DEFAULT_FILL_HEX)
    );
  }

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

  const isShadowSource = state.fillPopoverSource === "shadow";
  const isTextSource = state.fillPopoverSource === "text";
  const isOverlay = state.fillPopoverOverlayIndex !== null;
  const isResourceTarget = isSvgResourceTarget(state.adjustTarget);
  const supportsGradient = !isShadowSource && !isTextSource && !isOverlay && !isResourceTarget;
  const mode = supportsGradient && state.fillPopoverMode === "gradient" ? "gradient" : "solid";
  const solidColor = cloneHsvaColor(
    state.fillPopoverSolidColor || colorStringToHsva(DEFAULT_FILL_CSS) || { h: 0, s: 0, v: 0, a: 1 }
  );
  const gradientStops = ensureGradientStops(state.fillPopoverGradientStops, solidColor);
  const activeStopIndex =
    mode === "gradient"
      ? clampNumber(state.fillPopoverGradientActiveStop, 0, Math.max(0, gradientStops.length - 1), 0)
      : 0;
  const activeColor = mode === "gradient" ? cloneHsvaColor(gradientStops[activeStopIndex]) : cloneHsvaColor(solidColor);
  const svThumbPosition = getFillSvThumbPosition(activeColor, state.fillPopoverFormat);
  state.fillPopoverGradientStops = gradientStops;
  state.fillPopoverGradientActiveStop = activeStopIndex;
  state.fillControls.modeSolid.dataset.state = mode === "solid" ? "active" : "inactive";
  state.fillControls.modeGradient.dataset.state = mode === "gradient" ? "active" : "inactive";
  state.fillControls.modeGradient.disabled = !supportsGradient;
  state.fillControls.modeGradient.hidden = !supportsGradient;
  state.fillControls.modeGradient.setAttribute("aria-disabled", supportsGradient ? "false" : "true");
  if (state.fillControls.modeSolid) {
    state.fillControls.modeSolid.hidden = !supportsGradient;
  }
  if (state.fillControls.modeSolid?.parentElement) {
    state.fillControls.modeSolid.parentElement.hidden = !supportsGradient;
    state.fillControls.modeSolid.parentElement.style.display = supportsGradient ? "" : "none";
  }

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
    state.fillControls.svPanel.dataset.colorFormat = state.fillPopoverFormat;
    if (state.fillPopoverFormat === "hsl") {
      state.fillControls.svPanel.style.backgroundColor = "transparent";
      state.fillControls.svPanel.style.setProperty(
        "--chat-fill-hsl-neutral",
        `hsl(${Math.round(activeColor.h)} 0% 50%)`
      );
      state.fillControls.svPanel.style.setProperty(
        "--chat-fill-hsl-saturated",
        `hsl(${Math.round(activeColor.h)} 100% 50%)`
      );
    } else {
      state.fillControls.svPanel.style.backgroundColor = `hsl(${Math.round(activeColor.h)} 100% 50%)`;
      state.fillControls.svPanel.style.removeProperty("--chat-fill-hsl-neutral");
      state.fillControls.svPanel.style.removeProperty("--chat-fill-hsl-saturated");
    }
  }
  if (state.fillControls.svThumb) {
    state.fillControls.svThumb.style.left = svThumbPosition.left;
    state.fillControls.svThumb.style.top = svThumbPosition.top;
  }
  if (state.fillControls.hueInput) {
    if (document.activeElement !== state.fillControls.hueInput) {
      state.fillControls.hueInput.value = String(Math.round((((activeColor.h % 360) + 360) % 360)));
    }
  }
  if (state.fillControls.hueTrack) {
    state.fillControls.hueTrack.style.setProperty("--chat-fill-hue-active", `hsl(${Math.round(activeColor.h)} 100% 50%)`);
  }
  if (state.fillControls.alphaTrack) {
    const { red, green, blue } = hsvaToRgb({ ...activeColor, a: 1 });
    state.fillControls.alphaTrack.style.setProperty(
      "--chat-fill-alpha-gradient",
      `linear-gradient(90deg, rgba(${red}, ${green}, ${blue}, 0) 0%, rgba(${red}, ${green}, ${blue}, 1) 100%)`
    );
  }
  if (state.fillControls.alphaSliderInput) {
    if (document.activeElement !== state.fillControls.alphaSliderInput) {
      state.fillControls.alphaSliderInput.value = String(Math.round(clampAlpha(activeColor.a, 1) * 100));
    }
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
      if (document.activeElement !== state.fillControls.valueInput) {
        state.fillControls.valueInput.value = formatFillPopoverColorValue(activeColor, state.fillPopoverFormat);
      }
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
        if (document.activeElement !== field) {
          field.value = String(tripletValues[index] ?? "");
        }
        field.min = tripletConfig[index].min;
        field.max = tripletConfig[index].max;
        field.step = tripletConfig[index].step;
        field.placeholder = tripletConfig[index].placeholder;
      });
    }
  }
  if (state.fillControls.alphaInput) {
    if (document.activeElement !== state.fillControls.alphaInput) {
      state.fillControls.alphaInput.value = String(Math.round(clampAlpha(activeColor.a, 1) * 100));
    }
  }

  scheduleFillPopoverPosition();
}

async function pickFillPopoverScreenColor() {
  const EyeDropperCtor = window.EyeDropper || globalThis.EyeDropper;
  if (!EyeDropperCtor) {
    showToast("当前浏览器暂不支持取色工具");
    return;
  }

  try {
    const eyeDropper = new EyeDropperCtor();
    const result = await eyeDropper.open();
    if (!result?.sRGBHex) {
      return;
    }

    const currentColor = getActiveFillPopoverColor() || colorStringToHsva(DEFAULT_FILL_CSS) || { h: 0, s: 0, v: 0, a: 1 };
    const nextColor = colorStringToHsva(result.sRGBHex, currentColor);
    if (!nextColor) {
      showToast("取色失败");
      return;
    }

    setActiveFillPopoverColor({ ...nextColor, a: currentColor.a }, { commit: true, sync: true });
    showToast("已吸取颜色");
  } catch (error) {
    if (error?.name === "AbortError") {
      return;
    }
    showToast("取色失败");
    console.error("EyeDropper failed", error);
  }
}

function syncFillPopoverFromTarget(target = state.adjustTarget) {
  if (!state.fillPopover || !target) {
    return;
  }

  if (state.fillPopoverSource === "shadow") {
    const fallbackColor = colorStringToHsva(DEFAULT_FILL_CSS) || { h: 0, s: 0, v: 0, a: 1 };
    const activeConfig = getActiveFillConfig(target);
    const solidColor =
      colorStringToHsva(activeConfig?.css || activeConfig?.hex || DEFAULT_FILL_CSS, fallbackColor) || cloneHsvaColor(fallbackColor);

    state.fillPopoverMode = "solid";
    state.fillPopoverSolidColor = cloneHsvaColor(solidColor);
    state.fillPopoverGradientStops = ensureGradientStops(null, solidColor);
    state.fillPopoverGradientAngle = 0;
    state.fillPopoverGradientActiveStop = 0;
    state.fillPopoverFormat = ["hex", "rgb", "hsl"].includes(state.fillPopoverFormat) ? state.fillPopoverFormat : "hex";
    state.fillPopoverFormatMenuOpen = false;
    renderFillPopoverControls();
    return;
  }

  if (state.fillPopoverSource === "text") {
    const values = getAdjustValues(target);
    const fallbackColor = colorStringToHsva(DEFAULT_FILL_HEX) || { h: 0, s: 0, v: 0, a: 1 };
    const solidColor =
      colorStringToHsva(values.textColorCss || values.textColor || DEFAULT_FILL_HEX, fallbackColor) ||
      cloneHsvaColor(fallbackColor);

    state.fillPopoverMode = "solid";
    state.fillPopoverSolidColor = cloneHsvaColor(solidColor);
    state.fillPopoverGradientStops = ensureGradientStops(null, solidColor);
    state.fillPopoverGradientAngle = 0;
    state.fillPopoverGradientActiveStop = 0;
    state.fillPopoverFormat = ["hex", "rgb", "hsl"].includes(state.fillPopoverFormat) ? state.fillPopoverFormat : "hex";
    state.fillPopoverFormatMenuOpen = false;
    renderFillPopoverControls();
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
  const isResourceTarget = isSvgResourceTarget(persistedTarget);
  const nextMode = isOverlay || isResourceTarget
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

  if (state.fillPopoverSource === "shadow") {
    const color = cloneHsvaColor(state.fillPopoverSolidColor || colorStringToHsva(DEFAULT_FILL_CSS) || { h: 0, s: 0, v: 0, a: 1 });
    applyShadowPopoverInput("color", hsvaToHex(color), { commit: false, sync: false });
    applyShadowPopoverInput("alpha", Math.round(clampAlpha(color.a, 1) * 100), { commit, sync });
    if (state.fillPopover?.dataset.open === "true") {
      renderFillPopoverControls();
    }
    return;
  }

  if (state.fillPopoverSource === "text") {
    const color = cloneHsvaColor(state.fillPopoverSolidColor || colorStringToHsva(DEFAULT_FILL_HEX) || { h: 0, s: 0, v: 0, a: 1 });
    applyAdjustControl("textColor", hsvaToCss(color), { commit: false, sync: false });
    if (sync) {
      syncFillPopoverFromTarget(state.adjustTarget);
      syncAdjustPopoverFromTarget(state.adjustTarget);
    }
    if (!sync && state.fillPopover?.dataset.open === "true") {
      renderFillPopoverControls();
    }
    if (commit) {
      commitAdjustChanges();
    }
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
  syncAssociatedAdjustTargetsFromSource();
  if (sync) {
    syncFillPopoverFromTarget(persistedTarget);
    syncAdjustPopoverFromTarget(persistedTarget);
  }
  if (sync || commit) {
    renderSelectionAndHighlights();
  }
  if (!sync && state.fillPopover?.dataset.open === "true") {
    renderFillPopoverControls();
  }

  if (commit) {
    commitAdjustChanges();
  }
}

function setActiveFillPopoverColor(nextColor, { commit = false, sync = true } = {}) {
  if (state.fillPopoverSource === "fill" && state.fillPopoverMode === "gradient") {
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
  if (state.fillPopoverSource !== "fill" || state.fillPopoverOverlayIndex !== null || isSvgResourceTarget(state.adjustTarget)) {
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
  if (state.fillPopoverSource !== "fill" || state.fillPopoverMode !== "gradient" || state.fillPopoverOverlayIndex !== null) {
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
  if (state.fillPopoverSource !== "fill" || state.fillPopoverMode !== "gradient" || state.fillPopoverOverlayIndex !== null) {
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

  beginAdjustTargetHighlightInteraction();

  if (event.target instanceof Element && typeof event.target.setPointerCapture === "function") {
    try {
      event.target.setPointerCapture(event.pointerId);
    } catch (error) {
      console.warn("setPointerCapture failed", error);
    }
  }

  state.fillPopoverDragSession = {
    type,
    managedLocally: true,
    pointerId: event.pointerId,
    stopIndex: Number.isInteger(extras.stopIndex) ? extras.stopIndex : null,
    cleanup: null
  };

  const handleMove = (nextEvent) => {
    if (!state.fillPopoverDragSession) {
      return;
    }
    if (state.fillPopoverDragSession.pointerId !== nextEvent.pointerId) {
      return;
    }
    nextEvent.preventDefault();
    updateFillPopoverDrag(nextEvent, false);
  };

  const handleUp = (nextEvent) => {
    if (!state.fillPopoverDragSession) {
      return;
    }
    if (state.fillPopoverDragSession.pointerId !== nextEvent.pointerId) {
      return;
    }
    nextEvent.preventDefault();
    finishFillPopoverDrag(nextEvent);
  };

  const cleanup = () => {
    window.removeEventListener("pointermove", handleMove, true);
    window.removeEventListener("pointerup", handleUp, true);
    window.removeEventListener("pointercancel", handleUp, true);
  };

  state.fillPopoverDragSession.cleanup = cleanup;
  window.addEventListener("pointermove", handleMove, true);
  window.addEventListener("pointerup", handleUp, true);
  window.addEventListener("pointercancel", handleUp, true);
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
    const xRatio = (event.clientX - rect.left) / rect.width;
    const yRatio = (event.clientY - rect.top) / rect.height;
    const nextColor = getFillSvDragColor(activeColor, xRatio, yRatio, state.fillPopoverFormat);
    setActiveFillPopoverColor(nextColor, { commit, sync: true });
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

  if (typeof state.fillPopoverDragSession.cleanup === "function") {
    state.fillPopoverDragSession.cleanup();
  }
  updateFillPopoverDrag(event, true);
  state.fillPopoverDragSession = null;
  syncAdjustTargetHighlightSuppression();
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
  syncAssociatedAdjustTargetsFromSource();
  if (sync) {
    syncAdjustPopoverFromTarget(persistedTarget);
  }
  renderSelectionAndHighlights();

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

function syncAdjustResourceMode(target) {
  if (!state.adjustPopover || !state.adjustControls) {
    return;
  }

  const isResourceTarget = isSvgResourceTarget(target);
  const isTextTarget = isTextAdjustTarget(target);
  state.adjustPopover.dataset.targetType = isResourceTarget ? "svg-resource" : isTextTarget ? "text" : "element";
  if (state.adjustControls.title) {
    state.adjustControls.title.textContent = isResourceTarget ? "调整 SVG" : isTextTarget ? "调整文字" : "调整样式";
  }
  if (state.adjustControls.associationRow) {
    state.adjustControls.associationRow.hidden = isTextTarget;
  }
  if (state.adjustControls.textSection) {
    state.adjustControls.textSection.hidden = !isTextTarget || isResourceTarget;
  }
  if (state.adjustControls.textDivider) {
    state.adjustControls.textDivider.hidden = !isTextTarget || isResourceTarget;
  }
  if (state.adjustControls.layoutSection) {
    state.adjustControls.layoutSection.hidden = isResourceTarget;
  }
  if (state.adjustControls.layoutDivider) {
    state.adjustControls.layoutDivider.hidden = isResourceTarget || isTextTarget;
  }
  if (state.adjustControls.layoutDirectionGroup) {
    state.adjustControls.layoutDirectionGroup.hidden = isResourceTarget || isTextTarget;
  }
  if (state.adjustControls.layoutAdvancedRow) {
    state.adjustControls.layoutAdvancedRow.hidden = isResourceTarget || isTextTarget;
  }
  if (state.adjustControls.paddingSection) {
    state.adjustControls.paddingSection.hidden = isResourceTarget;
    state.adjustControls.paddingSection.dataset.adjustEmbedded = isTextTarget ? "layout" : "false";
  }
  if (state.adjustControls.paddingTitle) {
    state.adjustControls.paddingTitle.hidden = isTextTarget;
  }
  if (state.adjustControls.paddingDivider) {
    state.adjustControls.paddingDivider.hidden = isResourceTarget;
  }
  if (state.adjustControls.opacityRow) {
    state.adjustControls.opacityRow.dataset.adjustFull = isResourceTarget || isTextTarget ? "true" : "false";
  }
  if (state.adjustControls.borderRadiusRow) {
    state.adjustControls.borderRadiusRow.hidden = isResourceTarget || isTextTarget;
  }
  if (state.adjustControls.resourceActions) {
    state.adjustControls.resourceActions.hidden = !isResourceTarget;
  }
  const addFillButton = state.adjustPopover.querySelector('[data-action="add-fill"]');
  if (addFillButton) {
    addFillButton.hidden = isTextTarget;
    const label = isResourceTarget ? "设置 SVG 颜色" : isTextTarget ? "选择文字颜色" : "添加颜色";
    addFillButton.setAttribute("aria-label", label);
    addFillButton.setAttribute("title", label);
  }
}

function sanitizeResourceFilename(value, fallback = "svg-resource") {
  const normalized = String(value || "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return normalized || fallback;
}

function copySvgDownloadComputedStyles(sourceRoot, cloneRoot) {
  const queue = [[sourceRoot, cloneRoot]];
  let copied = 0;
  const props = [
    "color",
    "fill",
    "fill-opacity",
    "stroke",
    "stroke-opacity",
    "stroke-width",
    "stroke-linecap",
    "stroke-linejoin",
    "opacity",
    "filter"
  ];

  while (queue.length && copied < 600) {
    const [source, clone] = queue.shift();
    if (!(source instanceof Element) || !(clone instanceof Element)) {
      continue;
    }

    const styles = window.getComputedStyle(source);
    props.forEach((prop) => {
      const value = styles.getPropertyValue(prop);
      if (value) {
        clone.style.setProperty(prop, value);
      }
    });

    const sourceChildren = [...source.children];
    const cloneChildren = [...clone.children];
    sourceChildren.forEach((sourceChild, index) => {
      if (cloneChildren[index] instanceof Element) {
        queue.push([sourceChild, cloneChildren[index]]);
      }
    });
    copied += 1;
  }
}

function serializeSvgResource(svg) {
  const clone = svg.cloneNode(true);
  if (!(clone instanceof Element)) {
    return "";
  }

  clone.setAttribute("xmlns", SVG_NAMESPACE);
  if (!clone.getAttribute("xmlns:xlink")) {
    clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  }

  const rect = svg.getBoundingClientRect();
  if (!clone.getAttribute("width") && rect.width > 0) {
    clone.setAttribute("width", String(Math.round(rect.width)));
  }
  if (!clone.getAttribute("height") && rect.height > 0) {
    clone.setAttribute("height", String(Math.round(rect.height)));
  }
  if (!clone.getAttribute("viewBox") && rect.width > 0 && rect.height > 0) {
    clone.setAttribute("viewBox", `0 0 ${Math.round(rect.width)} ${Math.round(rect.height)}`);
  }

  copySvgDownloadComputedStyles(svg, clone);
  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
}

function downloadAdjustResource() {
  if (!state.adjustTarget) {
    return;
  }

  const svg = getSvgResourceRoot(getTargetElement(state.adjustTarget));
  if (!(svg instanceof Element)) {
    showToast("当前目标不是可下载资源");
    return;
  }

  const source = serializeSvgResource(svg);
  if (!source) {
    showToast("下载资源失败");
    return;
  }

  const nameSource =
    svg.getAttribute("aria-label") ||
    svg.getAttribute("title") ||
    svg.id ||
    svg.getAttribute("data-name") ||
    "svg-resource";
  const filename = `${sanitizeResourceFilename(nameSource)}.svg`;
  const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.dataset.chatContextPickerUi = "true";
  document.documentElement.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast("已下载 SVG 资源");
}

function positionFillPopover(anchorRect) {
  if (!state.fillPopover || !anchorRect) {
    return;
  }

  const viewportPadding = 16;
  const maxHeight = Math.max(160, window.innerHeight - viewportPadding * 2);
  state.fillPopover.style.maxHeight = `${maxHeight}px`;

  const measuredRect = state.fillPopover.getBoundingClientRect();
  const popoverWidth = Math.min(Math.ceil(measuredRect.width || state.fillPopover.offsetWidth || 280), window.innerWidth - 32);
  const popoverHeight = Math.min(Math.ceil(measuredRect.height || state.fillPopover.offsetHeight || 454), maxHeight);
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

function scheduleFillPopoverPosition() {
  if (!state.fillPopover || state.fillPopover.dataset.open !== "true") {
    return;
  }

  requestAnimationFrame(() => {
    if (!state.fillPopover || state.fillPopover.dataset.open !== "true") {
      return;
    }
    state.fillPopoverAnchorRect = getFillPopoverAnchorRect();
    positionFillPopover(state.fillPopoverAnchorRect);
  });
}

function getFillPopoverAnchorRect() {
  if (!state.adjustPopover) {
    return state.fillPopoverAnchorRect;
  }

  if (state.fillPopoverSource === "shadow") {
    return (
      state.shadowControls?.swatch?.closest?.(".chat-context-picker-shadow-color-row")?.getBoundingClientRect?.() ||
      state.fillPopoverAnchorRect
    );
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

function openFillPopover(anchorRect = null, { overlayIndex = null, source = "fill" } = {}) {
  if (!state.adjustTarget) {
    return;
  }

  ensureFillPopover();
  closeSizeMenu();
  closeGapMenu();
  if (source !== "shadow") {
    closeShadowPopover();
  }
  state.fillPopoverSource = source === "shadow" ? "shadow" : source === "text" ? "text" : "fill";
  state.fillPopoverFormatMenuOpen = false;
  state.fillPopoverOverlayIndex =
    state.fillPopoverSource === "fill" && Number.isInteger(overlayIndex) && overlayIndex >= 0 ? overlayIndex : null;
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
  closeGapMenu();
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
  state.fillPopoverSource = "fill";
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

  const values = getAdjustValues(target);
  const currentMode = state.sizeMenuProp === "height" ? values.heightMode : values.widthMode;
  state.sizeMenuControls.items?.forEach((item) => {
    const itemMode = item.dataset.sizeMode;
    let isActive = itemMode === currentMode;
    if (itemMode === "max") {
      isActive = state.sizeMenuProp === "height" ? values.maxHeight !== "" : values.maxWidth !== "";
    } else if (itemMode === "min") {
      isActive = state.sizeMenuProp === "height" ? values.minHeight !== "" : values.minWidth !== "";
    }
    item.dataset.state = isActive ? "active" : "inactive";
  });
}

function syncGapMenuFromTarget(target = state.adjustTarget) {
  if (!state.gapMenu || !target) {
    return;
  }

  const values = getAdjustValues(target);
  const persistedTarget = ensureAdjustLayerState(target, values);
  state.gapMenuControls.items?.forEach((item) => {
    item.dataset.state = item.dataset.gapMode === values.spacingMode ? "active" : "inactive";
  });
  if (state.gapMenuControls.gapMeta) {
    state.gapMenuControls.gapMeta.textContent = String(
      Number.isFinite(persistedTarget?.adjustStoredGap) ? persistedTarget.adjustStoredGap : values.gap
    );
  }
}

function getAdjustSizeDisplayValue(values, prop) {
  const normalizedProp = prop === "height" ? "height" : "width";
  return normalizedProp === "height" ? values.height : values.width;
}

function getAdjustSizeModeTitle(prop, mode) {
  const isHeight = prop === "height";
  const label = isHeight ? "高度" : "宽度";
  if (mode === "fixed") {
    return `固定${label}`;
  }
  if (mode === "hug") {
    return `当前为 Hug 自适应${label}`;
  }
  if (mode === "fill") {
    return `当前为 Fill 填满${label}`;
  }
  return `设置${label}`;
}

function syncAdjustSizeLimitInput(input, value) {
  if (!(input instanceof HTMLInputElement) || document.activeElement === input) {
    return;
  }
  input.value = value === "" ? "" : String(value);
}

function syncAdjustSizeLimitRows(values) {
  const controls = state.adjustControls || {};
  const hasMax = values.maxWidth !== "" || values.maxHeight !== "";
  const hasMin = values.minWidth !== "" || values.minHeight !== "";

  if (controls.sizeLimitStack) {
    controls.sizeLimitStack.hidden = !hasMax && !hasMin;
    controls.sizeLimitStack.dataset.visible = hasMax || hasMin ? "true" : "false";
  }
  if (controls.maxLimitRow) {
    controls.maxLimitRow.hidden = !hasMax;
    controls.maxLimitRow.dataset.visible = hasMax ? "true" : "false";
  }
  if (controls.minLimitRow) {
    controls.minLimitRow.hidden = !hasMin;
    controls.minLimitRow.dataset.visible = hasMin ? "true" : "false";
  }

  syncAdjustSizeLimitInput(controls.maxWidth, values.maxWidth);
  syncAdjustSizeLimitInput(controls.maxHeight, values.maxHeight);
  syncAdjustSizeLimitInput(controls.minWidth, values.minWidth);
  syncAdjustSizeLimitInput(controls.minHeight, values.minHeight);
}

function positionSizeMenu(anchorRect) {
  if (!state.sizeMenu || !anchorRect) {
    return;
  }

  const menuWidth = Math.min(state.sizeMenu.offsetWidth || 156, window.innerWidth - 32);
  const menuHeight = Math.min(state.sizeMenu.offsetHeight || 184, window.innerHeight - 32);
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

function positionGapMenu(anchorRect) {
  if (!state.gapMenu || !anchorRect) {
    return;
  }

  const menuWidth = Math.min(state.gapMenu.offsetWidth || 200, window.innerWidth - 32);
  const menuHeight = Math.min(state.gapMenu.offsetHeight || 118, window.innerHeight - 32);
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

  state.gapMenu.style.left = `${left}px`;
  state.gapMenu.style.top = `${top}px`;
}

function openSizeMenu(prop, anchorRect = null) {
  if (!state.adjustTarget || isSvgResourceTarget(state.adjustTarget)) {
    return;
  }

  ensureSizeMenu();
  closeGapMenu();
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

function openGapMenu(anchorRect = null) {
  if (!state.adjustTarget || isSvgResourceTarget(state.adjustTarget)) {
    return;
  }

  ensureGapMenu();
  closeSizeMenu();
  closeFillPopover();
  closeShadowPopover();
  state.gapMenuAnchorRect = anchorRect || state.gapMenuAnchorRect;
  syncGapMenuFromTarget(state.adjustTarget);
  state.gapMenu.dataset.open = "true";
  syncAdjustPopoverFromTarget(state.adjustTarget);
  positionGapMenu(anchorRect || state.gapMenuAnchorRect);
}

function closeGapMenu() {
  if (!state.gapMenu) {
    return;
  }
  state.gapMenu.dataset.open = "false";
  state.gapMenuAnchorRect = null;
  if (state.adjustTarget) {
    syncAdjustPopoverFromTarget(state.adjustTarget);
  }
}

function applyAdjustGapMode(mode, { commit = false } = {}) {
  if (!state.adjustTarget || isSvgResourceTarget(state.adjustTarget)) {
    return;
  }

  const element = getAdjustTargetElement(state.adjustTarget);
  if (!(element instanceof Element)) {
    return;
  }

  const normalizedMode = ["gap", "auto", "special"].includes(mode) ? mode : "gap";
  const currentValues = getAdjustValues(state.adjustTarget);
  const persistedTarget = ensureAdjustLayerState(state.adjustTarget, currentValues);

  if (!state.adjustStyleBaseline) {
    state.adjustStyleBaseline = captureCurrentAdjustStyleBaseline(element);
  }

  if (!/flex/.test(window.getComputedStyle(element).display)) {
    element.style.display = "flex";
    if (!element.style.flexDirection) {
      element.style.flexDirection = "row";
    }
  }
  normalizeFlexChildMargins(element);

  if (currentValues.spacingMode === "gap") {
    persistedTarget.adjustStoredGap = currentValues.gap;
  }

  if (normalizedMode === "gap") {
    const restoredGap = clampNumber(
      Number.isFinite(persistedTarget.adjustStoredGap) ? persistedTarget.adjustStoredGap : currentValues.gap,
      0,
      999,
      0
    );
    const physicalAlignment = getPhysicalAlignment(currentValues);
    element.style.gap = `${restoredGap}px`;
    if (currentValues.layoutDirection === "column") {
      element.style.justifyContent = physicalPositionToFlex(physicalAlignment.vertical);
      element.style.alignItems = physicalPositionToFlex(physicalAlignment.horizontal);
    } else {
      element.style.justifyContent = physicalPositionToFlex(physicalAlignment.horizontal);
      element.style.alignItems = physicalPositionToFlex(physicalAlignment.vertical);
    }
  } else {
    element.style.gap = "0px";
    element.style.justifyContent = normalizedMode === "auto" ? "space-between" : "space-around";
  }

  refreshAdjustPromptText(state.adjustTarget);
  syncAssociatedAdjustTargetsFromSource();
  syncAdjustPopoverFromTarget(state.adjustTarget);
  renderSelectionAndHighlights();

  if (commit) {
    commitAdjustChanges();
  }
}

function applyAdjustSizeMode(prop, mode, { commit = false, sync = true } = {}) {
  if (!state.adjustTarget || !prop || isSvgResourceTarget(state.adjustTarget)) {
    return;
  }

  const element = getAdjustTargetElement(state.adjustTarget);
  if (!(element instanceof Element)) {
    return;
  }

  const normalizedProp = prop === "height" ? "height" : "width";
  const rawMode = String(mode || "").trim();
  const rect = element.getBoundingClientRect();
  const parentContext = getParentFlexContext(element);
  const isMainAxis =
    (normalizedProp === "width" && parentContext.direction === "row") ||
    (normalizedProp === "height" && parentContext.direction === "column");
  const sizeValue = `${Math.max(0, Math.round(normalizedProp === "width" ? rect.width : rect.height))}px`;

  if (!state.adjustStyleBaseline) {
    state.adjustStyleBaseline = captureCurrentAdjustStyleBaseline(element);
  }

  if (isAdjustSizeLimitMode(rawMode)) {
    const styleProp = getAdjustSizeLimitProp(normalizedProp, rawMode);
    const initialValue = element.style[styleProp] ? parsePixelValue(element.style[styleProp], 0) : parsePixelValue(sizeValue, 0);
    applyAdjustSizeLimit(styleProp, initialValue, { commit, sync });
    return;
  }

  const targetMode = normalizeAdjustSizeInputMode(rawMode, "fixed");
  setStoredAdjustSizeInputMode(state.adjustTarget, normalizedProp, targetMode);

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
  syncAssociatedAdjustTargetsFromSource();
  if (sync) {
    syncSizeMenuFromTarget(state.adjustTarget);
    syncAdjustPopoverFromTarget(state.adjustTarget);
  }
  renderSelectionAndHighlights();

  if (commit) {
    commitAdjustChanges();
  }
}

function closeShadowPopover() {
  if (state.fillPopover?.dataset.open === "true" && state.fillPopoverSource === "shadow") {
    closeFillPopover();
  }
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
    syncAssociatedAdjustTargetsFromSource();
    renderSelectionAndHighlights();
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
  syncAssociatedAdjustTargetsFromSource();
  if (sync) {
    syncShadowPopoverFromTarget(persistedTarget);
    syncAdjustPopoverFromTarget(persistedTarget);
  }
  renderSelectionAndHighlights();

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
  const isTextTarget = isTextAdjustTarget(persistedTarget);
  syncAdjustResourceMode(persistedTarget);
  renderAdjustLayerRows(persistedTarget);
  const isFillPopoverOpen = state.fillPopover?.dataset.open === "true";
  const isShadowPopoverOpen = state.shadowPopover?.dataset.open === "true";
  const isSizeMenuOpen = state.sizeMenu?.dataset.open === "true";
  const isGapMenuOpen = state.gapMenu?.dataset.open === "true";
  const activeSizeMenuProp = isSizeMenuOpen ? state.sizeMenuProp : null;
  const activeBaseShadowType =
    isShadowPopoverOpen && state.shadowPopoverOverlayIndex === null ? state.shadowPopoverType : null;
  syncAdjustSegments("layoutDirection", values.layoutDirection);
  syncAdjustSegments("textAlign", values.textAlign);
  syncAdjustAlignmentGrid(values);
  const baseFillValue = isTextTarget
    ? values.textColorCss || values.textColor || DEFAULT_FILL_HEX
    : persistedTarget?.adjustStoredBackgroundColor || values.backgroundColorCss || values.backgroundColor;
  const baseFillSwatch = !isTextTarget && persistedTarget?.adjustFillType === "gradient" && persistedTarget?.adjustStoredBackgroundImage
    ? persistedTarget.adjustStoredBackgroundImage
    : baseFillValue;
  const baseFillEnabled = isTextTarget || Boolean(persistedTarget?.adjustFillEnabled);
  const baseFillIsGradient = !isTextTarget && persistedTarget?.adjustFillType === "gradient";

  if (state.adjustControls.backgroundColorInput) {
    state.adjustControls.backgroundColorInput.value =
      isTextTarget
        ? values.textColor || DEFAULT_FILL_HEX
        : persistedTarget?.adjustStoredBackgroundHex || values.backgroundColor || DEFAULT_FILL_HEX;
  }
  if (state.adjustControls.backgroundColorText) {
    state.adjustControls.backgroundColorText.value = baseFillEnabled
      ? (
          baseFillIsGradient
            ? "线性渐变"
            : formatAdjustColorHexValue(baseFillValue)
        ) || "无填充"
      : "无填充";
    state.adjustControls.backgroundColorText.readOnly = !baseFillEnabled || baseFillIsGradient;
  }
  if (state.adjustControls.backgroundColorAlpha) {
    state.adjustControls.backgroundColorAlpha.value = baseFillEnabled
      ? formatAdjustColorAlphaValue(baseFillValue, 100)
      : "100";
    state.adjustControls.backgroundColorAlpha.readOnly = !baseFillEnabled || baseFillIsGradient;
  }
  if (state.adjustControls.backgroundColorRow) {
    state.adjustControls.backgroundColorRow.dataset.state =
      isFillPopoverOpen && state.fillPopoverOverlayIndex === null && (!isTextTarget || state.fillPopoverSource === "text")
        ? "active"
        : "default";
    state.adjustControls.backgroundColorRow.dataset.visible =
      baseFillEnabled && (isTextTarget || persistedTarget?.adjustFillVisible) ? "true" : "false";
  }
  if (state.adjustControls.backgroundColorSwatch) {
    state.adjustControls.backgroundColorSwatch.dataset.empty = baseFillEnabled ? "false" : "true";
    state.adjustControls.backgroundColorSwatch.style.setProperty(
      "--swatch-color",
      baseFillEnabled ? baseFillSwatch : "transparent"
    );
    state.adjustControls.backgroundColorSwatch.style.borderColor = baseFillEnabled
      ? "transparent"
      : "var(--chat-context-picker-swatch-border, #ebebeb)";
  }
  if (state.adjustControls.textContent && document.activeElement !== state.adjustControls.textContent) {
    state.adjustControls.textContent.value = values.textContent;
  }
  if (state.adjustControls.fontSize) {
    state.adjustControls.fontSize.value = String(values.fontSize);
  }
  if (state.adjustControls.fontWeight) {
    state.adjustControls.fontWeight.value = String(values.fontWeight);
  }
  if (state.adjustControls.lineHeight) {
    state.adjustControls.lineHeight.value = String(values.lineHeight);
  }
  if (state.adjustControls.textColorInput) {
    state.adjustControls.textColorInput.value = values.textColor || DEFAULT_FILL_HEX;
  }
  if (state.adjustControls.textColorText && document.activeElement !== state.adjustControls.textColorText) {
    state.adjustControls.textColorText.value = formatAdjustColorHexValue(values.textColorCss || values.textColor, "000000");
  }
  if (state.adjustControls.textColorSwatch) {
    state.adjustControls.textColorSwatch.dataset.empty = "false";
    state.adjustControls.textColorSwatch.style.setProperty("--swatch-color", values.textColorCss || values.textColor || DEFAULT_FILL_HEX);
    state.adjustControls.textColorSwatch.style.borderColor = "transparent";
  }
  if (state.adjustControls.width) {
    state.adjustControls.width.value = String(getAdjustSizeDisplayValue(values, "width"));
    const widthReadOnly = values.widthMode === "hug" || values.widthMode === "fill";
    state.adjustControls.width.readOnly = widthReadOnly;
    state.adjustControls.width.setAttribute("aria-readonly", widthReadOnly ? "true" : "false");
    state.adjustControls.width.title = getAdjustSizeModeTitle("width", values.widthMode);
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
    state.adjustControls.height.value = String(getAdjustSizeDisplayValue(values, "height"));
    const heightReadOnly = values.heightMode === "hug" || values.heightMode === "fill";
    state.adjustControls.height.readOnly = heightReadOnly;
    state.adjustControls.height.setAttribute("aria-readonly", heightReadOnly ? "true" : "false");
    state.adjustControls.height.title = getAdjustSizeModeTitle("height", values.heightMode);
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
  syncAdjustSizeLimitRows(values);
  if (state.adjustControls.borderRadius) {
    state.adjustControls.borderRadius.value = String(normalizeAdjustBorderRadius(values.borderRadius));
  }
  if (state.adjustControls.opacity) {
    state.adjustControls.opacity.value = String(values.opacity);
  }
  if (state.adjustControls.gap) {
    const gapDisplayValue =
      values.spacingMode === "gap"
        ? values.gap
        : Number.isFinite(persistedTarget?.adjustStoredGap)
          ? persistedTarget.adjustStoredGap
          : values.gap;
    state.adjustControls.gap.value = String(gapDisplayValue);
    state.adjustControls.gap.readOnly = values.spacingMode !== "gap";
    state.adjustControls.gap.setAttribute("aria-readonly", values.spacingMode !== "gap" ? "true" : "false");
    state.adjustControls.gap.title =
      values.spacingMode === "gap"
        ? "自定义 gap 间距"
        : values.spacingMode === "auto"
          ? "当前为 Auto：space-between"
          : "当前为 Special：space-around";
  }
  if (state.adjustControls.gapRow) {
    state.adjustControls.gapRow.dataset.gapMode = values.spacingMode;
    state.adjustControls.gapRow.dataset.gapMenuOpen = isGapMenuOpen ? "true" : "false";
    const gapButton = state.adjustControls.gapRow.querySelector('[data-action="open-gap-menu"]');
    if (gapButton) {
      gapButton.dataset.state = isGapMenuOpen ? "active" : "default";
      gapButton.setAttribute("aria-expanded", isGapMenuOpen ? "true" : "false");
    }
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
  if (isGapMenuOpen) {
    syncGapMenuFromTarget(persistedTarget);
  }
}

function positionAdjustPopover(target, anchorRect = null) {
  if (!state.adjustPopover) {
    return;
  }

  const rect = mergeRects(getTargetClientRects(target)) || getAdjustTargetElement(target).getBoundingClientRect();
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

  const element = getAdjustTargetElement(state.adjustTarget);
  syncAssociatedAdjustTargetsFromSource();
  const currentSnapshot = captureCurrentAdjustStyleBaseline(element);
  if (!state.adjustStyleBaseline || areStyleGroupSnapshotsEqual(state.adjustStyleBaseline, currentSnapshot)) {
    return;
  }

  pushHistoryEntry({
    type: "style-inline",
    element,
    snapshot: state.adjustStyleBaseline,
    items: normalizeAdjustableStyleGroupSnapshot(state.adjustStyleBaseline, element).items
  });
  state.adjustStyleBaseline = currentSnapshot;
}

function openAdjustPopover(target, anchorRect = null) {
  ensureAdjustPopover();
  ensureSizeMenu();
  ensureGapMenu();
  ensureFillPopover();
  ensureShadowPopover();
  closePromptPopover();
  commitAdjustChanges();
  closeSizeMenu();
  closeGapMenu();
  closeFillPopover();
  closeShadowPopover();

  const persistedTarget = findSelectedTarget(target) || target;
  if (!hasPersistedAdjustLayerState(persistedTarget)) {
    hydrateAdjustLayerState(persistedTarget);
  } else {
    ensureAdjustLayerState(persistedTarget);
  }
  setAdjustPromptBaselines(persistedTarget);
  state.adjustTarget = persistedTarget;
  beginHoverLockForAdjustTarget(persistedTarget);
  state.adjustStyleBaseline = captureCurrentAdjustStyleBaseline(getAdjustTargetElement(persistedTarget));
  clearAdjustLayerSelection();
  syncAdjustPopoverFromTarget(persistedTarget);
  positionAdjustPopover(persistedTarget, anchorRect);
  state.adjustPopover.dataset.open = "true";
  state.hoveredTarget = null;
  state.hoveredSelectedTarget = persistedTarget;
  syncAdjustTargetHighlightSuppression();
  refreshHighlights();
  scheduleAdjustShadowHydration(persistedTarget);
}

function closeAdjustPopover() {
  if (!state.adjustPopover) {
    return;
  }

  clearPendingAdjustShadowHydration();
  commitAdjustChanges();
  closeSizeMenu();
  closeGapMenu();
  closeFillPopover();
  closeShadowPopover();
  endHoverLock();
  state.adjustPopover.dataset.open = "false";
  state.adjustTarget = null;
  state.adjustTargetHighlightPointerActive = false;
  state.adjustTargetHighlightSuppressed = false;
  state.adjustStyleBaseline = null;
  clearAdjustLayerSelection();
  refreshHighlights();
}

function applyAdjustAlignment(horizontal, vertical, { commit = false } = {}) {
  if (!state.adjustTarget || isSvgResourceTarget(state.adjustTarget)) {
    return;
  }

  const element = getAdjustTargetElement(state.adjustTarget);
  if (!(element instanceof Element)) {
    return;
  }
  const currentValues = getAdjustValues(state.adjustTarget);
  const persistedTarget = ensureAdjustLayerState(state.adjustTarget, currentValues);

  if (!state.adjustStyleBaseline) {
    state.adjustStyleBaseline = captureCurrentAdjustStyleBaseline(element);
  }

  if (!/flex/.test(window.getComputedStyle(element).display)) {
    element.style.display = "flex";
    if (!element.style.flexDirection) {
      element.style.flexDirection = "row";
    }
  }
  normalizeFlexChildMargins(element);

  if (currentValues.spacingMode === "gap") {
    persistedTarget.adjustStoredGap = currentValues.gap;
  } else {
    const restoredGap = clampNumber(
      Number.isFinite(persistedTarget?.adjustStoredGap) ? persistedTarget.adjustStoredGap : currentValues.gap,
      0,
      999,
      0
    );
    element.style.gap = `${restoredGap}px`;
  }

  const direction = window.getComputedStyle(element).flexDirection.startsWith("column") ? "column" : "row";
  if (currentValues.spacingMode === "auto" || currentValues.spacingMode === "special") {
    if (direction === "column") {
      element.style.alignItems = physicalPositionToFlex(horizontal);
    } else {
      element.style.alignItems = physicalPositionToFlex(vertical);
    }
  } else {
    if (direction === "column") {
      element.style.justifyContent = physicalPositionToFlex(vertical);
      element.style.alignItems = physicalPositionToFlex(horizontal);
    } else {
      element.style.justifyContent = physicalPositionToFlex(horizontal);
      element.style.alignItems = physicalPositionToFlex(vertical);
    }
  }

  refreshAdjustPromptText(state.adjustTarget);
  syncAssociatedAdjustTargetsFromSource();
  syncAdjustPopoverFromTarget(state.adjustTarget);
  renderSelectionAndHighlights();

  if (commit) {
    commitAdjustChanges();
  }
}

function applyAdjustSizeLimit(limitKey, rawValue, { commit = false, sync = true } = {}) {
  if (!state.adjustTarget || !limitKey || isSvgResourceTarget(state.adjustTarget)) {
    return;
  }

  const element = getAdjustTargetElement(state.adjustTarget);
  if (!(element instanceof Element)) {
    return;
  }

  const limit = parseAdjustSizeLimitKey(limitKey);
  if (!limit) {
    return;
  }

  if (!state.adjustStyleBaseline) {
    state.adjustStyleBaseline = captureCurrentAdjustStyleBaseline(element);
  }

  if (String(rawValue ?? "").trim() === "") {
    element.style[limit.styleProp] = "";
  } else {
    element.style[limit.styleProp] = `${clampNumber(rawValue, 0, 9999, 0)}px`;
  }

  refreshAdjustPromptText(state.adjustTarget);
  syncAssociatedAdjustTargetsFromSource();
  if (sync) {
    syncAdjustPopoverFromTarget(state.adjustTarget);
    syncSizeMenuFromTarget(state.adjustTarget);
  }
  renderSelectionAndHighlights();

  if (commit) {
    commitAdjustChanges();
  }
}

function applyAdjustControl(prop, rawValue, { commit = false, sync = true } = {}) {
  if (!state.adjustTarget) {
    return;
  }

  if (isSvgResourceTarget(state.adjustTarget) && isAdjustLayoutProp(prop)) {
    return;
  }

  const element = getAdjustTargetElement(state.adjustTarget);
  if (!(element instanceof Element)) {
    return;
  }

  if (!state.adjustStyleBaseline) {
    state.adjustStyleBaseline = captureCurrentAdjustStyleBaseline(element);
  }

  if (prop === "textContent") {
    const textNode = getAdjustTextNode(state.adjustTarget);
    if (textNode) {
      textNode.textContent = String(rawValue ?? "");
    }
  }

  if (prop === "fontSize") {
    element.style.fontSize = `${clampNumber(rawValue, 1, 999, 16)}px`;
  }

  if (prop === "fontWeight") {
    element.style.fontWeight = String(normalizeFontWeightValue(rawValue));
  }

  if (prop === "lineHeight") {
    element.style.lineHeight = `${clampNumber(rawValue, 1, 999, 20)}px`;
  }

  if (prop === "textAlign") {
    element.style.textAlign = normalizeTextAlignValue(rawValue);
    syncAdjustSegments("textAlign", normalizeTextAlignValue(rawValue));
  }

  if (prop === "textColor") {
    const parsed = parseAdjustColorInputValue(rawValue);
    element.style.color = parsed ? parsed.css : "";
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
      normalizeFlexChildMargins(element);
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
    const persistedTarget = ensureAdjustLayerState(state.adjustTarget);
    const nextGap = clampNumber(rawValue, 0, 999, 0);
    if (persistedTarget) {
      persistedTarget.adjustStoredGap = nextGap;
    }
    if (getAdjustGapMode(state.adjustTarget) !== "gap") {
      applyAdjustGapMode("gap", { commit: false });
    }
    element.style.gap = `${nextGap}px`;
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
    element.style.borderRadius = `${normalizeAdjustBorderRadius(rawValue)}px`;
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
  syncAssociatedAdjustTargetsFromSource();
  if (sync) {
    syncAdjustPopoverFromTarget(state.adjustTarget);
  }
  renderSelectionAndHighlights();

  if (commit) {
    commitAdjustChanges();
  }
}
