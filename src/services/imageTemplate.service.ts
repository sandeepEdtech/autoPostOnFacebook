import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";
import fs from "fs";
import { motivationalQuotes } from "../data/quotes";

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
  id: number;
  name: string;
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
  usedCount?: number;
  lastUsed?: Date;
}

// Store template usage history
let templateHistory: number[] = [];
const MAX_HISTORY = 10; // Keep last 10 templates in memory

// Templates array - 20 unique templates with same structure, different colors
const TEMPLATES: TemplateConfig[] = [
  // Original 5 templates
  {
    id: 1,
    name: "Purple Gradient",
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
    usedCount: 0,
  },
  {
    id: 2,
    name: "Dark Elegance",
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
    usedCount: 0,
  },
  {
    id: 3,
    name: "Clean White",
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
    usedCount: 0,
  },
  {
    id: 4,
    name: "Ocean Gradient",
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
    usedCount: 0,
  },
  {
    id: 5,
    name: "Minimal Black",
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
    usedCount: 0,
  },
  
  // New Gradient Templates (similar to 1 & 4)
  {
    id: 6,
    name: "Sunset Orange",
    bgColor: "linear-gradient(135deg, #FF512F 0%, #F09819 100%)",
    textColor: "#ffffff",
    fontSize: 48,
    fontFamily: "Montserrat, Arial",
    textX: 0.5,
    textY: 0.5,
    maxWidth: 0.8,
    lineHeight: 1.4,
    gradient: true,
    addWatermark: true,
    usedCount: 0,
  },
  {
    id: 7,
    name: "Deep Blue",
    bgColor: "linear-gradient(135deg, #0f0c29 0%, #302b63 100%)",
    textColor: "#ffffff",
    fontSize: 48,
    fontFamily: "Montserrat, Arial",
    textX: 0.5,
    textY: 0.5,
    maxWidth: 0.8,
    lineHeight: 1.4,
    gradient: true,
    addWatermark: true,
    usedCount: 0,
  },
  {
    id: 8,
    name: "Green Nature",
    bgColor: "linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)",
    textColor: "#2d3436",
    fontSize: 50,
    fontFamily: "Montserrat, Arial",
    textX: 0.5,
    textY: 0.5,
    maxWidth: 0.8,
    lineHeight: 1.4,
    gradient: true,
    addWatermark: false,
    usedCount: 0,
  },
  {
    id: 9,
    name: "Pink Love",
    bgColor: "linear-gradient(135deg, #ec008c 0%, #fc6767 100%)",
    textColor: "#ffffff",
    fontSize: 48,
    fontFamily: "Montserrat, Arial",
    textX: 0.5,
    textY: 0.5,
    maxWidth: 0.8,
    lineHeight: 1.4,
    gradient: true,
    addWatermark: true,
    usedCount: 0,
  },
  {
    id: 10,
    name: "Golden Sunset",
    bgColor: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
    textColor: "#2d3436",
    fontSize: 50,
    fontFamily: "Montserrat, Arial",
    textX: 0.5,
    textY: 0.5,
    maxWidth: 0.8,
    lineHeight: 1.4,
    gradient: true,
    addWatermark: false,
    usedCount: 0,
  },
  
  // New Dark Templates (similar to 2)
  {
    id: 11,
    name: "Dark Blue",
    bgColor: "#0a192f",
    textColor: "#64ffda",
    fontSize: 52,
    fontFamily: "Inter, Arial",
    textX: 0.5,
    textY: 0.4,
    maxWidth: 0.85,
    lineHeight: 1.5,
    gradient: false,
    addWatermark: false,
    usedCount: 0,
  },
  {
    id: 12,
    name: "Dark Purple",
    bgColor: "#1a1a2e",
    textColor: "#9d4edd",
    fontSize: 52,
    fontFamily: "Inter, Arial",
    textX: 0.5,
    textY: 0.4,
    maxWidth: 0.85,
    lineHeight: 1.5,
    gradient: false,
    addWatermark: false,
    usedCount: 0,
  },
  {
    id: 13,
    name: "Dark Green",
    bgColor: "#1a1a2e",
    textColor: "#4ade80",
    fontSize: 52,
    fontFamily: "Inter, Arial",
    textX: 0.5,
    textY: 0.4,
    maxWidth: 0.85,
    lineHeight: 1.5,
    gradient: false,
    addWatermark: false,
    usedCount: 0,
  },
  
  // New Light Templates (similar to 3 & 5)
  {
    id: 14,
    name: "Light Blue",
    bgColor: "#f0f8ff",
    textColor: "#1e40af",
    fontSize: 46,
    fontFamily: "Arial",
    textX: 0.5,
    textY: 0.45,
    maxWidth: 0.75,
    lineHeight: 1.3,
    gradient: false,
    addWatermark: true,
    usedCount: 0,
  },
  {
    id: 15,
    name: "Light Green",
    bgColor: "#f0fdf4",
    textColor: "#166534",
    fontSize: 46,
    fontFamily: "Arial",
    textX: 0.5,
    textY: 0.45,
    maxWidth: 0.75,
    lineHeight: 1.3,
    gradient: false,
    addWatermark: true,
    usedCount: 0,
  },
  {
    id: 16,
    name: "Light Purple",
    bgColor: "#faf5ff",
    textColor: "#7c3aed",
    fontSize: 46,
    fontFamily: "Arial",
    textX: 0.5,
    textY: 0.45,
    maxWidth: 0.75,
    lineHeight: 1.3,
    gradient: false,
    addWatermark: true,
    usedCount: 0,
  },
  {
    id: 17,
    name: "Light Pink",
    bgColor: "#fdf2f8",
    textColor: "#be185d",
    fontSize: 46,
    fontFamily: "Arial",
    textX: 0.5,
    textY: 0.45,
    maxWidth: 0.75,
    lineHeight: 1.3,
    gradient: false,
    addWatermark: true,
    usedCount: 0,
  },
  {
    id: 18,
    name: "Light Gray",
    bgColor: "#f9fafb",
    textColor: "#374151",
    fontSize: 46,
    fontFamily: "Arial",
    textX: 0.5,
    textY: 0.45,
    maxWidth: 0.75,
    lineHeight: 1.3,
    gradient: false,
    addWatermark: true,
    usedCount: 0,
  },
  
  // New Solid Color Templates
  {
    id: 19,
    name: "Solid Blue",
    bgColor: "#3b82f6",
    textColor: "#ffffff",
    fontSize: 54,
    fontFamily: "Montserrat, Arial",
    textX: 0.5,
    textY: 0.5,
    maxWidth: 0.8,
    lineHeight: 1.4,
    gradient: false,
    addWatermark: true,
    usedCount: 0,
  },
  {
    id: 20,
    name: "Solid Green",
    bgColor: "#10b981",
    textColor: "#ffffff",
    fontSize: 54,
    fontFamily: "Montserrat, Arial",
    textX: 0.5,
    textY: 0.5,
    maxWidth: 0.8,
    lineHeight: 1.4,
    gradient: false,
    addWatermark: true,
    usedCount: 0,
  },
];

