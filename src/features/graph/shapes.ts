import type { NodeShape } from '@/lib/entities';

/** Traces a node shape as a path. Sized so that all shapes have similar visual weight. */
export function tracePath(ctx: CanvasRenderingContext2D, shape: NodeShape, x: number, y: number, r: number) {
  ctx.beginPath();
  switch (shape) {
    case 'circle':
      ctx.arc(x, y, r, 0, Math.PI * 2);
      break;
    case 'square': {
      const s = r * 0.88;
      ctx.roundRect(x - s, y - s, s * 2, s * 2, r * 0.25);
      break;
    }
    case 'diamond': {
      const s = r * 1.25;
      ctx.moveTo(x, y - s);
      ctx.lineTo(x + s, y);
      ctx.lineTo(x, y + s);
      ctx.lineTo(x - s, y);
      ctx.closePath();
      break;
    }
    case 'triangle': {
      const s = r * 1.3;
      ctx.moveTo(x, y - s);
      ctx.lineTo(x + s * 0.95, y + s * 0.72);
      ctx.lineTo(x - s * 0.95, y + s * 0.72);
      ctx.closePath();
      break;
    }
    case 'hexagon': {
      const s = r * 1.12;
      for (let i = 0; i < 6; i += 1) {
        const angle = Math.PI / 6 + (i * Math.PI) / 3;
        const px = x + s * Math.cos(angle);
        const py = y + s * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    }
    case 'star': {
      const outer = r * 1.4;
      const inner = r * 0.55;
      for (let i = 0; i < 8; i += 1) {
        const radius = i % 2 === 0 ? outer : inner;
        const angle = -Math.PI / 2 + (i * Math.PI) / 4;
        const px = x + radius * Math.cos(angle);
        const py = y + radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    }
  }
}
