import { db } from '../config/db.js';

export async function getAllGalleryItems(_req, res, next) {
  try {
    const result = await db.query(`
      SELECT *
      FROM gallery
      WHERE is_active = true
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

export async function createGalleryItem(req, res, next) {
  try {
    const {
      title,
      location,
      category,
      imageUrl,
      photographer
    } = req.body;

    if (!title || !location || !category || !imageUrl || !photographer) {
      return res.status(400).json({
        message: 'Missing required fields'
      });
    }

    const result = await db.query(
      `
      INSERT INTO gallery
      (title, location, category, image_url, photographer)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [title, location, category, imageUrl, photographer]
    );

    res.status(201).json({
      message: 'Gallery item created',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

export async function updateGalleryItem(req, res, next) {
  try {
    const { id } = req.params;
    const {
      title,
      location,
      category,
      imageUrl,
      photographer
    } = req.body;

    if (!title || !location || !category || !imageUrl || !photographer) {
      return res.status(400).json({
        message: 'Missing required fields'
      });
    }

    const result = await db.query(
      `
      UPDATE gallery
      SET title = $1,
          location = $2,
          category = $3,
          image_url = $4,
          photographer = $5,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
      `,
      [title, location, category, imageUrl, photographer, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Gallery item not found'
      });
    }

    res.json({
      message: 'Gallery item updated',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteGalleryItem(req, res, next) {
  try {
    const { id } = req.params;

    const result = await db.query(
      `
      UPDATE gallery
      SET is_active = false,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Gallery item not found'
      });
    }

    res.json({
      message: 'Gallery item deleted'
    });
  } catch (error) {
    next(error);
  }
}

export async function likeGalleryItem(req, res, next) {
  try {
    const { id } = req.params;
    const { action } = req.body;

    let result;

    if (action === 'like') {
      result = await db.query(
        `
        UPDATE gallery
        SET likes = likes + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING likes
        `,
        [id]
      );
    } else if (action === 'unlike') {
      result = await db.query(
        `
        UPDATE gallery
        SET likes = GREATEST(likes - 1, 0),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING likes
        `,
        [id]
      );
    } else {
      return res.status(400).json({
        message: 'Invalid action'
      });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Gallery item not found'
      });
    }

    res.json({
      likes: result.rows[0].likes
    });
  } catch (error) {
    next(error);
  }
}