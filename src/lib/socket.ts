// src/lib/socket.ts
import { Server as SocketServer } from 'socket.io'
import { NextApiResponse } from 'next'
import { Server as NetServer } from 'http'
import { prisma } from './prisma'
import { 
  storeUserSocket, 
  removeUserSocket, 
  setUserOnline, 
  setUserOffline, 
  getUserSocket,
  getOnlineUsers
} from './redis'

export const initSocket = (server: NetServer, res: NextApiResponse) => {
  console.log('=== INITIALIZING SOCKET.IO SERVER ===')
  
  const io = new SocketServer(server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  })

  io.use(async (socket, next) => {
    console.log('Socket middleware - authenticating...')
    const token = socket.handshake.auth.token
    console.log('Token received:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN')
    
    if (!token) {
      console.log('No token provided')
      return next(new Error('Authentication error: No token'))
    }
    
    const { verifyToken } = await import('./auth')
    const decoded = verifyToken(token)
    
    if (!decoded) {
      console.log('Invalid token')
      return next(new Error('Authentication error: Invalid token'))
    }
    
    console.log('User authenticated:', decoded.userId)
    socket.data.userId = decoded.userId
    next()
  })

  io.on('connection', async (socket) => {
    const userId = socket.data.userId
    console.log(`🟢 User ${userId} connected, socket ID: ${socket.id}`)
    
    try {
      // Store socket connection
      await storeUserSocket(userId, socket.id)
      await setUserOnline(userId)
      
      // Update user status in database
      await prisma.user.update({
        where: { id: userId },
        data: { 
          status: 'ONLINE', 
          lastSeen: new Date() 
        }
      })
      
      // Broadcast online status to all connected clients
      console.log(`Broadcasting user:online for ${userId}`)
      socket.broadcast.emit('user:online', { userId })
      
      // Send current online users to the newly connected user
      const onlineUsersList = await getOnlineUsers()
      console.log('Current online users:', onlineUsersList)
      socket.emit('users:online', { userIds: onlineUsersList })
      
      // Join user's personal room
      socket.join(`user:${userId}`)
      
      console.log(`✅ User ${userId} fully connected, online users count: ${onlineUsersList.length}`)
    } catch (error) {
      console.error('Error in connection handler:', error)
      socket.emit('error', { message: 'Failed to initialize connection' })
    }
    
    socket.on('message:send', async (data) => {
      console.log(`📨 Message send from ${userId}:`, data)
      const { conversationId, content } = data
      
      try {
        // Save message to database
        const message = await prisma.message.create({
          data: {
            content,
            senderId: userId,
            conversationId,
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              }
            }
          }
        })
        
        // Get conversation participants
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: {
            users: {
              select: { id: true }
            }
          }
        })
        
        // Send message to all participants
        if (conversation) {
          for (const user of conversation.users) {
            const userSocketId = await getUserSocket(user.id)
            if (userSocketId) {
              console.log(`Sending message to user ${user.id} via socket ${userSocketId}`)
              io.to(userSocketId).emit('message:new', message)
            }
          }
        }
      } catch (error) {
        console.error('Error sending message:', error)
      }
    })
    
    socket.on('typing:start', async (data) => {
      const { conversationId } = data
      console.log(`⌨️ User ${userId} started typing in ${conversationId}`)
      
      try {
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { users: { select: { id: true } } }
        })
        
        if (conversation) {
          for (const user of conversation.users) {
            if (user.id !== userId) {
              const userSocketId = await getUserSocket(user.id)
              if (userSocketId) {
                io.to(userSocketId).emit('typing:start', {
                  conversationId,
                  userId,
                })
              }
            }
          }
        }
      } catch (error) {
        console.error('Error handling typing start:', error)
      }
    })
    
    socket.on('typing:stop', async (data) => {
      const { conversationId } = data
      console.log(`⌨️ User ${userId} stopped typing in ${conversationId}`)
      
      try {
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { users: { select: { id: true } } }
        })
        
        if (conversation) {
          for (const user of conversation.users) {
            if (user.id !== userId) {
              const userSocketId = await getUserSocket(user.id)
              if (userSocketId) {
                io.to(userSocketId).emit('typing:stop', {
                  conversationId,
                  userId
                })
              }
            }
          }
        }
      } catch (error) {
        console.error('Error handling typing stop:', error)
      }
    })
    
    socket.on('disconnect', async (reason) => {
      console.log(`🔴 User ${userId} disconnected, reason: ${reason}`)
      try {
        await removeUserSocket(userId)
        await setUserOffline(userId)
        
        await prisma.user.update({
          where: { id: userId },
          data: { 
            status: 'OFFLINE', 
            lastSeen: new Date() 
          }
        })
        
        socket.broadcast.emit('user:offline', { userId })
        console.log(`User ${userId} disconnected and marked offline`)
      } catch (error) {
        console.error('Error in disconnect handler:', error)
      }
    })
  })

  io.on('error', (error) => {
    console.error('Socket.IO server error:', error)
  })

  console.log('✅ Socket.IO server initialized and listening')
  return io
}