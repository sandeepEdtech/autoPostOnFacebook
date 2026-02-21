
import express from "express";
import cron from "node-cron";
import path from "path";
import fs from "fs";

import { execSync } from 'child_process';
// import { createImageFromTemplate, getRandomQuote } from
import { postImageDirectlyToFacebook, postToInstagram } from "./services/facebook.service";
import { createImageFromTemplate,getRandomQuote } from "./services/imageTemplate.service";
import { env } from "./config/env";
import axios from "axios";
import { createTalkingInfluencerReel } from "./services/video.service";
import { createCanvas, loadImage } from 'canvas';
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
  console.log("🔄 Scheduling: 4 Image Posts + 4 Reels = 8 total daily posts");

  // Viral windows based on 2026 engagement data
  const windows = [
    { name: "Early Morning", start: 6, end: 8 },     // 6-8 AM - Early risers
    { name: "Morning Peak", start: 8, end: 10 },     // 8-10 AM - Peak morning
    { name: "Late Morning", start: 10, end: 12 },    // 10-12 AM - Late morning
    { name: "Lunch Rush", start: 12, end: 14 },      // 12-2 PM - Lunch break
    { name: "Afternoon", start: 14, end: 16 },       // 2-4 PM - Afternoon
    { name: "Evening", start: 16, end: 18 },         // 4-6 PM - After work
    { name: "Prime Time", start: 19, end: 21 },      // 7-9 PM - Prime time
    { name: "Late Night", start: 22, end: 23 }       // 10-11 PM - Night owls
  ];

  // Shuffle windows to randomize which type goes where
  const shuffledWindows = [...windows].sort(() => Math.random() - 0.5);
  
  // Alternate between image posts and reels
  let postCount = 0;
  let reelCount = 0;

  shuffledWindows.forEach((window, index) => {
    // Determine if this slot should be image or reel
    // We want 4 images and 4 reels total
    const isReel = index % 2 === 0 ? reelCount < 4 : postCount < 3;
    
    let type = '';
    if (isReel && reelCount < 4) {
      type = 'REEL';
      reelCount++;
    } else if (postCount < 4) {
      type = 'IMAGE';
      postCount++;
    } else if (reelCount < 4) {
      type = 'REEL';
      reelCount++;
    } else {
      type = 'IMAGE';
      postCount++;
    }

    // Generate random time within this specific window
    const randomHour = Math.floor(Math.random() * (window.end - window.start)) + window.start;
    const randomMinute = Math.floor(Math.random() * 60);
    const randomSecond = Math.floor(Math.random() * 60); // Add seconds for more randomness

    // Schedule the Cron
    cron.schedule(`${randomSecond} ${randomMinute} ${randomHour} * * *`, async () => {
      try {
        // Human Behavior: Add random delay between 0-15 minutes
        const jitterMin = Math.floor(Math.random() * 15); // 0-15 minutes
        const jitterSec = Math.floor(Math.random() * 60); // 0-60 seconds
        const jitterMs = (jitterMin * 60 * 1000) + (jitterSec * 1000);
        
        console.log(`⏰ Scheduled ${type} for ${randomHour}:${randomMinute}:${randomSecond} with ${jitterMin}m ${jitterSec}s jitter`);
        await delay(jitterMs);

        console.log(`🚀 [${window.name}] Executing ${type} at ${new Date().toLocaleTimeString()}`);
        
        if (type === 'REEL') {
          // Post reel
          await generateAndPostReelFlow();
        } else {
          // Post image
          await postToInstagramAutomatically();
          await postToFacebookAutomatically();
        }
        
        console.log(`✅ [${window.name}] ${type} posted successfully`);
      } catch (error) {
        console.error(`❌ [${window.name}] ${type} failed:`, error);
      }
    });

    // Add some variation in the display
    const emoji = type === 'REEL' ? '🎬' : '📷';
    console.log(`${emoji} ${type} ${index + 1} (${window.name}) set for ${randomHour.toString().padStart(2, '0')}:${randomMinute.toString().padStart(2, '0')}:${randomSecond.toString().padStart(2, '0')} (with random delay)`);
  });

  console.log(`\n📊 Summary: ${postCount} Image Posts + ${reelCount} Reels scheduled for today`);
  console.log("🤖 Posts will appear at random times with human-like delays\n");
};

