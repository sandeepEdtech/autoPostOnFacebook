"use strict";
// import axios from "axios";
// import { env } from "../config/env";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAIImage = generateAIImage;
// const MODEL_URL =
//   "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5";
// async function callHF(prompt: string): Promise<Buffer> {
//   const response = await axios.post(
//     MODEL_URL,
//     {
//       inputs: prompt,
//       options: { wait_for_model: true }
//     },
//     {
//       headers: {
//         Authorization: `Bearer ${env.HF_API_KEY}`
//       },
//       responseType: "arraybuffer",
//       timeout: 120000
//     }
//   );
//   const contentType = response.headers["content-type"];
//   // HF returned JSON instead of image
//   if (!contentType || !contentType.includes("image")) {
//     const text = Buffer.from(response.data).toString("utf-8");
//     throw new Error(text);
//   }
//   return Buffer.from(response.data);
// }
// export async function generateAIImage(
//   prompt: string
// ): Promise<Buffer> {
//   try {
//     return await callHF(prompt);
//   } catch (err: any) {
//     // 🔁 retry once after delay (HF cold start)
//     if (err.message?.includes("loading")) {
//       console.log("HF model loading, retrying in 15s...");
//       await new Promise(res => setTimeout(res, 15000));
//       return await callHF(prompt);
//     }
//     throw err;
//   }
// }
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const MODEL_URL = "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5";
async function callHF(prompt) {
    const response = await axios_1.default.post(MODEL_URL, {
        inputs: prompt,
        options: { wait_for_model: true }
    }, {
        headers: {
            Authorization: `Bearer ${env_1.env.HF_API_KEY}`
        },
        responseType: "arraybuffer",
        timeout: 120000
    });
    const contentType = response.headers["content-type"];
    if (!contentType || !contentType.includes("image")) {
        const text = Buffer.from(response.data).toString("utf-8");
        throw new Error(text);
    }
    return Buffer.from(response.data);
}
async function generateAIImage(prompt) {
    try {
        return await callHF(prompt);
    }
    catch (err) {
        if (err.message?.includes("loading")) {
            console.log("HF model loading, retrying in 20s...");
            await new Promise(res => setTimeout(res, 20000));
            return await callHF(prompt);
        }
        throw err;
    }
}
