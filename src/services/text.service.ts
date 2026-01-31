import axios from 'axios'
import { env } from '../config/env'

export async function generateMotivationalText(): Promise<string> {
  const res = await axios.post(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    {
      contents: [
        {
          parts: [
            {
              text:
                'Write one short motivational quote (max 15 words) for social media'
            }
          ]
        }
      ]
    },
    {
      params: { key: env.GEMINI_API_KEY },
      headers: { 'Content-Type': 'application/json' }
    }
  )

  return res.data.candidates[0].content.parts[0].text
}
