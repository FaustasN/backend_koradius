import { db } from '../config/db.js';

export async function getAllTravelPackets(_req, res, next) {
  try {
    const result = await db.query(`
      SELECT *
      FROM travel_packets
      WHERE is_active = true
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

export async function createTravelPacket(req, res, next) {
  try {
    const {
      title,
      location,
      duration,
      price,
      original_price,
      rating,
      reviews,
      category,
      badge,
      description,
      includes,
      available_spots,
      departure,
      image_url,
      is_active
    } = req.body;

    if (
      !title ||
      !location ||
      !duration ||
      price === undefined ||
      price === null ||
      !category ||
      !image_url
    ) {
      return res.status(400).json({
        message: 'Missing required fields'
      });
    }

    const result = await db.query(
      `
      INSERT INTO travel_packets
      (
        title,
        location,
        duration,
        price,
        original_price,
        rating,
        reviews,
        image_url,
        category,
        badge,
        description,
        includes,
        available_spots,
        departure,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
      `,
      [
        title,
        location,
        duration,
        Number(price),
        original_price ? Number(original_price) : null,
        rating !== undefined && rating !== null ? Number(rating) : 0,
        reviews !== undefined && reviews !== null ? Number(reviews) : 0,
        image_url,
        category,
        badge || null,
        description || null,
        Array.isArray(includes) ? includes : [],
        available_spots ? Number(available_spots) : 0,
        departure || null,
        is_active ?? true
      ]
    );

    res.status(201).json({
      message: 'Travel packet created',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTravelPacket(req, res, next) {
  try {
    const { id } = req.params;
    const {
      title,
      location,
      duration,
      price,
      original_price,
      rating,
      reviews,
      category,
      badge,
      description,
      includes,
      available_spots,
      departure,
      image_url,
      is_active
    } = req.body;

    if (
      !title ||
      !location ||
      !duration ||
      price === undefined ||
      price === null ||
      !category ||
      !image_url
    ) {
      return res.status(400).json({
        message: 'Missing required fields'
      });
    }

    const result = await db.query(
      `
      UPDATE travel_packets
      SET title = $1,
          location = $2,
          duration = $3,
          price = $4,
          original_price = $5,
          rating = $6,
          reviews = $7,
          image_url = $8,
          category = $9,
          badge = $10,
          description = $11,
          includes = $12,
          available_spots = $13,
          departure = $14,
          is_active = $15,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $16
      RETURNING *
      `,
      [
        title,
        location,
        duration,
        Number(price),
        original_price ? Number(original_price) : null,
        rating !== undefined && rating !== null ? Number(rating) : 0,
        reviews !== undefined && reviews !== null ? Number(reviews) : 0,
        image_url,
        category,
        badge || null,
        description || null,
        Array.isArray(includes) ? includes : [],
        available_spots ? Number(available_spots) : 0,
        departure || null,
        is_active ?? true,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Travel packet not found'
      });
    }

    res.json({
      message: 'Travel packet updated',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteTravelPacket(req, res, next) {
  try {
    const { id } = req.params;

    const result = await db.query(
      `
      UPDATE travel_packets
      SET is_active = false,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Travel packet not found'
      });
    }

    res.json({
      message: 'Travel packet deleted'
    });
  } catch (error) {
    next(error);
  }
}