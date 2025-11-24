import express from 'express'
import db from '../config/database'

const router = express.Router()

// Get statistics (must be before /:id route)
router.get('/stats/summary', async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_books,
        COALESCE(SUM(pages), 0) as total_pages,
        COALESCE(AVG(rating), 0) as avg_rating,
        COUNT(CASE WHEN finished_date >= NOW() - INTERVAL '30 days' THEN 1 END) as monthly_books
      FROM books
    `
    const { rows: statsRows } = await db.query(statsQuery)
    const stats = statsRows[0]

    const topCategoryQuery = `
      SELECT category, COUNT(*) as count
      FROM books
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY count DESC
      LIMIT 1
    `
    const { rows: topCategoryRows } = await db.query(topCategoryQuery)
    const topCategory = topCategoryRows[0]

    const favoriteBookQuery = `
      SELECT title, rating
      FROM books
      WHERE rating IS NOT NULL
      ORDER BY rating DESC, finished_date DESC
      LIMIT 1
    `
    const { rows: favoriteBookRows } = await db.query(favoriteBookQuery)
    const favoriteBook = favoriteBookRows[0]

    res.json({
      totalBooks: parseInt(stats.total_books) || 0,
      totalPages: parseInt(stats.total_pages) || 0,
      avgRating: parseFloat(stats.avg_rating) || 0,
      monthlyBooks: parseInt(stats.monthly_books) || 0,
      topCategory: topCategory?.category || '-',
      favoriteBook: favoriteBook?.title || '-'
    })
  } catch (error: any) {
    console.error('Get stats error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Get all books
router.get('/', async (req, res) => {
  try {
    const { category, level, search } = req.query
    let query = 'SELECT * FROM books WHERE 1=1'
    const params: any[] = []
    let paramCount = 1

    if (category && category !== 'Hepsi') {
      query += ` AND category = $${paramCount++}`
      params.push(category)
    }

    if (level && level !== 'Hepsi') {
      query += ` AND level = $${paramCount++}`
      params.push(level)
    }

    if (search) {
      query += ` AND (title ILIKE $${paramCount} OR author ILIKE $${paramCount} OR notes ILIKE $${paramCount})`
      const searchTerm = `%${search}%`
      params.push(searchTerm)
      // Note: In Postgres, if we use the same parameter multiple times, we can't reuse the $index easily if we push it once.
      // Actually, standard pg driver doesn't support named parameters or reusing $1 multiple times if we only push it once? 
      // Wait, $1 refers to the first element in the array. So yes, we can reuse $1.
      // But here I'm constructing dynamic query.
      // Let's fix the logic.
      // If I use $paramCount for all 3 ILIKEs, I need to push the value once? No, that's not how it works usually unless I use named params.
      // Actually, if I use $paramCount, $paramCount, $paramCount, they all refer to the same index in the array.
      // So I only need to push the value ONCE.
      // But wait, my previous logic was: params.push(searchTerm, searchTerm, searchTerm).
      // That implies $1, $2, $3.
      // If I want to use the same value, I should use the same index.
      // Let's just push it 3 times and increment paramCount 3 times to be safe and simple.

      // Actually, let's correct the query construction:
      query = query.replace(`(title ILIKE $${paramCount} OR author ILIKE $${paramCount} OR notes ILIKE $${paramCount})`,
        `(title ILIKE $${paramCount} OR author ILIKE $${paramCount + 1} OR notes ILIKE $${paramCount + 2})`)
      // Wait, I haven't written the query string yet in the thought block properly.

      // Correct approach:
      query += ` AND (title ILIKE $${paramCount} OR author ILIKE $${paramCount + 1} OR notes ILIKE $${paramCount + 2})`
      params.push(searchTerm, searchTerm, searchTerm)
      paramCount += 3
    }

    query += ' ORDER BY finished_date DESC, created_at DESC'

    const { rows } = await db.query(query, params)
    res.json(rows)
  } catch (error: any) {
    console.error('Get books error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Get book by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { rows } = await db.query('SELECT * FROM books WHERE id = $1', [id])
    const book = rows[0]

    if (!book) {
      return res.status(404).json({ message: 'Book not found' })
    }

    res.json(book)
  } catch (error: any) {
    console.error('Get book error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Create book
router.post('/', async (req, res) => {
  try {
    const {
      title,
      author,
      category,
      level,
      pages,
      finished_date,
      rating,
      mood,
      notes,
      cover_url
    } = req.body

    const query = `
      INSERT INTO books (title, author, category, level, pages, finished_date, rating, mood, notes, cover_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `

    const { rows } = await db.query(query, [
      title,
      author || null,
      category || null,
      level || null,
      pages || 0,
      finished_date || null,
      rating || 3,
      mood || null,
      notes || null,
      cover_url || null
    ])

    res.status(201).json(rows[0])
  } catch (error: any) {
    console.error('Create book error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Update book
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const {
      title,
      author,
      category,
      level,
      pages,
      finished_date,
      rating,
      mood,
      notes,
      cover_url
    } = req.body

    const query = `
      UPDATE books 
      SET title = $1, author = $2, category = $3, level = $4, pages = $5, 
          finished_date = $6, rating = $7, mood = $8, notes = $9, cover_url = $10,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `

    const { rows } = await db.query(query, [
      title,
      author || null,
      category || null,
      level || null,
      pages || 0,
      finished_date || null,
      rating || 3,
      mood || null,
      notes || null,
      cover_url || null,
      id
    ])

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Book not found' })
    }

    res.json(rows[0])
  } catch (error: any) {
    console.error('Update book error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Delete book
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { rowCount } = await db.query('DELETE FROM books WHERE id = $1', [id])

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Book not found' })
    }

    res.json({ message: 'Book deleted successfully' })
  } catch (error: any) {
    console.error('Delete book error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

export default router
