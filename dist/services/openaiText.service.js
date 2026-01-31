"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQuote = generateQuote;
const openai_1 = __importDefault(require("openai"));
const env_1 = require("../config/env");
if (!env_1.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing in .env");
}
const client = new openai_1.default({
    apiKey: env_1.env.OPENAI_API_KEY
});
async function generateQuote() {
    const prompt = "Write a short motivational quote (max 15 words) for Instagram.";
    const response = await client.responses.create({
        model: "gpt-4.1-mini",
        input: prompt,
        max_output_tokens: 50
    });
    const text = response.output_text;
    if (!text) {
        throw new Error("No text returned from OpenAI");
    }
    return text.trim();
}
