import { bufferClient } from '../config/buffer'

export async function postToBuffer(
  imageUrl: string,
  caption: string,
  profileIds: string[]
) {
  const response = await bufferClient.post('/updates/create.json', {
    profile_ids: profileIds,
    text: caption,
    media: {
      photo: imageUrl
    }
  })

  return response.data
}
