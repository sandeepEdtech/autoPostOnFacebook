"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.env = {
    PORT: process.env.PORT || 5000,
    MONGO_URI: process.env.MONGO_URI,
    // Gemini
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_IMAGE_URL: process.env.GEMINI_IMAGE_URL,
    // OpenAI
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    HF_API_KEY: process.env.HF_API_KEY || "",
    // Cloudinary
    CLOUDINARY_NAME: process.env.CLOUDINARY_NAME,
    CLOUDINARY_KEY: process.env.CLOUDINARY_KEY,
    CLOUDINARY_SECRET: process.env.CLOUDINARY_SECRET,
    // Buffer
    BUFFER_TOKEN: process.env.BUFFER_TOKEN,
    // ✅ FACEBOOK (NEW — THIS FIXES YOUR ERROR)
    FB_PAGE_ID: process.env.FB_PAGE_ID || "",
    FB_PAGE_TOKEN: process.env.FB_PAGE_TOKEN || ""
};
