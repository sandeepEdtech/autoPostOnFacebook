import dotenv from 'dotenv'

dotenv.config()

export const env = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI as string,

  // Gemini
  GEMINI_API_KEY: process.env.GEMINI_API_KEY as string,
  GEMINI_IMAGE_URL: process.env.GEMINI_IMAGE_URL as string,

  // OpenAI
  OPENAI_API_KEY: process.env.OPENAI_API_KEY as string,
  HF_API_KEY: process.env.HF_API_KEY || "",
  // Cloudinary
  CLOUDINARY_NAME: process.env.CLOUDINARY_NAME as string,
  CLOUDINARY_KEY: process.env.CLOUDINARY_KEY as string,
  CLOUDINARY_SECRET: process.env.CLOUDINARY_SECRET as string,

  // Buffer
  BUFFER_TOKEN: process.env.BUFFER_TOKEN as string,
   // ✅ FACEBOOK (NEW — THIS FIXES YOUR ERROR)
   FB_PAGE_ID: process.env.FB_PAGE_ID || "",
   FB_PAGE_TOKEN: process.env.FB_PAGE_TOKEN || "",
   BASE_URL:process.env.BASE_URL || "",
   IG_BUSINESS_ID:process.env.IG_BUSINESS_ID || ""
}