// ==========================================
// AUTO POST REEL FUNCTION
// ==========================================


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
const result1 = await postToFacebookAutomatically();
const result=await postToInstagramAutomatically()
    res.json({
      success: true,
      message: "Post created and published successfully",
      data: result,result1,
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


// --- CONFIGURATION ---
const SERVER_URL = process.env.SERVER_URL || "http://localhost:3000";

// --- HELPERS ---

// async function getRandomQuote(): Promise<string> {
//   const quotes = [
//     "The only way to do great work is to love what you do.",
//     "Your body is the only place you have to live. Treat it like a temple.",
//     "Difficult roads often lead to beautiful destinations.",
//     "Do something today that your future self will thank you for."
//   ];
//   return quotes[Math.floor(Math.random() * quotes.length)];
// }

// function wrapText(ctx: any, text: string, maxWidth: number): string[] {
//   const words = text.split(' ');
//   const lines: string[] = [];
//   let currentLine = words[0];
//   for (let i = 1; i < words.length; i++) {
//     const width = ctx.measureText(currentLine + ' ' + words[i]).width;
//     if (width < maxWidth) { currentLine += ' ' + words[i]; } 
//     else { lines.push(currentLine); currentLine = words[i]; }
//   }
//   lines.push(currentLine);
//   return lines;
// }



function roundRect(ctx: any, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * HELPER: Wraps text to fit the box
 */
function wrapText(ctx: any, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0];
  for (let i = 1; i < words.length; i++) {
    const width = ctx.measureText(currentLine + ' ' + words[i]).width;
    if (width < maxWidth) { currentLine += ' ' + words[i]; } 
    else { lines.push(currentLine); currentLine = words[i]; }
  }
  lines.push(currentLine);
  return lines;
}

/**
 * GENERATOR: Creates a high-end frame with Glassmorphism and Colorful Images
 */
/**
 * GENERATES THE PERFECT 9:16 FRAME
 */
async function createReelFrame(quote: string): Promise<Buffer> {
  const width = 1080;
  const height = 1920; // Exact 9:16 Ratio
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  try {
    const randomID = Math.floor(Math.random() * 1000);
    const imageUrl = `https://picsum.photos/seed/${randomID}/1080/1920`;
    const backgroundImage = await loadImage(imageUrl);
    
    // CENTER CROP LOGIC: This ensures the image covers the WHOLE screen
    const canvasRatio = width / height;
    const imageRatio = backgroundImage.width / backgroundImage.height;
    let drawWidth, drawHeight, drawX, drawY;

    if (imageRatio > canvasRatio) {
        drawHeight = height;
        drawWidth = backgroundImage.width * (height / backgroundImage.height);
        drawX = (width - drawWidth) / 2;
        drawY = 0;
    } else {
        drawWidth = width;
        drawHeight = backgroundImage.height * (width / backgroundImage.width);
        drawX = 0;
        drawY = (height - drawHeight) / 2;
    }

    ctx.drawImage(backgroundImage, drawX, drawY, drawWidth, drawHeight);

    // Darken the background slightly for text pop
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(0, 0, width, height);
  } catch (e) {
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, width, height);
  }

  // --- GLASS BOX AND TEXT ---
  const margin = 80;
  const maxWidth = width - (margin * 2) - 60;
  let fontSize = 90;
  ctx.font = `bold ${fontSize}px "Arial"`;
  let lines = wrapText(ctx, quote.toUpperCase(), maxWidth);

  const lineHeight = fontSize * 1.3;
  const boxHeight = (lines.length * lineHeight) + 160;
  const boxY = (height / 2) - (boxHeight / 2);

  // Frosted Glass Box
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 50;
  roundRect(ctx, margin, boxY, width - (margin * 2), boxHeight, 40);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  // Draw Text
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FFFFFF';
  lines.forEach((line, i) => {
    ctx.fillText(line, width / 2, (boxY + 80) + (lineHeight / 2) + (i * lineHeight));
  });

  // ==========================================
  // ADDED: WATERMARK & BRANDING SECTION FOR REELS
  // ==========================================
  const watermarkY = height - 100;
  
  // 1. Draw a subtle darkened strip or glow behind the watermark for visibility
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  roundRect(ctx, (width / 2) - 100, watermarkY - 25, 200, 50, 25);
  ctx.fill();

  // 2. Add "@autop.ost" Username
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 28px "Montserrat", "Arial"`;
  ctx.textAlign = "center";
  ctx.fillText("@autop.ost", width / 2, watermarkY);

  // 3. Add "Daily Motivation" sub-text below the glass box
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.font = `italic 22px "Montserrat", "Arial"`;
  ctx.fillText("Daily Motivation", width / 2, boxY + boxHeight + 50);

  return canvas.toBuffer("image/png");
}
// --- ROUTES ---

// 1. Manual Preview Route
// app.get("/create-reel-manual", async (req, res) => {
//   try {
//     const result = await generateReelFile();
//     res.send(`
//       <div style="text-align:center; padding:50px; font-family:sans-serif;">
//         <h1 style="color:#2ecc71;">Reel Created!</h1>
//         <p>"${result.quote}"</p>
//         <a href="${result.videoUrl}" target="_blank" style="background:#0095f6; color:white; padding:15px 25px; border-radius:10px; text-decoration:none; font-weight:bold;">🎥 WATCH REEL</a>
//       </div>
//     `);
//   } catch (e: any) {
//     res.status(500).send("Error: " + e.message);
//   }
// });
/**
 * Generates a random engaging caption for the Reel
 */
function createReelCaption(quote: string): string {
  const hashtags = "#motivation #mindset #success #dailyquotes #reels #inspiration #growth";
  const templates = [
    `✨ Perspective is everything.\n\n"${quote}"\n\nFollow @autop.ost for your daily dose of growth. 🚀\n\n${hashtags}`,
    `🔥 This hit different today.\n\n"${quote}"\n\nTag someone who needs to hear this. 🙌\n\n${hashtags}`,
    `💎 Level up your thinking.\n\n"${quote}"\n\nDouble tap if you agree! ❤️\n\n${hashtags}`
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}
// 2. Auto Post Route
app.get("/generate-and-post-reel", async (req, res) => {
  try {
    // 1. Call the function and wait for the result
    const result = await generateAndPostReelFlow();

    // 2. Send the result back as JSON
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});


interface ReelResult {
  videoUrl: string;
  quote: string;
}

import { spawn } from 'child_process';
import https from 'https';

// Add this function to download random music from free sources


// Modified generateReelFile function - ONLY the music path line is changed



/**
 * Standalone function to generate and post a Reel to Instagram
 */
async function generateAndPostReelFlow(reelNumber: number = 1) {
  try {
    console.log(`\n🚀 Starting Global Reel Post Flow for Reel #${reelNumber}...`);

    // 1. Generate the video file using our robust function
    const reel = await generateReelFile(reelNumber);
    
    // Safety check for public URL
    if (reel.videoUrl.includes('localhost') || reel.videoUrl.includes('127.0.0.1')) {
      console.warn("⚠️ Warning: Instagram cannot reach 'localhost'. Ensure SERVER_URL is a public Ngrok/Render link.");
    }

    const caption = createReelCaption(reel.quote);

    // STEP 1: Create Media Container
    console.log("📤 Step 1/3: Uploading video to Instagram servers...");
    const container = await axios.post(
      `https://graph.facebook.com/v18.0/${process.env.IG_BUSINESS_ID}/media`, 
      {
        media_type: 'REELS',
        video_url: reel.videoUrl,
        caption: caption,
        access_token: process.env.FB_PAGE_TOKEN
      }
    );

    const creationId = container.data.id;
    console.log(`📦 Container Created (ID: ${creationId}).`);

    // STEP 2: Polling for processing status
    console.log("⏳ Step 2/3: Waiting for Instagram to process HD video...");
    
    let finished = false;
    const maxChecks = 30; // 5 minutes max for longer reels (20-50s)
    
    for (let i = 0; i < maxChecks; i++) {
      const percent = Math.round(((i + 1) / maxChecks) * 100);
      process.stdout.write(`   IG Processing: [${"=".repeat(Math.floor(i/1.5))}${" ".repeat(Math.floor((maxChecks - i)/1.5))}] ${percent}%\r`);
      
      await new Promise(r => setTimeout(r, 10000)); // 10 second interval

      const check = await axios.get(`https://graph.facebook.com/v18.0/${creationId}`, {
        params: { 
          fields: 'status_code', 
          access_token: process.env.FB_PAGE_TOKEN 
        }
      });

      const statusCode = check.data.status_code;

      if (statusCode === 'FINISHED') {
        finished = true;
        console.log("\n✅ Instagram Processing: 100% Complete!");
        break;
      }
      
      if (statusCode === 'ERROR') {
        throw new Error(`Instagram server failed to process the video.`);
      }
    }

    if (!finished) {
      throw new Error("Instagram processing timeout (5-minute limit reached).");
    }

    // STEP 3: Final Publish
    console.log("🚀 Step 3/3: Publishing to Feed...");
    const publish = await axios.post(
      `https://graph.facebook.com/v18.0/${process.env.IG_BUSINESS_ID}/media_publish`, 
      {
        creation_id: creationId,
        access_token: process.env.FB_PAGE_TOKEN
      }
    );

    console.log(`✨ SUCCESS: Reel #${reelNumber} is now LIVE!`);
    console.log(`🔗 Post ID: ${publish.data.id}`);

    return { success: true, id: publish.data.id };

  } catch (e: any) {
    const errorMsg = e.response?.data?.error?.message || e.message;
    console.error(`\n❌ FAILED TO AUTO-POST REEL #${reelNumber}:`, errorMsg);
    return { success: false, error: errorMsg };
  }
}


//below copy 


// Add this function to create a silent fallback audio file
async function createSilentAudio(tempDir: string, durationSeconds: number): Promise<string> {
  const silentPath = path.join(tempDir, `silent_${Date.now()}.mp3`);
  
  return new Promise((resolve, reject) => {
    // Generate silent audio using ffmpeg
    const ffmpeg = spawn('ffmpeg', [
      '-y',
      '-f', 'lavfi',
      '-i', 'anullsrc=r=44100:cl=stereo',
      '-t', durationSeconds.toString(),
      '-c:a', 'aac',
      '-b:a', '192k',
      silentPath
    ]);

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve(silentPath);
      } else {
        reject(new Error('Failed to create silent audio'));
      }
    });
  });
}

// Add this function to validate audio file
async function validateAudioFile(audioPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', [
      '-v', 'error',
      '-i', audioPath,
      '-f', 'null',
      '-'
    ]);

    let hasError = false;
    ffmpeg.stderr.on('data', () => {
      hasError = true;
    });

    ffmpeg.on('close', (code) => {
      resolve(code === 0 && !hasError);
    });
  });
}

