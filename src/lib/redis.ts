import Redis from 'ioredis'

let redisInstance: Redis | null = null

export const getRedis = () => {
  if (redisInstance) return redisInstance

  const url = process.env.REDIS_URL
  if (!url) {
    if (process.env.NODE_ENV === 'production') {
       console.warn('⚠️ REDIS_URL не найден. Использование дефолтного хоста для предотвращения падения билда.')
    }
    return new Redis(url || 'redis://localhost:6379', {
      lazyConnect: true // Предотвращает попытку подключения во время билда
    }) 
  }

  redisInstance = new Redis(url)
  return redisInstance
}

// Store user socket ID
export const storeUserSocket = async (userId: string, socketId: string) => {
  await getRedis().hset('user:sockets', userId, socketId)
}

export const getUserSocket = async (userId: string) => {
  return await getRedis().hget('user:sockets', userId)
}

export const removeUserSocket = async (userId: string) => {
  await getRedis().hdel('user:sockets', userId)
}

// Store online users
export const setUserOnline = async (userId: string) => {
  const redis = getRedis()
  await redis.sadd('online:users', userId)
  await redis.set(`user:${userId}:lastSeen`, Date.now())
}

export const setUserOffline = async (userId: string) => {
  await getRedis().srem('online:users', userId)
}

export const getOnlineUsers = async () => {
  return await getRedis().smembers('online:users')
}

export const isUserOnline = async (userId: string) => {
  return await getRedis().sismember('online:users', userId)
}