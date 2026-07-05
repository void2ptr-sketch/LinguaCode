export type CanvasPoint = {
  x: number;
  y: number;
};

export type CalligraphyPaintOptions = {
  baseWidth: number;
  color: string;
  alpha?: number;
  taper?: boolean;
};

/** Рисует штрих с сужением к концам — ближе к кисти, чем uniform lineTo. */
export function paintCalligraphyPolyline(
  context: CanvasRenderingContext2D,
  points: readonly CanvasPoint[],
  options: CalligraphyPaintOptions,
): void {
  if (points.length === 0) {
    return;
  }

  const alpha = options.alpha ?? 1;
  const taper = options.taper ?? true;

  context.save();
  context.globalAlpha = alpha;
  context.strokeStyle = options.color;
  context.fillStyle = options.color;
  context.lineCap = 'round';
  context.lineJoin = 'round';

  if (points.length === 1) {
    const radius = options.baseWidth * 0.45;
    context.beginPath();
    context.arc(points[0].x, points[0].y, radius, 0, Math.PI * 2);
    context.fill();
    context.restore();
    return;
  }

  const smoothed = smoothPolyline(points);
  const cumulative = buildCumulativeLengths(smoothed);
  const totalLength = cumulative.at(-1) ?? 0;

  if (totalLength <= 0) {
    context.restore();
    return;
  }

  for (let index = 1; index < smoothed.length; index += 1) {
    const start = smoothed[index - 1];
    const end = smoothed[index];
    const midT = ((cumulative[index - 1] ?? 0) + (cumulative[index] ?? 0)) / (2 * totalLength);
    const width = taper ? resolveTaperedWidth(options.baseWidth, midT) : options.baseWidth;

    context.lineWidth = width;
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
  }

  context.restore();
}

function smoothPolyline(points: readonly CanvasPoint[]): CanvasPoint[] {
  if (points.length <= 2) {
    return [...points];
  }

  const smoothed: CanvasPoint[] = [points[0]];
  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const next = points[index + 1];
    smoothed.push({
      x: (previous.x + current.x * 2 + next.x) / 4,
      y: (previous.y + current.y * 2 + next.y) / 4,
    });
  }

  smoothed.push(points.at(-1)!);
  return smoothed;
}

function buildCumulativeLengths(points: readonly CanvasPoint[]): number[] {
  const lengths = [0];
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    lengths.push(lengths[index - 1]! + Math.hypot(current.x - previous.x, current.y - previous.y));
  }

  return lengths;
}

function resolveTaperedWidth(baseWidth: number, progress: number): number {
  const edge = Math.min(progress, 1 - progress) * 2;
  return baseWidth * (0.28 + 0.72 * edge);
}
