"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postToBuffer = postToBuffer;
const buffer_1 = require("../config/buffer");
async function postToBuffer(imageUrl, caption, profileIds) {
    const response = await buffer_1.bufferClient.post('/updates/create.json', {
        profile_ids: profileIds,
        text: caption,
        media: {
            photo: imageUrl
        }
    });
    return response.data;
}
