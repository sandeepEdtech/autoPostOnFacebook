import cloudinary from '../config/cloudinary'

export async function uploadImage(base64: string): Promise<string> {
  const result = await cloudinary.uploader.upload(
    `data:image/png;base64,${base64}`,
    { folder: 'ai-posts' }
  )

  return result.secure_url
}
