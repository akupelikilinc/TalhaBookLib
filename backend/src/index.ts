import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import db from './config/database'
import { initDatabase } from './config/init-db'
import booksRoutes from './routes/books'
import settingsRoutes from './routes/settings'
import authRoutes from './routes/auth'

dotenv.config()

// Initialize database
// Initialize database
initDatabase().catch(err => {
  console.error('Failed to initialize database:', err)
  process.exit(1)
})

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for frontend
}))
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1')
    res.json({ status: 'ok', database: 'connected' })
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected' })
  }
})

// API Routes
app.use('/api/books', booksRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/auth', authRoutes)

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server')
  await db.end()
  process.exit(0)
})
