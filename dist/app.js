"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEngagingCaption = createEngagingCaption;
const express_1 = __importDefault(require("express"));
const node_cron_1 = __importDefault(require("node-cron"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// import { createImageFromTemplate, getRandomQuote } from
const facebook_service_1 = require("./services/facebook.service");
const imageTemplate_service_1 = require("./services/imageTemplate.service");
const app = (0, express_1.default)();
// const PORT = process.env.PORT || 8080;
// Type safety for our delay helper
const delay = (ms) => new Promise(res => setTimeout(res, ms));
/**
 * Logic to schedule 5 random posts for the day
 */
const scheduleDailyPosts = () => {
    console.log("📅 Planning today's social media schedule...");
    // Viral windows based on 2026 engagement data
    const windows = [
        { name: "Morning Peak", start: 8, end: 10 }, // 8-10 AM
        { name: "Lunch Rush", start: 12, end: 14 }, // 12-2 PM
        { name: "Afternoon Slump", start: 16, end: 18 }, // 4-6 PM
        { name: "Prime Time", start: 19, end: 21 }, // 7-9 PM
        { name: "Late Night", start: 22, end: 23 } // 10-11 PM
    ];
    windows.forEach((window, index) => {
        // 1. Generate random time within this specific window
        const randomHour = Math.floor(Math.random() * (window.end - window.start + 1)) + window.start;
        const randomMinute = Math.floor(Math.random() * 60);
        // 2. Schedule the Cron
        node_cron_1.default.schedule(`${randomMinute} ${randomHour} * * *`, async () => {
            // Human Behavior: Add a 0-10 minute "jitter" so it's not exactly on the minute
            const jitterMs = Math.floor(Math.random() * 10 * 60 * 1000);
            await delay(jitterMs);
            try {
                console.log(`🚀 [${window.name}] Executing post at ${randomHour}:${randomMinute}`);
                await postToInstagramAutomatically();
                await postToFacebookAutomatically();
            }
            catch (error) {
                console.error(`❌ [${window.name}] Post failed:`, error);
            }
        });
        console.log(`📍 Post ${index + 1} (${window.name}) set for ${randomHour}:${randomMinute.toString().padStart(2, '0')}`);
    });
};
/**
 * Midnight Cleanup: Deletes all generated images from the 'public/posts' folder.
 * Runs every day at 12:05 AM to keep backend storage light.
 */
node_cron_1.default.schedule("5 0 * * *", () => {
    const postsFolder = path_1.default.join(process.cwd(), "public", "posts");
    console.log("🧹 Starting daily cleanup of 'public/posts' folder...");
    if (fs_1.default.existsSync(postsFolder)) {
        fs_1.default.readdir(postsFolder, (err, files) => {
            if (err) {
                console.error("❌ Cleanup Error:", err);
                return;
            }
            for (const file of files) {
                // Skip hidden files like .gitkeep
                if (file.startsWith('.'))
                    continue;
                fs_1.default.unlink(path_1.default.join(postsFolder, file), (err) => {
                    if (err)
                        console.error(`❌ Could not delete ${file}:`, err);
                });
            }
            console.log(`✅ Cleanup complete. Deleted ${files.length} files.`);
        });
    }
});
// Reset scheduler every day at midnight
node_cron_1.default.schedule("0 0 * * *", () => {
    scheduleDailyPosts();
});
// Run immediately on startup so you don't have to wait until midnight
scheduleDailyPosts();
// Manual trigger endpoint
app.get("/generate-and-post", async (_req, res) => {
    try {
        //const result = await postToFacebookAutomatically();
        const result = await postToInstagramAutomatically();
        res.json({
            success: true,
            message: "Post created and published successfully",
            data: result,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
async function postToFacebookAutomatically() {
    // Get random quote
    const quote = await (0, imageTemplate_service_1.getRandomQuote)();
    // Generate image with random template
    const imageBuffer = await (0, imageTemplate_service_1.createImageFromTemplate)(quote);
    // Save image
    const fileName = `auto-post-${Date.now()}.png`;
    const postsDir = path_1.default.join(process.cwd(), "public", "posts");
    if (!fs_1.default.existsSync(postsDir)) {
        fs_1.default.mkdirSync(postsDir, { recursive: true });
    }
    const filePath = path_1.default.join(postsDir, fileName);
    fs_1.default.writeFileSync(filePath, imageBuffer);
    // Create engaging caption with hashtags
    const caption = createEngagingCaption(quote);
    // Post to Facebook
    const result = await (0, facebook_service_1.postImageDirectlyToFacebook)(filePath, caption);
    //const result=await postToInstagram(filePath,caption)
    console.log("posted on instageam", result);
    // Save post details to log
    const logEntry = {
        timestamp: new Date().toISOString(),
        postId: result.id,
        quote: quote,
        image: fileName,
        caption: caption,
    };
    savePostLog(logEntry);
    return {
        postId: result.id,
        imageUrl: `/public/posts/${fileName}`,
        quote: quote,
        caption: caption,
    };
}
// Test route to verify image generation and public URL access
app.get("/test-image-gen", async (_req, res) => {
    try {
        console.log("🧪 Running Image Generation Test...");
        // 1. Get random quote
        const quote = await (0, imageTemplate_service_1.getRandomQuote)();
        // 2. Generate the image buffer
        const imageBuffer = await (0, imageTemplate_service_1.createImageFromTemplate)(quote);
        // 3. Define filename and directory
        const fileName = `test-${Date.now()}.png`;
        const postsDir = path_1.default.join(process.cwd(), "public", "posts");
        // Ensure directory exists
        if (!fs_1.default.existsSync(postsDir)) {
            fs_1.default.mkdirSync(postsDir, { recursive: true });
        }
        // 4. Save to disk
        const filePath = path_1.default.join(postsDir, fileName);
        fs_1.default.writeFileSync(filePath, imageBuffer);
        // 5. Construct the public URL
        const publicUrl = `${process.env.SERVER_URL}/public/posts/${fileName}`;
        // 6. Return a simple HTML page showing the image
        res.send(`
      <div style="font-family: sans-serif; padding: 20px; text-align: center;">
        <h1>🎨 Image Generation Test</h1>
        <p>If you see the image below, your <strong>SERVER_URL</strong> and <strong>Static Routing</strong> are working!</p>
        <div style="margin: 20px auto; border: 5px solid #333; display: inline-block;">
            <img src="${publicUrl}" alt="Generated Quote" style="max-width: 500px;" />
        </div>
        <p><strong>Generated URL:</strong> <a href="${publicUrl}" target="_blank">${publicUrl}</a></p>
        <p><strong>Quote Used:</strong> "${quote}"</p>
        <hr />
        <a href="/" style="text-decoration: none; color: #007bff;">⬅ Back to Dashboard</a>
      </div>
    `);
    }
    catch (error) {
        console.error("❌ Test Failed:", error.message);
        res.status(500).send(`<h1>❌ Test Failed</h1><p>${error.message}</p>`);
    }
});
async function postToInstagramAutomatically() {
    console.log("🤖 Starting Automatic Instagram Flow...");
    // 1. Get random quote
    const quote = await (0, imageTemplate_service_1.getRandomQuote)();
    // 2. Generate the image
    const imageBuffer = await (0, imageTemplate_service_1.createImageFromTemplate)(quote);
    // 3. Save locally first (so ngrok can serve it)
    const fileName = `auto-post-${Date.now()}.png`;
    const postsDir = path_1.default.join(process.cwd(), "public", "posts");
    if (!fs_1.default.existsSync(postsDir)) {
        fs_1.default.mkdirSync(postsDir, { recursive: true });
    }
    const filePath = path_1.default.join(postsDir, fileName);
    fs_1.default.writeFileSync(filePath, imageBuffer);
    // 4. Create Caption
    const caption = createEngagingCaption(quote);
    // 5. Post to Instagram
    // IMPORTANT: We pass 'fileName', NOT 'filePath'
    try {
        const result = await (0, facebook_service_1.postToInstagram)(fileName, caption);
        console.log("✅ Instagram Auto-Post Success:", result.id);
        // 6. Log entry
        const logEntry = {
            timestamp: new Date().toISOString(),
            platform: "instagram",
            postId: result.id,
            image: fileName,
        };
        savePostLog(logEntry);
        return result;
    }
    catch (error) {
        console.error("❌ Instagram Auto-Post Failed");
        throw error;
    }
}
function createEngagingCaption(quote) {
    // 1. Viral Greetings / Scroll Stoppers
    const greetings = ["🚀", "🌟", "💫", "🔥", "✨", "💎", "👑", "⚡"];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    // 2. High-Engagement CTAs (Meaningful Interactions)
    const callToActions = [
        "What's your take on this? 👇",
        "Tag someone who needs to see this!",
        "Drop a 💯 if this resonates with you!",
        "Share your thoughts in the comments!",
        "Save this for your daily dose of motivation!",
        "Double-tap if you agree! ❤️",
        "Comment YES if you needed this today!",
        "Share to your story if this helped! 📲",
        "What's your biggest takeaway from this?"
    ];
    const cta = callToActions[Math.floor(Math.random() * callToActions.length)];
    // 3. Trending 2026 Hashtag Cloud
    const hashtags = [
        "#MotivationMonday", "#TuesdayThoughts", "#WisdomWednesday",
        "#ThursdayMotivation", "#FridayFeeling", "#WeekendVibes",
        "#EntrepreneurLife", "#Startup", "#BusinessTips",
        "#SuccessMindset", "#Hustle", "#Grind",
        "#SelfImprovement", "#PersonalDevelopment", "#Mindset",
        "#GrowthHacking", "#Productivity", "#Focus",
        "#DigitalMarketing", "#SocialMediaTips", "#ContentCreation",
        "#AI", "#Tech", "#Innovation",
        "#Viral", "#Trending", "#Inspiration",
        "#QuoteOfTheDay", "#DailyMotivation", "#LifeLessons"
    ];
    // 4. Randomly select 5-8 hashtags to keep the post fresh
    const selectedHashtags = hashtags
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 4) + 5);
    // 5. Final Assembly: Structure for maximum readability
    return `${greeting} ${quote}\n\n${cta}\n\n${selectedHashtags.join(" ")}`;
}
function savePostLog(logEntry) {
    const logsDir = path_1.default.join(process.cwd(), "logs");
    const logFile = path_1.default.join(logsDir, "posts.json");
    if (!fs_1.default.existsSync(logsDir)) {
        fs_1.default.mkdirSync(logsDir, { recursive: true });
    }
    let logs = [];
    if (fs_1.default.existsSync(logFile)) {
        const data = fs_1.default.readFileSync(logFile, "utf8");
        logs = JSON.parse(data);
    }
    logs.push(logEntry);
    fs_1.default.writeFileSync(logFile, JSON.stringify(logs, null, 2));
}
// Serve static files
app.use("/public", express_1.default.static(path_1.default.join(process.cwd(), "public")));
app.get("/", (_req, res) => {
    console.log("pleas save me and dont hit me");
    res.send(`
    <div style="font-family: sans-serif; padding: 20px;">
      <h1>🚀 Auto Social Poster: ONLINE</h1>
      <p><strong>Status:</strong> The Daily Master Scheduler is active (5 random posts/day).</p>
      <hr />
      <p><a href="/generate-and-post" style="background: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">🔥 Trigger Manual Post Right Now</a></p>
      <hr />
      <p>Current Server Time: ${new Date().toLocaleTimeString()}</p>
      <p><small>Check Zeabur logs to see the specific 5 times chosen for today.</small></p>
    </div>
  `);
});
const PORT = Number(process.env.PORT) || 8080;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server is live on port ${PORT}`);
    console.log(`📅 Daily Master Scheduler is active.`);
});
// import express from "express";
// import mongoose from "mongoose";
// import path from "path";
// import fs from "fs";
// import cron from "node-cron";
// import { env } from "./config/env";
// import { getRandomQuote } from "./services/quote.service";
// import { createImageFromTemplate } from "./services/imageTemplate.service";
// import { cleanupOldImages } from "./jobs/autoPost.job";
// import { postImageDirectlyToFacebook } from "./services/facebook.service";
// export const app = express();
// /* =========================
//    BASIC MIDDLEWARE
// ========================= */
// app.use(express.json());
// /* 🔥 IMPORTANT: skip ngrok warning */
// app.use((req, res, next) => {
//   res.setHeader("ngrok-skip-browser-warning", "true");
//   next();
// });
// /* =========================
//    STATIC FILES
// ========================= */
// app.use(
//   "/public",
//   express.static(path.join(process.cwd(), "public"))
// );
// /* =========================
//    DATABASE
// ========================= */
// mongoose
//   .connect(env.MONGO_URI)
//   .then(() => console.log("✅ MongoDB connected"))
//   .catch((err) => console.error("❌ MongoDB error", err));
// /* =========================
//    HEALTH CHECK
// ========================= */
// app.get("/", (_req, res) => {
//   res.send("AI Social Poster is running 🚀");
// });
// /* =========================
//    TEST IMAGE GENERATION
// ========================= */
// app.get("/test-image", async (_req, res) => {
//   try {
//     const text = getRandomQuote();
//     const imageBuffer = await createImageFromTemplate("1", text);
//     const fileName = `test-${Date.now()}.png`;
//     const filePath = path.join(process.cwd(), "public", "posts", fileName);
//     fs.writeFileSync(filePath, imageBuffer);
//     res.json({
//       success: true,
//       text,
//       imageUrl: `/public/posts/${fileName}`
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Image generation failed" });
//   }
// });
// /* =========================
//    GENERATE POST (LOCAL)
// ========================= */
// app.get("/generate-post", async (_req, res) => {
//     try {
//       const quote =
//         "Discipline is choosing between what you want now and what you want most.";
//       // ✅ AWAIT the image generation
//       const imageBuffer = await createImageFromTemplate("1", quote);
//       const fileName = `post-${Date.now()}.png`;
//       const filePath = path.join(process.cwd(), "public", "posts", fileName);
//       fs.writeFileSync(filePath, imageBuffer);
//       res.json({
//         success: true,
//         imageUrl: `/public/posts/${fileName}`
//       });
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ error: "Post generation failed" });
//     }
//   });
// /* =========================
//    POST TO FACEBOOK PAGE
// ========================= */
// /* =========================
//    POST TO FACEBOOK PAGE
// ========================= */
// app.get("/post-facebook", async (_req, res) => {
//     try {
//       const quote = getRandomQuote();
//       const imageBuffer = await createImageFromTemplate("1", quote);
//       const fileName = `fb-${Date.now()}.png`;
//       const postsDir = path.join(process.cwd(), "public", "posts");
//       // Ensure directory exists
//       if (!fs.existsSync(postsDir)) {
//           fs.mkdirSync(postsDir, { recursive: true });
//       }
//       const filePath = path.join(postsDir, fileName);
//       fs.writeFileSync(filePath, imageBuffer);
//       const caption = `🚀 Auto post\n\n"${quote}"`;
//       // This calls your axios service
//       const result = await postImageDirectlyToFacebook(filePath, caption);
//       res.json({
//         success: true,
//         facebookPostId: result.id, // Photo ID
//         facebookPostLink: `https://www.facebook.com/${result.post_id}`
//       });
//     } catch (err: any) {
//       // Improved error logging
//       const errorData = err.response?.data || err.message;
//       console.error("❌ Facebook API Error:", JSON.stringify(errorData, null, 2));
//       res.status(500).json({ 
//         error: "Facebook post failed", 
//         details: errorData 
//       });
//     }
// });
// /* =========================
//    MESSENGER WEBHOOK VERIFICATION
// ========================= */
// app.get("/webhook", (req, res) => {
//     const VERIFY_TOKEN = "sandeep"; // Use the same string here and on Meta Dashboard
//     const mode = req.query["hub.mode"];
//     const token = req.query["hub.verify_token"];
//     const challenge = req.query["hub.challenge"];
//     if (mode && token) {
//       if (mode === "subscribe" && token === VERIFY_TOKEN) {
//         console.log("✅ WEBHOOK_VERIFIED");
//         res.status(200).send(challenge);
//       } else {
//         res.sendStatus(403);
//       }
//     }
//   });
//   // Post route to actually receive messages/events
//   app.post("/webhook", (req, res) => {
//     console.log("📩 Webhook received:", req.body);
//     res.status(200).send("EVENT_RECEIVED");
//   });
// /* =========================
//    CRON JOB (CLEANUP)
// ========================= */
// cron.schedule("0 * * * *", () => {
//   console.log("🧹 Running image cleanup job");
//   cleanupOldImages();
// });
