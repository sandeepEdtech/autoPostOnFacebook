"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateImage = generateImage;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
async function generateImage(prompt) {
    const response = await axios_1.default.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent', {
        contents: [
            {
                parts: [
                    {
                        text: prompt
                    }
                ]
            }
        ]
    }, {
        params: {
            key: env_1.env.GEMINI_API_KEY
        },
        headers: {
            'Content-Type': 'application/json'
        }
    });
    const parts = response.data?.candidates?.[0]?.content?.parts;
    if (!parts) {
        throw new Error('No content returned from Gemini');
    }
    const imagePart = parts.find((p) => p.inlineData && p.inlineData.data);
    if (!imagePart) {
        throw new Error('No image data returned from Gemini');
    }
    return imagePart.inlineData.data;
}