// Function to get least recently used template
function getLeastUsedTemplate(): TemplateConfig {
  // Sort templates by usedCount and lastUsed
  const sortedTemplates = [...TEMPLATES].sort((a, b) => {
    // First prioritize by usedCount
    if (a.usedCount !== b.usedCount) {
      return a.usedCount! - b.usedCount!;
    }
    // Then by lastUsed (older first)
    if (a.lastUsed && b.lastUsed) {
      return new Date(a.lastUsed).getTime() - new Date(b.lastUsed).getTime();
    }
    // If no lastUsed, random
    return Math.random() - 0.5;
  });
  
  return sortedTemplates[0];
}

// Function to get template avoiding recent ones
function getNonRepeatingTemplate(): TemplateConfig {
  // Get templates not used in last MAX_HISTORY posts
  const recentTemplates = templateHistory.slice(-MAX_HISTORY);
  const availableTemplates = TEMPLATES.filter(t => !recentTemplates.includes(t.id));
  
  if (availableTemplates.length > 0) {
    // Randomly select from available templates
    const randomIndex = Math.floor(Math.random() * availableTemplates.length);
    return availableTemplates[randomIndex];
  }
  
  // If all templates have been used recently, get the least used one
  return getLeastUsedTemplate();
}

// Update template usage
function updateTemplateUsage(templateId: number): void {
  // Add to history
  templateHistory.push(templateId);
  
  // Keep history limited
  if (templateHistory.length > MAX_HISTORY * 2) {
    templateHistory = templateHistory.slice(-MAX_HISTORY);
  }
  
  // Update template stats
  const template = TEMPLATES.find(t => t.id === templateId);
  if (template) {
    template.usedCount = (template.usedCount || 0) + 1;
    template.lastUsed = new Date();
  }
}

