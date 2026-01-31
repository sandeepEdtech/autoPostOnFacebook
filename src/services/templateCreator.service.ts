import { createCanvas } from "canvas";

export function createPostTemplate(text: string): Buffer {
  const W = 1080;
  const H = 1080;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  /* ===== BACKGROUND ===== */
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#667eea");
  bg.addColorStop(1, "#764ba2");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  /* ===== CARD ===== */
  const cardX = 120;
  const cardY = 220;
  const cardW = W - 240;
  const cardH = 520;

  ctx.fillStyle = "#ffffff";
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 40);
  ctx.fill();

  /* ===== QUOTE TEXT ===== */
  ctx.fillStyle = "#333333";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  let fontSize = 60;
  ctx.font = `700 ${fontSize}px Arial`;

  while (ctx.measureText(text).width > cardW - 160 && fontSize > 36) {
    fontSize -= 2;
    ctx.font = `700 ${fontSize}px Arial`;
  }

  wrapText(
    ctx,
    text,
    W / 2,
    cardY + cardH / 2,
    cardW - 160,
    fontSize * 1.4
  );

  /* ===== FOOTER ===== */
  ctx.font = "500 28px Arial";
  ctx.fillStyle = "#eeeeee";
  ctx.fillText("@YourBrand", W / 2, cardY + cardH + 80);

  return canvas.toBuffer("image/png");
}

/* ===== HELPERS ===== */

function drawRoundedRect(
  ctx: any,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(
  ctx: any,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const testLine = line + word + " ";
    if (ctx.measureText(testLine).width > maxWidth) {
      lines.push(line.trim());
      line = word + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());

  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => {
    ctx.fillText(l, x, startY + i * lineHeight);
  });
}
