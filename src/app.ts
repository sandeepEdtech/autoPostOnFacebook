import express from "express";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import cron from "node-cron";

import { env } from "./config/env";
import { getRandomQuote } from "./services/quote.service";
import { createImageFromTemplate } from "./services/imageTemplate.service";
import { cleanupOldImages } from "./jobs/autoPost.job";
import { postImageDirectlyToFacebook } from "./services/facebook.service";

export const app = express();

/* =========================
   BASIC MIDDLEWARE
========================= */
app.use(express.json());

/* 🔥 IMPORTANT: skip ngrok warning */
app.use((req, res, next) => {
  res.setHeader("ngrok-skip-browser-warning", "true");
  next();
});

/* =========================
   STATIC FILES
========================= */
app.use(
  "/public",
  express.static(path.join(process.cwd(), "public"))
);

/* =========================
   DATABASE
========================= */
mongoose
  .connect(env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error", err));

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (_req, res) => {
  res.send("AI Social Poster is running 🚀");
});

/* =========================
   TEST IMAGE GENERATION
========================= */
app.get("/test-image", async (_req, res) => {
  try {
    const text = getRandomQuote();
    const imageBuffer = await createImageFromTemplate("1", text);

    const fileName = `test-${Date.now()}.png`;
    const filePath = path.join(process.cwd(), "public", "posts", fileName);

    fs.writeFileSync(filePath, imageBuffer);

    res.json({
      success: true,
      text,
      imageUrl: `/public/posts/${fileName}`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Image generation failed" });
  }
});

/* =========================
   GENERATE POST (LOCAL)
========================= */
app.get("/generate-post", async (_req, res) => {
    try {
      const quote =
        "Discipline is choosing between what you want now and what you want most.";
  
      // ✅ AWAIT the image generation
      const imageBuffer = await createImageFromTemplate("1", quote);
  
      const fileName = `post-${Date.now()}.png`;
      const filePath = path.join(process.cwd(), "public", "posts", fileName);
  
      fs.writeFileSync(filePath, imageBuffer);
  
      res.json({
        success: true,
        imageUrl: `/public/posts/${fileName}`
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Post generation failed" });
    }
  });
  
/* =========================
   POST TO FACEBOOK PAGE
========================= */
/* =========================
   POST TO FACEBOOK PAGE
========================= */
app.get("/post-facebook", async (_req, res) => {
    try {
      const quote = getRandomQuote();
      const imageBuffer = await createImageFromTemplate("1", quote);
  
      const fileName = `fb-${Date.now()}.png`;
      const postsDir = path.join(process.cwd(), "public", "posts");
      
      // Ensure directory exists
      if (!fs.existsSync(postsDir)) {
          fs.mkdirSync(postsDir, { recursive: true });
      }

      const filePath = path.join(postsDir, fileName);
      fs.writeFileSync(filePath, imageBuffer);
  
      const caption = `🚀 Auto post\n\n"${quote}"`;
  
      // This calls your axios service
      const result = await postImageDirectlyToFacebook(filePath, caption);
  
      res.json({
        success: true,
        facebookPostId: result.id, // Photo ID
        facebookPostLink: `https://www.facebook.com/${result.post_id}`
      });
    } catch (err: any) {
      // Improved error logging
      const errorData = err.response?.data || err.message;
      console.error("❌ Facebook API Error:", JSON.stringify(errorData, null, 2));
      res.status(500).json({ 
        error: "Facebook post failed", 
        details: errorData 
      });
    }
});
  
  
/* =========================
   MESSENGER WEBHOOK VERIFICATION
========================= */
app.get("/webhook", (req, res) => {
    const VERIFY_TOKEN = "sandeep"; // Use the same string here and on Meta Dashboard
  
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
  
    if (mode && token) {
      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("✅ WEBHOOK_VERIFIED");
        res.status(200).send(challenge);
      } else {
        res.sendStatus(403);
      }
    }
  });
  
  // Post route to actually receive messages/events
  app.post("/webhook", (req, res) => {
    console.log("📩 Webhook received:", req.body);
    res.status(200).send("EVENT_RECEIVED");
  });

/* =========================
   CRON JOB (CLEANUP)
========================= */
cron.schedule("0 * * * *", () => {
  console.log("🧹 Running image cleanup job");
  cleanupOldImages();
});