export async function createImageFromTemplate(
  text: string
): Promise<Buffer> {
  // Get non-repeating template
  const templateType = getNonRepeatingTemplate();
  console.log(`🎨 Using template: ${templateType.name} (ID: ${templateType.id})`);
  
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
  
  // Update usage stats
  updateTemplateUsage(templateType.id);

  return canvas.toBuffer("image/png");
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
    } else if (template.bgColor.includes("#FF512F")) {
      gradient.addColorStop(0, "#FF512F");
      gradient.addColorStop(1, "#F09819");
    } else if (template.bgColor.includes("#0f0c29")) {
      gradient.addColorStop(0, "#0f0c29");
      gradient.addColorStop(0.5, "#302b63");
      gradient.addColorStop(1, "#24243e");
    } else if (template.bgColor.includes("#56ab2f")) {
      gradient.addColorStop(0, "#56ab2f");
      gradient.addColorStop(1, "#a8e063");
    } else if (template.bgColor.includes("#ec008c")) {
      gradient.addColorStop(0, "#ec008c");
      gradient.addColorStop(1, "#fc6767");
    } else if (template.bgColor.includes("#FFD700")) {
      gradient.addColorStop(0, "#FFD700");
      gradient.addColorStop(1, "#FFA500");
    }
    
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = template.bgColor || "#ffffff";
  }
  
  ctx.fillRect(0, 0, width, height);
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

// Utility function to get quotes
export async function getRandomQuote(): Promise<string> {
  try {
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    const randomQuote = motivationalQuotes[randomIndex];
    
    // Remove quotes if already present
    const cleanQuote = randomQuote.replace(/^"|"$/g, '');
    
    // Add quotes for image display
    return `"${cleanQuote}"`;
  } catch (error) {
    console.error("Error picking random quote:", error);
    return `"The only way to do great work is to love what you do."`;
  }
}

// Get template statistics
export function getTemplateStats(): any {
  return {
    totalTemplates: TEMPLATES.length,
    templates: TEMPLATES.map(t => ({
      id: t.id,
      name: t.name,
      usedCount: t.usedCount || 0,
      lastUsed: t.lastUsed,
    })),
    recentHistory: templateHistory.slice(-10)
  };
}

// Reset template usage (for testing or maintenance)
export function resetTemplateUsage(): void {
  TEMPLATES.forEach(t => {
    t.usedCount = 0;
    t.lastUsed = undefined;
  });
  templateHistory = [];
}
// import { createCanvas, loadImage, registerFont } from "canvas";
// import path from "path";
// import fs from "fs";
// import { motivationalQuotes } from "../data/quotes";

// // Register fonts if available
// try {
//   registerFont(path.join(__dirname, "../fonts/Montserrat-Bold.ttf"), {
//     family: "Montserrat",
//     weight: "bold",
//   });
//   registerFont(path.join(__dirname, "../fonts/Inter-Regular.ttf"), {
//     family: "Inter",
//   });
// } catch (err) {
//   console.log("Using default fonts");
// }

// interface TemplateConfig {
//   bgColor?: string;
//   textColor?: string;
//   fontSize?: number;
//   fontFamily?: string;
//   textX?: number;
//   textY?: number;
//   maxWidth?: number;
//   lineHeight?: number;
//   gradient?: boolean;
//   addWatermark?: boolean;
// }

// export async function createImageFromTemplate(
//   text: string
// ): Promise<Buffer> {
//   // Random template selection
//   const templateType = getRandomTemplateType();
  
//   // Canvas dimensions (Instagram/Facebook optimized)
//   const width = 1080;
//   const height = 1080;
  
//   const canvas = createCanvas(width, height);
//   const ctx = canvas.getContext("2d");

//   // Create template based on type
//   await drawTemplate(ctx, width, height, templateType);
  
//   // Add text with appropriate styling
//   drawText(ctx, text, width, height, templateType);
  
//   // Add watermark/logo if needed
//   if (templateType.addWatermark) {
//     await addWatermark(ctx, width, height);
//   }

//   return canvas.toBuffer("image/png");
// }