// Enhanced random music download with validation
async function downloadRandomMusic(tempDir: string): Promise<string> {
  const musicPath = path.join(tempDir, `background_music_${Date.now()}.mp3`);
  
  // Verified working music sources (these definitely work)
  const musicSources = [
    // Direct links to known working files
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3',
  ];

  // Try up to 3 different sources
  for (let attempt = 0; attempt < 3; attempt++) {
    const randomSource = musicSources[Math.floor(Math.random() * musicSources.length)];
    console.log(`🎵 Download attempt ${attempt + 1}/3 from: ${randomSource.substring(0, 50)}...`);

    try {
      await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(musicPath);
        
        const request = https.get(randomSource, (response) => {
          // Handle redirects
          if (response.statusCode === 301 || response.statusCode === 302) {
            https.get(response.headers.location!, (redirectResponse) => {
              redirectResponse.pipe(file);
              file.on('finish', () => {
                file.close();
                resolve(true);
              });
            }).on('error', reject);
          } else if (response.statusCode === 200) {
            response.pipe(file);
            file.on('finish', () => {
              file.close();
              resolve(true);
            });
          } else {
            reject(new Error(`HTTP ${response.statusCode}`));
          }
        }).on('error', reject);

        // Timeout after 10 seconds
        request.setTimeout(10000, () => {
          request.destroy();
          reject(new Error('Download timeout'));
        });
      });

      // Validate the downloaded file
      console.log("🔍 Validating audio file...");
      const isValid = await validateAudioFile(musicPath);
      
      if (isValid) {
        console.log(`✅ Music downloaded and validated: ${musicPath}`);
        return musicPath;
      } else {
        console.log("❌ Audio file corrupted, trying next source...");
        if (fs.existsSync(musicPath)) fs.unlinkSync(musicPath);
      }
    } catch (error) {
      console.log(`❌ Download failed: ${error}`);
      if (fs.existsSync(musicPath)) fs.unlinkSync(musicPath);
    }
  }

  // If all downloads fail, create silent audio as fallback
  console.log("⚠️ All downloads failed. Creating silent audio as fallback...");
  return await createSilentAudio(tempDir, 30); // Default 30 seconds
}

