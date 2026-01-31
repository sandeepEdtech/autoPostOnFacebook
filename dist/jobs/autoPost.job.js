"use strict";
// import cron from 'node-cron'
// import { generateImage } from '../services/gemini.service'
// import { uploadImage } from '../services/upload.service'
// import { postToBuffer } from '../services/buffer.service'
// import { PostModel } from '../modules/post/post.model'
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupOldImages = cleanupOldImages;
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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const POSTS_DIR = path_1.default.join(process.cwd(), "public", "posts");
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
function cleanupOldImages() {
    if (!fs_1.default.existsSync(POSTS_DIR))
        return;
    const now = Date.now();
    fs_1.default.readdirSync(POSTS_DIR).forEach(file => {
        const filePath = path_1.default.join(POSTS_DIR, file);
        try {
            const stats = fs_1.default.statSync(filePath);
            const age = now - stats.mtimeMs;
            if (age > MAX_AGE_MS) {
                fs_1.default.unlinkSync(filePath);
                console.log(`🧹 Deleted old image: ${file}`);
            }
        }
        catch (err) {
            console.error("Cleanup error:", err);
        }
    });
}
