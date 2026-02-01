import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import { env } from "../config/env";

// Use environment variables for these
const PAGE_ACCESS_TOKEN = env.FB_PAGE_TOKEN;
const PAGE_ID = env.FB_PAGE_ID;

export async function postImageDirectlyToFacebook(
  imagePath: string,
  caption: string
): Promise<any> {
    console.log(PAGE_ACCESS_TOKEN, PAGE_ID,"we are consoling ")
  if (!PAGE_ACCESS_TOKEN || !PAGE_ID) {
    throw new Error("Facebook credentials not configured");
  }

  const formData = new FormData();
  formData.append("source", fs.createReadStream(imagePath));
  formData.append("caption", caption);
  formData.append("access_token", PAGE_ACCESS_TOKEN);

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${PAGE_ID}/photos`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Facebook API Error Details:", error.response?.data);
    throw error;
  }
}

// services/facebook.service.ts

export async function postToInstagram(fileName: string, caption: string) {
  // Combine the base URL with the static path and filename
  const publicImageUrl = `${process.env.SERVER_URL}/public/posts/${fileName}`;
  
  console.log("🔗 Sending this URL to Instagram:", publicImageUrl);

  const IG_ID = process.env.IG_BUSINESS_ID;
  const TOKEN = process.env.FB_PAGE_TOKEN;

  // Step 1: Create Container
  const container = await axios.post(`https://graph.facebook.com/v19.0/${IG_ID}/media`, {
    image_url: publicImageUrl, // This MUST be a full https:// link
    caption: caption,
    access_token: TOKEN
  });

  const creationId = container.data.id;

  // Step 2: Delay for processing (Instagram needs time to download it)
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Step 3: Publish
  const publish = await axios.post(`https://graph.facebook.com/v19.0/${IG_ID}/media_publish`, {
    creation_id: creationId,
    access_token: TOKEN
  });

  return publish.data;
}

  // Combined function to post to both platforms
export async function postToBothPlatforms(
    imagePath: string,
    caption: string,
    publicImageUrl?: string
  ): Promise<{
    facebook: any;
    instagram?: any;
  }> {
    const results: any = {};
  
    try {
      // Post to Facebook
      results.facebook = await postImageDirectlyToFacebook(imagePath, caption);
      console.log("✅ Posted to Facebook:", results.facebook.id);
    } catch (fbError) {
      console.error("❌ Facebook post failed:", fbError);
      throw fbError;
    }
  
    // If Instagram credentials exist, post there too
    if (env.IG_BUSINESS_ID && publicImageUrl) {
      try {
        // Instagram needs a PUBLIC URL, not local file
        results.instagram = await postToInstagram(publicImageUrl, caption);
        console.log("✅ Posted to Instagram:", results.instagram.id);
      } catch (igError) {
        console.error("❌ Instagram post failed (continuing anyway):", igError);
        // Don't throw - continue even if Instagram fails
      }
    } else {
      console.log("⚠️ Instagram not configured or no public URL provided");
    }
  
    return results;
  }
  