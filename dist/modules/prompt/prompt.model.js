"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptModel = void 0;
const mongoose_1 = require("mongoose");
const PromptSchema = new mongoose_1.Schema({
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
exports.PromptModel = (0, mongoose_1.model)('Prompt', PromptSchema);
