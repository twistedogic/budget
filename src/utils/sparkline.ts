/**
 * Draw a mini sparkline on a canvas element.
 * Canvas should be 80×24 px (or whatever is set in HTML).
 */
export function drawSparkline(
  canvas: HTMLCanvasElement,
  data: number[],
  color = '#f59e0b',
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Respect device pixel ratio for crisp rendering
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.offsetWidth || canvas.width;
  const H = canvas.offsetHeight || canvas.height;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, W, H);

  if (data.length === 0 || data.every((v) => v === 0)) {
    // Draw flat baseline
    ctx.beginPath();
    ctx.moveTo(0, H * 0.9);
    ctx.lineTo(W, H * 0.9);
    ctx.strokeStyle = color + '44';
    ctx.lineWidth = 1;
    ctx.stroke();
    return;
  }

  const max = Math.max(...data, 1);
  const padTop = 2;
  const padBottom = 2;
  const effectiveH = H - padTop - padBottom;

  const points = data.map((v, i) => ({
    x: data.length === 1 ? W / 2 : (i / (data.length - 1)) * W,
    y: padTop + effectiveH - (v / max) * effectiveH,
  }));

  // Fill gradient
  const grad = ctx.createLinearGradient(0, padTop, 0, H);
  grad.addColorStop(0, color + '55');
  grad.addColorStop(1, color + '00');

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    // Smooth curve via control points
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    ctx.bezierCurveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y);
  }
  ctx.lineTo(points[points.length - 1].x, H);
  ctx.lineTo(points[0].x, H);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Stroke line
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    ctx.bezierCurveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.stroke();
}
