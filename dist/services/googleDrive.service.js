"use strict";
// import { google } from 'googleapis';
// import fs from 'fs';
// import path from 'path';
// import { env } from '../config/env';
// // Load credentials from environment or file
// const credentials = JSON.parse(
//   process.env.GOOGLE_DRIVE_CREDENTIALS || 
//   fs.readFileSync(path.join(process.cwd(), 'google-credentials.json'), 'utf8')
// );
// // Authenticate with Google Drive
// const auth = new google.auth.GoogleAuth({
//   credentials: credentials,
//   scopes: ['https://www.googleapis.com/auth/drive.file'],
// });
// const drive = google.drive({ version: 'v3', auth });
// /**
//  * Upload image to Google Drive and get public URL
//  */
// export async function uploadToGoogleDrive(
//   imagePath: string,
//   folderId: string = process.env.GOOGLE_DRIVE_FOLDER_ID || 'root'
// ): Promise<string> {
//   try {
//     console.log('📤 Uploading to Google Drive...');
//     // Upload file
//     const response = await drive.files.create({
//       requestBody: {
//         name: `social-post-${Date.now()}.png`,
//         parents: [folderId],
//       },
//       media: {
//         mimeType: 'image/png',
//         body: fs.createReadStream(imagePath),
//       },
//       fields: 'id',
//     });
//     const fileId = response.data.id;
//     console.log(`✅ File uploaded to Google Drive. ID: ${fileId}`);
//     // Make file publicly readable
//     await drive.permissions.create({
//       fileId: fileId,
//       requestBody: {
//         role: 'reader',
//         type: 'anyone',
//       },
//     });
//     // Get direct download URL
//     const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
//     // Alternative: Get web view link (for debugging)
//     const fileInfo = await drive.files.get({
//       fileId: fileId,
//       fields: 'webViewLink, webContentLink',
//     });
//     console.log(`🔗 Direct URL: ${directUrl}`);
//     console.log(`🌐 Web View Link: ${fileInfo.data.webViewLink}`);
//     return directUrl;
//   } catch (error) {
//     console.error('❌ Google Drive upload failed:', error);
//     throw error;
//   }
// }
// /**
//  * Delete old files from Google Drive (cleanup)
//  */
// export async function cleanupGoogleDrive(daysOld: number = 7): Promise<void> {
//   try {
//     const cutoffDate = new Date();
//     cutoffDate.setDate(cutoffDate.getDate() - daysOld);
//     const response = await drive.files.list({
//       q: `name contains 'social-post-' and createdTime < '${cutoffDate.toISOString()}'`,
//       fields: 'files(id, name)',
//     });
//     for (const file of response.data.files || []) {
//       await drive.files.delete({ fileId: file.id! });
//       console.log(`🧹 Deleted old file: ${file.name}`);
//     }
//   } catch (error) {
//     console.error('❌ Google Drive cleanup failed:', error);
//   }
// }
// /**
//  * Get shareable link with proper format for Instagram
//  */
// export async function getInstagramReadyUrl(imagePath: string): Promise<string> {
//   const driveUrl = await uploadToGoogleDrive(imagePath);
//   // Convert Google Drive URL to direct image URL
//   // Format: https://drive.google.com/uc?export=view&id=FILE_ID
//   return driveUrl;
// }
