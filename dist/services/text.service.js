"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMotivationalText = generateMotivationalText;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
async function generateMotivationalText() {
    const res = await axios_1.default.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
        contents: [
            {
                parts: [
                    {
                        text: 'Write one short motivational quote (max 15 words) for social media'
                    }
                ]
            }
        ]
    }, {
        params: { key: env_1.env.GEMINI_API_KEY },
        headers: { 'Content-Type': 'application/json' }
    });
    return res.data.candidates[0].content.parts[0].text;
}
