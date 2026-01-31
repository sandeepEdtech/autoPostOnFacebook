"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostModel = void 0;
const mongoose_1 = require("mongoose");
const PostSchema = new mongoose_1.Schema({
    prompt: String,
    imageUrl: String,
    bufferPostId: String,
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});
exports.PostModel = (0, mongoose_1.model)('Post', PostSchema);
