type FocusImageLike = {
  focusX?: number;
  focusY?: number;
};

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value));
}

function parsePercent(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return clampPercent(value);
  }
  return fallback;
}

export function getImageObjectPosition(image: FocusImageLike | null | undefined, fallbackX = 50, fallbackY = 50) {
  const x = parsePercent(image?.focusX, fallbackX);
  const y = parsePercent(image?.focusY, fallbackY);
  return `${x}% ${y}%`;
}
