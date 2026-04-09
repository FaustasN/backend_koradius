import { db } from '../config/db.js';

export async function createReview(req, res, next) {
  try {
    const {
      name,
      email,
      rating,
      comment,
      tripReference
    } = req.body;

    if (!name || !email || !comment || !rating) {
      return res.status(400).json({
        message: 'Missing required fields'
      });
    }

    if (Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({
        message: 'Rating must be between 1 and 5'
      });
    }

    const result = await db.query(
      `
      INSERT INTO reviews
      (name, email, rating, comment, trip_reference)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        name,
        email,
        Number(rating),
        comment,
        tripReference || null
      ]
    );

    res.status(201).json({
      message: 'Review created',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

export async function getApprovedReviews(_req, res, next) {
  try {
    const result = await db.query(`
      SELECT
        id,
        name,
        rating,
        comment,
        trip_reference,
        is_featured,
        created_at
      FROM reviews
      WHERE is_approved = true
      ORDER BY is_featured DESC, created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

