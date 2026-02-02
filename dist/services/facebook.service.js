"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postImageDirectlyToFacebook = postImageDirectlyToFacebook;
exports.postToInstagram = postToInstagram;
exports.postToBothPlatforms = postToBothPlatforms;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const form_data_1 = __importDefault(require("form-data"));
const env_1 = require("../config/env");
// Use environment variables for these
const PAGE_ACCESS_TOKEN = env_1.env.FB_PAGE_TOKEN;
const PAGE_ID = env_1.env.FB_PAGE_ID;
async function postImageDirectlyToFacebook(imagePath, caption) {
    console.log(PAGE_ACCESS_TOKEN, PAGE_ID, "we are consoling ");
    if (!PAGE_ACCESS_TOKEN || !PAGE_ID) {
        throw new Error("Facebook credentials not configured");
    }
    const formData = new form_data_1.default();
    formData.append("source", fs_1.default.createReadStream(imagePath));
    formData.append("caption", caption);
    formData.append("access_token", PAGE_ACCESS_TOKEN);
    try {
        const response = await axios_1.default.post(`https://graph.facebook.com/v19.0/${PAGE_ID}/photos`, formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });
        return response.data;
    }
    catch (error) {
        console.error("Facebook API Error Details:", error.response?.data);
        throw error;
    }
}
// services/facebook.service.ts
async function postToInstagram(fileName, caption) {
    // Combine the base URL with the static path and filename
    const publicImageUrl = `${process.env.SERVER_URL}/public/posts/${fileName}`;
    console.log("🔗 Sending this URL to Instagram:", publicImageUrl);
    const IG_ID = process.env.IG_BUSINESS_ID;
    const TOKEN = process.env.FB_PAGE_TOKEN;
    // Step 1: Create Container
    const container = await axios_1.default.post(`https://graph.facebook.com/v19.0/${IG_ID}/media`, {
        image_url: publicImageUrl, // This MUST be a full https:// link
        caption: caption,
        access_token: TOKEN
    });
    const creationId = container.data.id;
    // Step 2: Delay for processing (Instagram needs time to download it)
    await new Promise(resolve => setTimeout(resolve, 10000));
    // Step 3: Publish
    const publish = await axios_1.default.post(`https://graph.facebook.com/v19.0/${IG_ID}/media_publish`, {
        creation_id: creationId,
        access_token: TOKEN
    });
    return publish.data;
}
// Combined function to post to both platforms
async function postToBothPlatforms(imagePath, caption, publicImageUrl) {
    const results = {};
    try {
        // Post to Facebook
        results.facebook = await postImageDirectlyToFacebook(imagePath, caption);
        console.log("✅ Posted to Facebook:", results.facebook.id);
    }
    catch (fbError) {
        console.error("❌ Facebook post failed:", fbError);
        throw fbError;
    }
    // If Instagram credentials exist, post there too
    if (env_1.env.IG_BUSINESS_ID && publicImageUrl) {
        try {
            // Instagram needs a PUBLIC URL, not local file
            results.instagram = await postToInstagram(publicImageUrl, caption);
            console.log("✅ Posted to Instagram:", results.instagram.id);
        }
        catch (igError) {
            console.error("❌ Instagram post failed (continuing anyway):", igError);
            // Don't throw - continue even if Instagram fails
        }
    }
    else {
        console.log("⚠️ Instagram not configured or no public URL provided");
    }
    return results;
}
