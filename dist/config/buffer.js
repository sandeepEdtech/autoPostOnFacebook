"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bufferClient = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("./env");
exports.bufferClient = axios_1.default.create({
    baseURL: 'https://api.bufferapp.com/1',
    headers: {
        Authorization: `Bearer ${env_1.env.BUFFER_TOKEN}`,
        'Content-Type': 'application/json'
    }
});
