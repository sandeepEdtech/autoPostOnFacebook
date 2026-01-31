import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";
import fs from "fs";

// Register fonts if available
try {
  registerFont(path.join(__dirname, "../fonts/Montserrat-Bold.ttf"), {
    family: "Montserrat",
    weight: "bold",
  });
  registerFont(path.join(__dirname, "../fonts/Inter-Regular.ttf"), {
    family: "Inter",
  });
} catch (err) {
  console.log("Using default fonts");
}

interface TemplateConfig {
  bgColor?: string;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  textX?: number;
  textY?: number;
  maxWidth?: number;
  lineHeight?: number;
  gradient?: boolean;
  addWatermark?: boolean;
}

export async function createImageFromTemplate(
  text: string
): Promise<Buffer> {
  // Random template selection
  const templateType = getRandomTemplateType();
  
  // Canvas dimensions (Instagram/Facebook optimized)
  const width = 1080;
  const height = 1080;
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Create template based on type
  await drawTemplate(ctx, width, height, templateType);
  
  // Add text with appropriate styling
  drawText(ctx, text, width, height, templateType);
  
  // Add watermark/logo if needed
  if (templateType.addWatermark) {
    await addWatermark(ctx, width, height);
  }

  return canvas.toBuffer("image/png");
}

function getRandomTemplateType(): TemplateConfig {
  const templates: TemplateConfig[] = [
    // Gradient template
    {
      bgColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      textColor: "#ffffff",
      fontSize: 48,
      fontFamily: "Montserrat, Arial",
      textX: 0.5,
      textY: 0.5,
      maxWidth: 0.8,
      lineHeight: 1.4,
      gradient: true,
      addWatermark: true,
    },
    // Dark template
    {
      bgColor: "#1a1a2e",
      textColor: "#e94560",
      fontSize: 52,
      fontFamily: "Inter, Arial",
      textX: 0.5,
      textY: 0.4,
      maxWidth: 0.85,
      lineHeight: 1.5,
      gradient: false,
      addWatermark: false,
    },
    // Light template
    {
      bgColor: "#f8f9fa",
      textColor: "#212529",
      fontSize: 46,
      fontFamily: "Arial",
      textX: 0.5,
      textY: 0.45,
      maxWidth: 0.75,
      lineHeight: 1.3,
      gradient: false,
      addWatermark: true,
    },
    // Nature inspired
    {
      bgColor: "linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)",
      textColor: "#2d3436",
      fontSize: 50,
      fontFamily: "Montserrat, Arial",
      textX: 0.5,
      textY: 0.5,
      maxWidth: 0.8,
      lineHeight: 1.4,
      gradient: true,
      addWatermark: false,
    },
    // Minimal template
    {
      bgColor: "#ffffff",
      textColor: "#000000",
      fontSize: 44,
      fontFamily: "Arial",
      textX: 0.5,
      textY: 0.5,
      maxWidth: 0.7,
      lineHeight: 1.6,
      gradient: false,
      addWatermark: true,
    },
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

async function drawTemplate(
  ctx: any,
  width: number,
  height: number,
  template: TemplateConfig
): Promise<void> {
  // Background
  if (template.gradient && template.bgColor?.includes("gradient")) {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    
    if (template.bgColor.includes("#667eea")) {
      gradient.addColorStop(0, "#667eea");
      gradient.addColorStop(1, "#764ba2");
    } else if (template.bgColor.includes("#84fab0")) {
      gradient.addColorStop(0, "#84fab0");
      gradient.addColorStop(1, "#8fd3f4");
    }
    
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = template.bgColor || "#ffffff";
  }
  
  ctx.fillRect(0, 0, width, height);

  // Add decorative elements
  drawDecorativeElements(ctx, width, height, template);
}

function drawDecorativeElements(
  ctx: any,
  width: number,
  height: number,
  template: TemplateConfig
): void {
  ctx.save();
  
  // Draw circles/patterns based on template
  if (template.bgColor === "#1a1a2e") {
    // Dark template - stars
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = Math.random() * 2;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (template.gradient) {
    // Gradient template - overlay pattern
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    for (let i = 0; i < width; i += 40) {
      for (let j = 0; j < height; j += 40) {
        ctx.fillRect(i, j, 20, 20);
      }
    }
  }
  
  ctx.restore();
}

function drawText(
  ctx: any,
  text: string,
  width: number,
  height: number,
  template: TemplateConfig
): void {
  ctx.save();
  
  // Text style
  ctx.fillStyle = template.textColor || "#000000";
  ctx.font = `bold ${template.fontSize}px ${template.fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Calculate position
  const x = width * (template.textX || 0.5);
  const y = height * (template.textY || 0.5);
  const maxWidth = width * (template.maxWidth || 0.8);
  const lineHeight = template.fontSize! * (template.lineHeight || 1.4);

  // Wrap text
  const lines = wrapText(ctx, text, maxWidth);
  
  // Draw text with shadow for better readability
  ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  // Draw each line
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => {
    ctx.fillText(line, x, startY + index * lineHeight);
  });

  // Add author/quote mark if it's a quote
  if (text.includes('"')) {
    ctx.shadowBlur = 5;
    ctx.font = `italic ${template.fontSize! * 0.6}px ${template.fontFamily}`;
    ctx.fillText("― Daily Motivation", x, startY + lines.length * lineHeight + 30);
  }

  ctx.restore();
}

function wrapText(ctx: any, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

async function addWatermark(ctx: any, width: number, height: number): Promise<void> {
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = "20px Arial";
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText("@MotivationDaily", width - 20, height - 20);
  ctx.restore();
}

// Utility function to get quotes from free API
export async function getRandomQuote(): Promise<string> {
  try {
    // Free quote API options
    const apiUrls = [
      "https://api.quotable.io/random",
      "https://zenquotes.io/api/random",
      "https://type.fit/api/quotes",
    ];

    const response = await fetch(apiUrls[0]);
    const data = await response.json();
    
    if (data.content) {
      return `"${data.content}"`;
    }
    
    return `"The only way to do great work is to love what you do."`;
  } catch (error) {
    // Fallback quotes
    const fallbackQuotes = [
      "Success is not final, failure is not fatal: it is the courage to continue that counts.",
      "The future depends on what you do today.",
      "Don't watch the clock; do what it does. Keep going.",
      "The only limit to our realization of tomorrow will be our doubts of today.",
      "It always seems impossible until it's done.",
    ];
    
    return `"${fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)]}"`;
  }
}


// import { createCanvas, loadImage } from "canvas";
// import path from "path";

// export async function createImageFromTemplate(
//   templateName: string,
//   text: string
// ): Promise<Buffer> {
//   const templatePath = path.join(
//     __dirname,
//     `../templates/${templateName}.png`
//   );

//   const template = await loadImage(templatePath);

//   const canvas = createCanvas(template.width, template.height);
//   const ctx = canvas.getContext("2d");

//   // Draw template
//   ctx.drawImage(template, 0, 0);

//   // -------- TEXT SAFE AREA (IMPORTANT) --------
//   const boxX = template.width * 0.1;
//   const boxY = template.height * 0.15;
//   const boxWidth = template.width * 0.8;
//   const boxHeight = template.height * 0.3;

//   // Text style
//   ctx.fillStyle = "#ffffff";
//   ctx.textAlign = "center";
//   ctx.textBaseline = "middle";

//   // Dynamically adjust font size
//   let fontSize = 56;
//   ctx.font = `bold ${fontSize}px Arial`;

//   while (
//     ctx.measureText(text).width > boxWidth &&
//     fontSize > 28
//   ) {
//     fontSize -= 2;
//     ctx.font = `bold ${fontSize}px Arial`;
//   }

//   drawWrappedText(
//     ctx,
//     text,
//     boxX + boxWidth / 2,
//     boxY + boxHeight / 2,
//     boxWidth,
//     fontSize * 1.4
//   );

//   return canvas.toBuffer("image/png");
// }

// function drawWrappedText(
//   ctx: any,
//   text: string,
//   x: number,
//   y: number,
//   maxWidth: number,
//   lineHeight: number
// ) {
//   const words = text.split(" ");
//   const lines: string[] = [];
//   let line = "";

//   for (const word of words) {
//     const testLine = line + word + " ";
//     if (ctx.measureText(testLine).width > maxWidth) {
//       lines.push(line.trim());
//       line = word + " ";
//     } else {
//       line = testLine;
//     }
//   }
//   lines.push(line.trim());

//   const startY = y - ((lines.length - 1) * lineHeight) / 2;

//   lines.forEach((l, i) => {
//     ctx.fillText(l, x, startY + i * lineHeight);
//   });
// }