// function getRandomTemplateType(): TemplateConfig {
//   const templates: TemplateConfig[] = [
//     // Gradient template
//     {
//       bgColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
//       textColor: "#ffffff",
//       fontSize: 48,
//       fontFamily: "Montserrat, Arial",
//       textX: 0.5,
//       textY: 0.5,
//       maxWidth: 0.8,
//       lineHeight: 1.4,
//       gradient: true,
//       addWatermark: true,
//     },
//     // Dark template
//     {
//       bgColor: "#1a1a2e",
//       textColor: "#e94560",
//       fontSize: 52,
//       fontFamily: "Inter, Arial",
//       textX: 0.5,
//       textY: 0.4,
//       maxWidth: 0.85,
//       lineHeight: 1.5,
//       gradient: false,
//       addWatermark: false,
//     },
//     // Light template
//     {
//       bgColor: "#f8f9fa",
//       textColor: "#212529",
//       fontSize: 46,
//       fontFamily: "Arial",
//       textX: 0.5,
//       textY: 0.45,
//       maxWidth: 0.75,
//       lineHeight: 1.3,
//       gradient: false,
//       addWatermark: true,
//     },
//     // Nature inspired
//     {
//       bgColor: "linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)",
//       textColor: "#2d3436",
//       fontSize: 50,
//       fontFamily: "Montserrat, Arial",
//       textX: 0.5,
//       textY: 0.5,
//       maxWidth: 0.8,
//       lineHeight: 1.4,
//       gradient: true,
//       addWatermark: false,
//     },
//     // Minimal template
//     {
//       bgColor: "#ffffff",
//       textColor: "#000000",
//       fontSize: 44,
//       fontFamily: "Arial",
//       textX: 0.5,
//       textY: 0.5,
//       maxWidth: 0.7,
//       lineHeight: 1.6,
//       gradient: false,
//       addWatermark: true,
//     },
//   ];

//   return templates[Math.floor(Math.random() * templates.length)];
// }

// async function drawTemplate(
//   ctx: any,
//   width: number,
//   height: number,
//   template: TemplateConfig
// ): Promise<void> {
//   // Background
//   if (template.gradient && template.bgColor?.includes("gradient")) {
//     const gradient = ctx.createLinearGradient(0, 0, width, height);
    
//     if (template.bgColor.includes("#667eea")) {
//       gradient.addColorStop(0, "#667eea");
//       gradient.addColorStop(1, "#764ba2");
//     } else if (template.bgColor.includes("#84fab0")) {
//       gradient.addColorStop(0, "#84fab0");
//       gradient.addColorStop(1, "#8fd3f4");
//     }
    
//     ctx.fillStyle = gradient;
//   } else {
//     ctx.fillStyle = template.bgColor || "#ffffff";
//   }
  
//   ctx.fillRect(0, 0, width, height);

//   // Add decorative elements
//   drawDecorativeElements(ctx, width, height, template);
// }

// function drawDecorativeElements(
//   ctx: any,
//   width: number,
//   height: number,
//   template: TemplateConfig
// ): void {
//   ctx.save();
  
//   // Draw circles/patterns based on template
//   if (template.bgColor === "#1a1a2e") {
//     // Dark template - stars
//     ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
//     for (let i = 0; i < 50; i++) {
//       const x = Math.random() * width;
//       const y = Math.random() * height;
//       const radius = Math.random() * 2;
//       ctx.beginPath();
//       ctx.arc(x, y, radius, 0, Math.PI * 2);
//       ctx.fill();
//     }
//   } else if (template.gradient) {
//     // Gradient template - overlay pattern
//     ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
//     for (let i = 0; i < width; i += 40) {
//       for (let j = 0; j < height; j += 40) {
//         ctx.fillRect(i, j, 20, 20);
//       }
//     }
//   }
  
//   ctx.restore();
// }

// function drawText(
//   ctx: any,
//   text: string,
//   width: number,
//   height: number,
//   template: TemplateConfig
// ): void {
//   ctx.save();
  
//   // Text style
//   ctx.fillStyle = template.textColor || "#000000";
//   ctx.font = `bold ${template.fontSize}px ${template.fontFamily}`;
//   ctx.textAlign = "center";
//   ctx.textBaseline = "middle";

//   // Calculate position
//   const x = width * (template.textX || 0.5);
//   const y = height * (template.textY || 0.5);
//   const maxWidth = width * (template.maxWidth || 0.8);
//   const lineHeight = template.fontSize! * (template.lineHeight || 1.4);

//   // Wrap text
//   const lines = wrapText(ctx, text, maxWidth);
  
//   // Draw text with shadow for better readability
//   ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
//   ctx.shadowBlur = 10;
//   ctx.shadowOffsetX = 2;
//   ctx.shadowOffsetY = 2;

