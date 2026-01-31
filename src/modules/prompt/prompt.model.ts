import { Schema, model } from 'mongoose'

const PromptSchema = new Schema({
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
})

export const PromptModel = model('Prompt', PromptSchema)
