import axios from 'axios'
import { env } from './env'

export const bufferClient = axios.create({
  baseURL: 'https://api.bufferapp.com/1',
  headers: {
    Authorization: `Bearer ${env.BUFFER_TOKEN}`,
    'Content-Type': 'application/json'
  }
})
