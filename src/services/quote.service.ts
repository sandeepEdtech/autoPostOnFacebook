import { motivationalQuotes } from "../data/quotes";

export function getRandomQuote(): string {
  return motivationalQuotes[
    Math.floor(Math.random() * motivationalQuotes.length)
  ];
}
