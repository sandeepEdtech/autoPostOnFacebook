import { Schema, model } from 'mongoose'

const PostSchema = new Schema({
  prompt: String,
  imageUrl: String,
  bufferPostId: String,
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
})

export const PostModel = model('Post', PostSchema)
