// import cron from 'node-cron'
// import { generateImage } from '../services/gemini.service'
// import { uploadImage } from '../services/upload.service'
// import { postToBuffer } from '../services/buffer.service'
// import { PostModel } from '../modules/post/post.model'

// const PROFILE_IDS = ['PUT_BUFFER_PROFILE_ID_HERE']

// cron.schedule('0 */6 * * *', async () => {
//   try {
//     const prompt = 'Romantic AI artwork for Instagram'

//     const base64Image = await generateImage(prompt)
//     const imageUrl = await uploadImage(base64Image)

//     const bufferRes = await postToBuffer(
//       imageUrl,
//       'AI Generated Love ❤️',
//       PROFILE_IDS
//     )

//     await PostModel.create({
//       prompt,
//       imageUrl,
//       bufferPostId: bufferRes.updates?.[0]?.id,
//       status: 'posted'
//     })

//     console.log('✅ Post published successfully')
//   } catch (error) {
//     console.error('❌ Auto post failed', error)
//   }
// })


import fs from "fs";
import path from "path";

const POSTS_DIR = path.join(process.cwd(), "public", "posts");
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export function cleanupOldImages() {
  if (!fs.existsSync(POSTS_DIR)) return;

  const now = Date.now();

  fs.readdirSync(POSTS_DIR).forEach(file => {
    const filePath = path.join(POSTS_DIR, file);

    try {
      const stats = fs.statSync(filePath);
      const age = now - stats.mtimeMs;

      if (age > MAX_AGE_MS) {
        fs.unlinkSync(filePath);
        console.log(`🧹 Deleted old image: ${file}`);
      }
    } catch (err) {
      console.error("Cleanup error:", err);
    }
  });
}