//   // Draw each line
//   const startY = y - ((lines.length - 1) * lineHeight) / 2;
//   lines.forEach((line, index) => {
//     ctx.fillText(line, x, startY + index * lineHeight);
//   });

//   // Add author/quote mark if it's a quote
//   if (text.includes('"')) {
//     ctx.shadowBlur = 5;
//     ctx.font = `italic ${template.fontSize! * 0.6}px ${template.fontFamily}`;
//     ctx.fillText("― Daily Motivation", x, startY + lines.length * lineHeight + 30);
//   }

//   ctx.restore();
// }

// function wrapText(ctx: any, text: string, maxWidth: number): string[] {
//   const words = text.split(" ");
//   const lines: string[] = [];
//   let currentLine = words[0];

//   for (let i = 1; i < words.length; i++) {
//     const word = words[i];
//     const width = ctx.measureText(currentLine + " " + word).width;
//     if (width < maxWidth) {
//       currentLine += " " + word;
//     } else {
//       lines.push(currentLine);
//       currentLine = word;
//     }
//   }
//   lines.push(currentLine);
//   return lines;
// }

// async function addWatermark(ctx: any, width: number, height: number): Promise<void> {
//   ctx.save();
//   ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
//   ctx.font = "20px Arial";
//   ctx.textAlign = "right";
//   ctx.textBaseline = "bottom";
//   ctx.fillText("@MotivationDaily", width - 20, height - 20);
//   ctx.restore();
// }

// // Utility function to get quotes from free API
// export async function getRandomQuote(): Promise<string> {
//   try {
//     // 1. Pick a random index from the array
//     const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
//     const randomQuote = motivationalQuotes[randomIndex];

//     // 2. Ensure the quote is wrapped in clean quotes for the image overlay
//     // If the string already has quotes, we return it; otherwise, we add them.
//     if (randomQuote.startsWith('"')) {
//       return randomQuote;
//     }

//     return `"${randomQuote}"`;
//   } catch (error) {
//     console.error("Error picking random quote:", error);
//     // Absolute fallback in case the array is empty or undefined
//     return `"The only way to do great work is to love what you do."`;
//   }
// }


// // import { createCanvas, loadImage } from "canvas";
// // import path from "path";

// // export async function createImageFromTemplate(
// //   templateName: string,
// //   text: string
// // ): Promise<Buffer> {
// //   const templatePath = path.join(
// //     __dirname,
// //     `../templates/${templateName}.png`
// //   );

// //   const template = await loadImage(templatePath);

// //   const canvas = createCanvas(template.width, template.height);
// //   const ctx = canvas.getContext("2d");

// //   // Draw template
// //   ctx.drawImage(template, 0, 0);

// //   // -------- TEXT SAFE AREA (IMPORTANT) --------
// //   const boxX = template.width * 0.1;
// //   const boxY = template.height * 0.15;
// //   const boxWidth = template.width * 0.8;
// //   const boxHeight = template.height * 0.3;

// //   // Text style
// //   ctx.fillStyle = "#ffffff";
// //   ctx.textAlign = "center";
// //   ctx.textBaseline = "middle";

// //   // Dynamically adjust font size
// //   let fontSize = 56;
// //   ctx.font = `bold ${fontSize}px Arial`;

// //   while (
// //     ctx.measureText(text).width > boxWidth &&
// //     fontSize > 28
// //   ) {
// //     fontSize -= 2;
// //     ctx.font = `bold ${fontSize}px Arial`;
// //   }

// //   drawWrappedText(
// //     ctx,
// //     text,
// //     boxX + boxWidth / 2,
// //     boxY + boxHeight / 2,
// //     boxWidth,
// //     fontSize * 1.4
// //   );

// //   return canvas.toBuffer("image/png");
// // }

// // function drawWrappedText(
// //   ctx: any,
// //   text: string,
// //   x: number,
// //   y: number,
// //   maxWidth: number,
// //   lineHeight: number
// // ) {
// //   const words = text.split(" ");
// //   const lines: string[] = [];
// //   let line = "";

// //   for (const word of words) {
// //     const testLine = line + word + " ";
// //     if (ctx.measureText(testLine).width > maxWidth) {
// //       lines.push(line.trim());
// //       line = word + " ";
// //     } else {
// //       line = testLine;
// //     }
// //   }
// //   lines.push(line.trim());

// //   const startY = y - ((lines.length - 1) * lineHeight) / 2;

// //   lines.forEach((l, i) => {
// //     ctx.fillText(l, x, startY + i * lineHeight);
// //   });
// // }
