import axios from 'axios'
import { env } from '../config/env'

export async function generateImage(prompt: string): Promise<string> {
  const response = await axios.post(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent',
    {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    },
    {
      params: {
        key: env.GEMINI_API_KEY
      },
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )

  const parts = response.data?.candidates?.[0]?.content?.parts

  if (!parts) {
    throw new Error('No content returned from Gemini')
  }

  const imagePart = parts.find(
    (p: any) => p.inlineData && p.inlineData.data
  )

  if (!imagePart) {
    throw new Error('No image data returned from Gemini')
  }

  return imagePart.inlineData.data
}
