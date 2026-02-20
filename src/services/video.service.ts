import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import ffmpegPath from 'ffmpeg-static';

// Critical: Points the library to the internal FFmpeg engine
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}



export async function createTalkingInfluencerReel(text: string, imageName: string, outputPath: string) {
    const imagePath = path.join(process.cwd(), 'public', 'influencer_images', imageName);
    const audioPath = path.join(process.cwd(), 'public', 'music', 'trending_track.mp3');
  
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(imagePath)
        .inputOptions(['-loop 1']) // Robust way to loop a single image
        .input(audioPath)
        .outputOptions([
          '-c:v libx264',        // Standard video codec
          '-tune stillimage',    // Optimizes for static photos
          '-pix_fmt yuv420p',    // Mandatory for QuickTime compatibility
          '-c:a aac',            // Mandatory for Mac audio
          '-shortest',           // Stop video when audio ends
          '-movflags +faststart', // Fixes "moov atom not found" error
          '-vf scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920' // Forces Reel size
        ])
        .on('start', (cmd) => console.log("🚀 Executing FFmpeg:", cmd))
        .on('end', () => resolve(outputPath))
        .on('error', (err) => {
          console.error("❌ FFmpeg Failed:", err.message);
          reject(err);
        })
        .save(outputPath);
    });
  }