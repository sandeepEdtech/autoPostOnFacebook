"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = uploadImage;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
async function uploadImage(base64) {
    const result = await cloudinary_1.default.uploader.upload(`data:image/png;base64,${base64}`, { folder: 'ai-posts' });
    return result.secure_url;
}
