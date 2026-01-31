import { app } from './app'
import './jobs/autoPost.job'
import { env } from './config/env'

app.listen(env.PORT, () => {
  console.log(`🚀 Server running on port ${env.PORT}`)
})
