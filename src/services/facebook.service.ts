import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import { env } from "../config/env";

const GRAPH_URL = "https://graph.facebook.com/v19.0";
// services/facebook.service.ts
export async function postImageDirectlyToFacebook(
    imagePath: string,
    caption: string
  ) {
    // Check if file exists to avoid stream errors
    if (!fs.existsSync(imagePath)) {
      throw new Error(`File not found at path: ${imagePath}`);
    }
  
    const form = new FormData();
    form.append("source", fs.createReadStream(imagePath));
    form.append("caption", caption);
    form.append("access_token", env.FB_PAGE_TOKEN);
  
    const res = await axios.post(
      `${GRAPH_URL}/${env.FB_PAGE_ID}/photos`,
      form,
      {
        // Important: form-data handles the boundary header automatically
        headers: {
          ...form.getHeaders(),
        },
      }
    );
  
    return res.data;
  }
