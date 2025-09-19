import Queue from 'bull'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

export const deadLetterQueue = new Queue('analysis dead-letter', redisUrl, {
  defaultJobOptions: {
    removeOnComplete: false,
    removeOnFail: false,
  },
})
