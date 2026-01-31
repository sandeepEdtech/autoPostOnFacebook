"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRandomQuote = getRandomQuote;
const quotes_1 = require("../data/quotes");
function getRandomQuote() {
    return quotes_1.motivationalQuotes[Math.floor(Math.random() * quotes_1.motivationalQuotes.length)];
}