// Modified generateReelFile with better error handling
async function generateReelFile(reelNumber: number, retryCount = 0): Promise<ReelResult> {
  const timestamp = Date.now();
  const rootDir = process.cwd();
  const tempDir = path.resolve(rootDir, "temp");
  const reelsDir = path.resolve(rootDir, "public", "reels");
  
  let musicPath = '';
  try {
    musicPath = await downloadRandomMusic(tempDir);
  } catch (error) {
    console.log("⚠️ Using silent audio as final fallback...");
    musicPath = await createSilentAudio(tempDir, 30);
  }

  // 1. DYNAMIC RANDOM DURATION (20 to 50 seconds)
  const durationSeconds = Math.floor(Math.random() * (50 - 20 + 1)) + 20;
  const fps = 25; 
  const totalFrames = Math.floor(durationSeconds * fps);

  console.log(`\n🎬 [Reel ${reelNumber}/4] Creating ${durationSeconds}s Reel (Attempt ${retryCount + 1})...`);

  // Ensure directories exist
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  if (!fs.existsSync(reelsDir)) fs.mkdirSync(reelsDir, { recursive: true });

  const quote = await getRandomQuote();
  const imagePath = path.join(tempDir, `frame-${timestamp}.png`);
  const videoFileName = `reel-${timestamp}.mp4`;
  const videoOutputPath = path.join(reelsDir, videoFileName);

  // 2. RENDER THE FRAME
  const imageBuffer = await createReelFrame(quote);
  fs.writeFileSync(imagePath, imageBuffer);

  return new Promise((resolve, reject) => {
    // 3. FFMPEG SPAWN with better error handling
    const ffmpeg = spawn('ffmpeg', [
      '-y',
      '-loop', '1',
      '-i', imagePath,
      '-i', musicPath,
      '-vf', "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1",
      '-c:v', 'libx264',
      '-preset', 'veryfast', 
      '-crf', '18',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest', // This ensures it stops when shortest input ends
      '-af', `afade=t=out:st=${durationSeconds - 2}:d=2`,
      '-t', `${durationSeconds}`,
      '-max_muxing_queue_size', '1024', // Prevent queue overflow
      videoOutputPath
    ]);

    let ffmpegError = '';
    ffmpeg.stderr.on('data', (data) => {
      const line = data.toString();
      ffmpegError += line;
      if (line.includes('time=')) {
        const timeMatch = line.match(/time=(\d{2}:\d{2}:\d{2}.\d{2})/);
        if (timeMatch) {
          process.stdout.write(`⏳ Encoding: ${timeMatch[1]} / 00:00:${durationSeconds}\r`);
        }
      }
    });

    ffmpeg.on('close', async (code) => {
      // Clean up files
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      if (fs.existsSync(musicPath)) fs.unlinkSync(musicPath);

      if (code === 0) {
        console.log(`\n✅ Reel ${reelNumber} Complete! (${durationSeconds}s)`);
        resolve({ 
          videoUrl: `${process.env.SERVER_URL}/public/reels/${videoFileName}`, 
          quote: quote 
        });
      } else {
        console.error(`\n❌ FFmpeg failed with code ${code}`);
        console.error(`Error details: ${ffmpegError.substring(0, 500)}...`);
        
        // Retry with different approach
        if (retryCount < 2) {
          console.log("🔄 Retrying generation with different settings...");
          // Wait a bit before retry
          await new Promise(r => setTimeout(r, 2000));
          resolve(await generateReelFile(reelNumber, retryCount + 1));
        } else {
          reject(new Error(`FFmpeg failed repeatedly with code ${code}`));
        }
      }
    });

    // Add timeout for FFmpeg process
    setTimeout(() => {
      ffmpeg.kill();
      reject(new Error('FFmpeg process timed out'));
    }, 120000); // 2 minute timeout
  });
}