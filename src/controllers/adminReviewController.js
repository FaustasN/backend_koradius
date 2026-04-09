import { db } from '../config/db.js';



export async function getAllReviews(_req, res, next) {
  try {
    const result = await db.query(`
      SELECT *
      FROM reviews
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
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

export async function approveReview(req, res, next) {
  try {
    const { id } = req.params;
    const { featured } = req.body ?? {};

    const result = await db.query(
      `
      UPDATE reviews
      SET is_approved = true,
          is_featured = $1,
          approved_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
      `,
      [featured ?? false, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Review not found'
      });
    }

    res.json({
      message: 'Review approved',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

export async function unapproveReview(req, res, next) {
  try {
    const { id } = req.params;

    const result = await db.query(
      `
      UPDATE reviews
      SET is_approved = false,
          is_featured = false,
          approved_at = NULL
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Review not found'
      });
    }

    res.json({
      message: 'Review unapproved',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

export async function updateReview(req, res, next) {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      rating,
      comment,
      trip_reference,
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
      UPDATE reviews
      SET name = $1,
          email = $2,
          rating = $3,
          comment = $4,
          trip_reference = $5
      WHERE id = $6
      RETURNING *
      `,
      [
        name,
        email,
        Number(rating),
        comment,
        trip_reference ?? tripReference ?? null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Review not found'
      });
    }

    res.json({
      message: 'Review updated',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteReview(req, res, next) {
  try {
    const { id } = req.params;

    const result = await db.query(
      `
      DELETE FROM reviews
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Review not found'
      });
    }

    res.json({
      message: 'Review deleted'
    });
  } catch (error) {
    next(error);
  }
}