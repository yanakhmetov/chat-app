import Redis from 'ioredis'

const getRedisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL
  }
  throw new Error('REDIS_URL is not defined')
}

export const redis = new Redis(getRedisUrl())

// Store user socket ID
export const storeUserSocket = async (userId: string, socketId: string) => {
  await redis.hset('user:sockets', userId, socketId)
}

export const getUserSocket = async (userId: string) => {
  return await redis.hget('user:sockets', userId)
}

export const removeUserSocket = async (userId: string) => {
  await redis.hdel('user:sockets', userId)
}

// Store online users
export const setUserOnline = async (userId: string) => {
  await redis.sadd('online:users', userId)
  await redis.set(`user:${userId}:lastSeen`, Date.now())
}

export const setUserOffline = async (userId: string) => {
  await redis.srem('online:users', userId)
}

export const getOnlineUsers = async () => {
  return await redis.smembers('online:users')
}

export const isUserOnline = async (userId: string) => {
  return await redis.sismember('online:users', userId)
}