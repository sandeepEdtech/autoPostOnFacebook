
import express from "express";
import cron from "node-cron";
import path from "path";
import fs from "fs";
// import { createImageFromTemplate, getRandomQuote } from
import { postImageDirectlyToFacebook, postToInstagram } from "./services/facebook.service";
import { createImageFromTemplate,getRandomQuote } from "./services/imageTemplate.service";
import { env } from "./config/env";
import axios from "axios";

const app = express();
// const PORT = process.env.PORT || 8080;
// Add this exact line in your app.ts
app.use("/public", express.static(path.join(process.cwd(), "public"), {
  setHeaders: (res) => {
    res.set("Access-Control-Allow-Origin", "*"); // Allows Meta to crawl the file
  }
}));
// Type safety for our delay helper
const delay = (ms: number): Promise<void> => new Promise(res => setTimeout(res, ms));

/**
 * Logic to schedule 5 random posts for the day
 */
const scheduleDailyPosts = () => {
  console.log("📅 Planning today's social media schedule...");

  // Viral windows based on 2026 engagement data
  const windows = [
    { name: "Morning Peak", start: 8, end: 10 },    // 8-10 AM
    { name: "Lunch Rush", start: 12, end: 14 },     // 12-2 PM
    { name: "Afternoon Slump", start: 16, end: 18 }, // 4-6 PM
    { name: "Prime Time", start: 19, end: 21 },     // 7-9 PM
    { name: "Late Night", start: 22, end: 23 }      // 10-11 PM
  ];

  windows.forEach((window, index) => {
    // 1. Generate random time within this specific window
    const randomHour = Math.floor(Math.random() * (window.end - window.start + 1)) + window.start;
    const randomMinute = Math.floor(Math.random() * 60);

    // 2. Schedule the Cron
    cron.schedule(`${randomMinute} ${randomHour} * * *`, async () => {
      // Human Behavior: Add a 0-10 minute "jitter" so it's not exactly on the minute
      const jitterMs = Math.floor(Math.random() * 10 * 60 * 1000);
      await delay(jitterMs);

      try {
        console.log(`🚀 [${window.name}] Executing post at ${randomHour}:${randomMinute}`);
        await postToInstagramAutomatically();
        await postToFacebookAutomatically();
      } catch (error) {
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
cron.schedule("5 0 * * *", () => {
  const postsFolder = path.join(process.cwd(), "public", "posts");

  console.log("🧹 Starting daily cleanup of 'public/posts' folder...");

  if (fs.existsSync(postsFolder)) {
    fs.readdir(postsFolder, (err, files) => {
      if (err) {
        console.error("❌ Cleanup Error:", err);
        return;
      }

      for (const file of files) {
        // Skip hidden files like .gitkeep
        if (file.startsWith('.')) continue;

        fs.unlink(path.join(postsFolder, file), (err) => {
          if (err) console.error(`❌ Could not delete ${file}:`, err);
        });
      }
      console.log(`✅ Cleanup complete. Deleted ${files.length} files.`);
    });
  }
});

// Reset scheduler every day at midnight
cron.schedule("0 0 * * *", () => {
  scheduleDailyPosts();
});

// Run immediately on startup so you don't have to wait until midnight
scheduleDailyPosts();

// Manual trigger endpoint
app.get("/generate-and-post", async (_req, res) => {
  try {
//const result = await postToFacebookAutomatically();
const result=await postToInstagramAutomatically()
    res.json({
      success: true,
      message: "Post created and published successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

async function postToFacebookAutomatically() {
  // Get random quote
  const quote = await getRandomQuote();
  
  // Generate image with random template
  const imageBuffer = await createImageFromTemplate(quote);
  
  // Save image
  const fileName = `auto-post-${Date.now()}.png`;
  const postsDir = path.join(process.cwd(), "public", "posts");
  
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
  }
  
  const filePath = path.join(postsDir, fileName);
  fs.writeFileSync(filePath, imageBuffer);
  
  // Create engaging caption with hashtags
  const caption = createEngagingCaption(quote);
  
  // Post to Facebook
   const result = await postImageDirectlyToFacebook(filePath, caption);
  //const result=await postToInstagram(filePath,caption)
  console.log("posted on instageam",result )
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
    console.log("🧪 Running Bulk Image Generation (5 Posts)...");

    const postsDir = path.join(process.cwd(), "public", "posts");
    if (!fs.existsSync(postsDir)) {
      fs.mkdirSync(postsDir, { recursive: true });
    }

    const generatedPosts = [];

    // Loop to generate 5 distinct posts
    for (let i = 0; i < 5; i++) {
      // 1. Get random quote
      const quote = await getRandomQuote();
      
      // 2. Generate the image buffer
      const imageBuffer = await createImageFromTemplate(quote);
      
      // 3. Define filename
      const fileName = `test-bulk-${i}-${Date.now()}.png`;
      const filePath = path.join(postsDir, fileName);
      
      // 4. Save to disk
      fs.writeFileSync(filePath, imageBuffer);

      // 5. Store data for the UI
      generatedPosts.push({
        url: `${process.env.SERVER_URL}/public/posts/${fileName}`,
        quote: quote
      });

      // Optional: Tiny delay to ensure unique timestamps/randomness
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 6. Return HTML grid showing all 5 images
    const imageHtml = generatedPosts.map(post => `
      <div style="border: 2px solid #ddd; padding: 10px; border-radius: 8px;">
        <img src="${post.url}" alt="Generated Quote" style="max-width: 300px; display: block; margin-bottom: 10px;" />
        <p style="font-size: 12px; color: #666;">${post.quote}</p>
        <a href="${post.url}" target="_blank" style="font-size: 11px;">View Full Image</a>
      </div>
    `).join('');

    res.send(`
      <div style="font-family: sans-serif; padding: 20px; text-align: center;">
        <h1>🎨 Bulk Image Generation Test (5 Posts)</h1>
        <p>Verified: <strong>SERVER_URL</strong> and <strong>Static Routing</strong> are active.</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-top: 20px;">
            ${imageHtml}
        </div>
        <hr style="margin: 40px 0;" />
        <a href="/" style="text-decoration: none; color: #007bff; font-weight: bold;">⬅ Back to Dashboard</a>
      </div>
    `);

  } catch (error: any) {
    console.error("❌ Bulk Test Failed:", error.message);
    res.status(500).send(`<h1>❌ Test Failed</h1><p>${error.message}</p>`);
  }
});


async function postToInstagramAutomatically() {
  console.log("🤖 Starting Render-Verified Instagram Flow...");

  const quote = await getRandomQuote();
  const imageBuffer = await createImageFromTemplate(quote);
  const fileName = `auto-post-${Date.now()}.png`;
  
  // Use a reliable path construction for Render
  const postsDir = path.resolve(process.cwd(), "public", "posts");
  
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
  }
  
  const filePath = path.join(postsDir, fileName);
  fs.writeFileSync(filePath, imageBuffer);
  
  const publicUrl = `${process.env.SERVER_URL}/public/posts/${fileName}`;
  const caption = createEngagingCaption(quote);

  let attempts = 0;
  const maxAttempts = 3;
  // Shorter check interval but more checks
  const waitInterval = 15000; 

  while (attempts < maxAttempts) {
    try {
      console.log(`🔍 [Attempt ${attempts + 1}] Verifying URL availability: ${publicUrl}`);
      
      // SELF-VERIFICATION: Check if the file is actually reachable
      const checkResponse = await axios.get(publicUrl).catch(() => null);

      if (checkResponse && checkResponse.status === 200) {
        console.log("✅ URL is Live! Proceeding to Instagram API...");
        const result = await postToInstagram(fileName, caption);
        
        console.log("✅ Instagram Auto-Post Success:", result.id);
        savePostLog({ timestamp: new Date().toISOString(), platform: "instagram", postId: result.id, image: fileName });
        return result;
      } else {
        throw new Error("URL returned 404 or was unreachable");
      }

    } catch (error: any) {
      attempts++;
      console.warn(`⚠️ Attempt ${attempts}: Image not reachable yet. Waiting ${waitInterval/1000}s...`);
      
      if (attempts >= maxAttempts) {
        console.error("❌ ERROR: Image never became public. Check your Render Static folder settings.");
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, waitInterval));
    }
  }
}

export function createEngagingCaption(quote: string): string {
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

function savePostLog(logEntry: any): void {
  const logsDir = path.join(process.cwd(), "logs");
  const logFile = path.join(logsDir, "posts.json");
  
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  let logs = [];
  if (fs.existsSync(logFile)) {
    const data = fs.readFileSync(logFile, "utf8");
    logs = JSON.parse(data);
  }
  
  logs.push(logEntry);
  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
}

// Serve static files
app.use("/public", express.static(path.join(process.cwd(), "public")));

app.get("/", (_req, res) => {

  console.log("pleas save me and dont hit me")
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

const PORT: number = Number(process.env.PORT) || 8080;

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
