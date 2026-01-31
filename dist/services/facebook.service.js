"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postToFacebookPage = postToFacebookPage;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const GRAPH_URL = "https://graph.facebook.com/v19.0";
async function postToFacebookPage(imageUrl, caption) {
    const res = await axios_1.default.post(`${GRAPH_URL}/${env_1.env.FB_PAGE_ID}/photos`, {
        url: imageUrl,
        caption,
        access_token: env_1.env.FB_PAGE_TOKEN
    });
    return res.data;
}
