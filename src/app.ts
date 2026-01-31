
import express from "express";
import cron from "node-cron";
import path from "path";
import fs from "fs";
// import { createImageFromTemplate, getRandomQuote } from
import { postImageDirectlyToFacebook, postToInstagram } from "./services/facebook.service";
import { createImageFromTemplate,getRandomQuote } from "./services/imageTemplate.service";
import { env } from "./config/env";

const app = express();
const PORT = env.PORT || 3000;

// Auto-post every 2 hours
cron.schedule("0 */2 * * *", async () => {
  console.log("🕐 Running scheduled post...");
  try {
    await postToFacebookAutomatically();
    await postToInstagramAutomatically()
    console.log("✅ Scheduled post completed successfully");
  } catch (error) {
    console.error("❌ Scheduled post failed:", error);
  }
});

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

async function postToInstagramAutomatically() {
  console.log("🤖 Starting Automatic Instagram Flow...");

  // 1. Get random quote
  const quote = await getRandomQuote();
  
  // 2. Generate the image
  const imageBuffer = await createImageFromTemplate(quote);
  
  // 3. Save locally first (so ngrok can serve it)
  const fileName = `auto-post-${Date.now()}.png`;
  const postsDir = path.join(process.cwd(), "public", "posts");
  
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
  }
  
  const filePath = path.join(postsDir, fileName);
  fs.writeFileSync(filePath, imageBuffer);
  
  // 4. Create Caption
  const caption = createEngagingCaption(quote);
  
  // 5. Post to Instagram
  // IMPORTANT: We pass 'fileName', NOT 'filePath'
  try {
    const result = await postToInstagram(fileName, caption);
    
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
  } catch (error) {
    console.error("❌ Instagram Auto-Post Failed");
    throw error;
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
  res.send(`
    <h1>Auto Social Poster</h1>
    <p>Posts run automatically every 2 hours</p>
    <p><a href="/generate-and-post">Trigger Manual Post</a></p>
    <p>Next post: ${new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleTimeString()}</p>
  `);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`⏰ Auto-posting scheduled every 2 hours`);
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
