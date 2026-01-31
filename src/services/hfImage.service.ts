// import axios from "axios";
// import { env } from "../config/env";

// const MODEL_URL =
//   "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5";


// async function callHF(prompt: string): Promise<Buffer> {
//   const response = await axios.post(
//     MODEL_URL,
//     {
//       inputs: prompt,
//       options: { wait_for_model: true }
//     },
//     {
//       headers: {
//         Authorization: `Bearer ${env.HF_API_KEY}`
//       },
//       responseType: "arraybuffer",
//       timeout: 120000
//     }
//   );

//   const contentType = response.headers["content-type"];

//   // HF returned JSON instead of image
//   if (!contentType || !contentType.includes("image")) {
//     const text = Buffer.from(response.data).toString("utf-8");
//     throw new Error(text);
//   }

//   return Buffer.from(response.data);
// }

// export async function generateAIImage(
//   prompt: string
// ): Promise<Buffer> {
//   try {
//     return await callHF(prompt);
//   } catch (err: any) {
//     // 🔁 retry once after delay (HF cold start)
//     if (err.message?.includes("loading")) {
//       console.log("HF model loading, retrying in 15s...");
//       await new Promise(res => setTimeout(res, 15000));
//       return await callHF(prompt);
//     }
//     throw err;
//   }
// }


import axios from "axios";
import { env } from "../config/env";

const MODEL_URL =
  "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5";

async function callHF(prompt: string): Promise<Buffer> {
  const response = await axios.post(
    MODEL_URL,
    {
      inputs: prompt,
      options: { wait_for_model: true }
    },
    {
      headers: {
        Authorization: `Bearer ${env.HF_API_KEY}`
      },
      responseType: "arraybuffer",
      timeout: 120000
    }
  );

  const contentType = response.headers["content-type"];

  if (!contentType || !contentType.includes("image")) {
    const text = Buffer.from(response.data).toString("utf-8");
    throw new Error(text);
  }

  return Buffer.from(response.data);
}

export async function generateAIImage(
  prompt: string
): Promise<Buffer> {
  try {
    return await callHF(prompt);
  } catch (err: any) {
    if (err.message?.includes("loading")) {
      console.log("HF model loading, retrying in 20s...");
      await new Promise(res => setTimeout(res, 20000));
      return await callHF(prompt);
    }
    throw err;
  }
}
