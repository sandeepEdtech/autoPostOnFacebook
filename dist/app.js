"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const node_cron_1 = __importDefault(require("node-cron"));
const env_1 = require("./config/env");
const quote_service_1 = require("./services/quote.service");
const imageTemplate_service_1 = require("./services/imageTemplate.service");
const facebook_service_1 = require("./services/facebook.service");
const autoPost_job_1 = require("./jobs/autoPost.job");
exports.app = (0, express_1.default)();
/* =========================
   BASIC MIDDLEWARE
========================= */
exports.app.use(express_1.default.json());
/* 🔥 IMPORTANT: skip ngrok warning */
exports.app.use((req, res, next) => {
    res.setHeader("ngrok-skip-browser-warning", "true");
    next();
});
/* =========================
   STATIC FILES
========================= */
exports.app.use("/public", express_1.default.static(path_1.default.join(process.cwd(), "public")));
/* =========================
   DATABASE
========================= */
mongoose_1.default
    .connect(env_1.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB error", err));
/* =========================
   HEALTH CHECK
========================= */
exports.app.get("/", (_req, res) => {
    res.send("AI Social Poster is running 🚀");
});
/* =========================
   TEST IMAGE GENERATION
========================= */
exports.app.get("/test-image", async (_req, res) => {
    try {
        const text = (0, quote_service_1.getRandomQuote)();
        const imageBuffer = await (0, imageTemplate_service_1.createImageFromTemplate)("1", text);
        const fileName = `test-${Date.now()}.png`;
        const filePath = path_1.default.join(process.cwd(), "public", "posts", fileName);
        fs_1.default.writeFileSync(filePath, imageBuffer);
        res.json({
            success: true,
            text,
            imageUrl: `/public/posts/${fileName}`
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Image generation failed" });
    }
});
/* =========================
   GENERATE POST (LOCAL)
========================= */
exports.app.get("/generate-post", async (_req, res) => {
    try {
        const quote = "Discipline is choosing between what you want now and what you want most.";
        // ✅ AWAIT the image generation
        const imageBuffer = await (0, imageTemplate_service_1.createImageFromTemplate)("1", quote);
        const fileName = `post-${Date.now()}.png`;
        const filePath = path_1.default.join(process.cwd(), "public", "posts", fileName);
        fs_1.default.writeFileSync(filePath, imageBuffer);
        res.json({
            success: true,
            imageUrl: `/public/posts/${fileName}`
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Post generation failed" });
    }
});
/* =========================
   POST TO FACEBOOK PAGE
========================= */
exports.app.get("/post-facebook", async (_req, res) => {
    try {
        // ⚠️ Make sure this file EXISTS in public/posts
        const imageUrl = "https://semielastic-calculatingly-jaida.ngrok-free.dev/public/posts/post-1769837323474.png";
        const caption = "Automated Facebook post 🚀\nBuilt with Node.js";
        const result = await (0, facebook_service_1.postToFacebookPage)(imageUrl, caption);
        res.json({
            success: true,
            result
        });
    }
    catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).json({ error: "Facebook post failed" });
    }
});
/* =========================
   CRON JOB (CLEANUP)
========================= */
node_cron_1.default.schedule("0 * * * *", () => {
    console.log("🧹 Running image cleanup job");
    (0, autoPost_job_1.cleanupOldImages)();
});
