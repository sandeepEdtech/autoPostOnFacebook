import OpenAI from "openai";
import { env } from "../config/env";

if (!env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is missing in .env");
}

const client = new OpenAI({
  apiKey: env.OPENAI_API_KEY
});

export async function generateQuote(): Promise<string> {
  const prompt =
    "Write a short motivational quote (max 15 words) for Instagram.";

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
    max_output_tokens: 50
  });

  const text = response.output_text;

  if (!text) {
    throw new Error("No text returned from OpenAI");
  }

  return text.trim();
}
