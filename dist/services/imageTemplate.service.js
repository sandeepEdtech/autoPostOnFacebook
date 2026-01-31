"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createImageFromTemplate = createImageFromTemplate;
const canvas_1 = require("canvas");
const path_1 = __importDefault(require("path"));
async function createImageFromTemplate(templateName, text) {
    const templatePath = path_1.default.join(__dirname, `../templates/${templateName}.png`);
    const template = await (0, canvas_1.loadImage)(templatePath);
    const canvas = (0, canvas_1.createCanvas)(template.width, template.height);
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
    while (ctx.measureText(text).width > boxWidth &&
        fontSize > 28) {
        fontSize -= 2;
        ctx.font = `bold ${fontSize}px Arial`;
    }
    drawWrappedText(ctx, text, boxX + boxWidth / 2, boxY + boxHeight / 2, boxWidth, fontSize * 1.4);
    return canvas.toBuffer("image/png");
}
function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    const lines = [];
    let line = "";
    for (const word of words) {
        const testLine = line + word + " ";
        if (ctx.measureText(testLine).width > maxWidth) {
            lines.push(line.trim());
            line = word + " ";
        }
        else {
            line = testLine;
        }
    }
    lines.push(line.trim());
    const startY = y - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((l, i) => {
        ctx.fillText(l, x, startY + i * lineHeight);
    });
}
