import express from 'express'
import db from '../config/database'

const router = express.Router()

// Get all settings
router.get('/', async (req, res) => {
  try {
    const { rows: settings } = await db.query('SELECT * FROM settings')
    const settingsObj: any = {}
    settings.forEach((setting: any) => {
      settingsObj[setting.key] = {
        value: setting.value,
        description: setting.description,
        updated_at: setting.updated_at
      }
    })
    res.json(settingsObj)
  } catch (error: any) {
    console.error('Get settings error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Get single setting
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params
    const { rows } = await db.query('SELECT * FROM settings WHERE key = $1', [key])
    const setting = rows[0]

    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' })
    }

    res.json({ key: setting.key, value: setting.value, description: setting.description })
  } catch (error: any) {
    console.error('Get setting error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Update setting
router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params
    const { value, description } = req.body

    const query = `
      INSERT INTO settings (key, value, description, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        description = COALESCE(excluded.description, settings.description),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `

    const { rows } = await db.query(query, [key, value, description || null])
    res.json(rows[0])
  } catch (error: any) {
    console.error('Update setting error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Delete setting
router.delete('/:key', async (req, res) => {
  try {
    const { key } = req.params
    const { rowCount } = await db.query('DELETE FROM settings WHERE key = $1', [key])

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Setting not found' })
    }

    res.json({ message: 'Setting deleted successfully' })
  } catch (error: any) {
    console.error('Delete setting error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

export default router
