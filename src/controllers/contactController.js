import { db } from '../config/db.js';

export async function createContactRequest(req, res, next) {
  try {
    const {
      name,
      email,
      phone,
      subject,
      message,
      preferredContact,
      urgency
    } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        message: 'Missing required fields'
      });
    }

    const result = await db.query(
      `
      INSERT INTO contacts
      (name, email, phone, subject, message, preferred_contact, urgency)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [name, email, phone || null, subject, message, preferredContact || null, urgency || null]
    );

    res.status(201).json({
      message: 'Contact request created',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}
export async function getAllContacts(_req, res, next) {
  try {
    const result = await db.query(`
      SELECT *
      FROM contacts
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}
export async function resolveContact(req, res, next) {
  try {
    const { id } = req.params;

    const result = await db.query(
      `
      UPDATE contacts
      SET is_resolved = true,
          resolved_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Contact not found'
      });
    }

    res.json({
      message: 'Contact resolved',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

export async function unresolveContact(req, res, next) {
  try {
    const { id } = req.params;

    const result = await db.query(
      `
      UPDATE contacts
      SET is_resolved = false,
          resolved_at = NULL
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Contact not found'
      });
    }

    res.json({
      message: 'Contact unresolved',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}