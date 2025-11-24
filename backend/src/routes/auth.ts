import express from 'express'
import db from '../config/database'
import bcrypt from 'bcryptjs'

const router = express.Router()

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' })
    }

    const { rows } = await db.query('SELECT * FROM users WHERE username = $1', [username])
    const user = rows[0]

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const isValid = await bcrypt.compare(password, user.password_hash)

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // Simple token (production'da JWT kullanılmalı)
    const token = Buffer.from(`${user.id}:${user.username}:${Date.now()}`).toString('base64')

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    })
  } catch (error: any) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Verify token (basit)
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const token = authHeader.substring(7)
    // Basit token doğrulama (production'da JWT kullanılmalı)
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [userId] = decoded.split(':')

    const { rows } = await db.query('SELECT id, username, role FROM users WHERE id = $1', [userId])
    const user = rows[0]

    if (!user) {
      return res.status(401).json({ message: 'Invalid token' })
    }

    res.json({ user })
  } catch (error: any) {
    res.status(401).json({ message: 'Invalid token' })
  }
})

export default router
