import { createCanvas, loadImage } from "canvas";
import path from "path";

export async function createImageFromTemplate(
  templateName: string,
  text: string
): Promise<Buffer> {
  const templatePath = path.join(
    __dirname,
    `../templates/${templateName}.png`
  );

  const template = await loadImage(templatePath);

  const canvas = createCanvas(template.width, template.height);
  const ctx = canvas.getContext("2d");

  // Draw template
  ctx.drawImage(template, 0, 0);

  // -------- TEXT SAFE AREA (IMPORTANT) --------
  const boxX = template.width * 0.1;
  const boxY = template.height * 0.15;
  const boxWidth = template.width * 0.8;
  const boxHeight = template.height * 0.3;

  // Text style
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Dynamically adjust font size
  let fontSize = 56;
  ctx.font = `bold ${fontSize}px Arial`;

  while (
    ctx.measureText(text).width > boxWidth &&
    fontSize > 28
  ) {
    fontSize -= 2;
    ctx.font = `bold ${fontSize}px Arial`;
  }

  drawWrappedText(
    ctx,
    text,
    boxX + boxWidth / 2,
    boxY + boxHeight / 2,
    boxWidth,
    fontSize * 1.4
  );

  return canvas.toBuffer("image/png");
}

function drawWrappedText(
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
