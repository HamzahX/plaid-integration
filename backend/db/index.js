'use strict';

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration from environment variables
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'plaid_quickstart',
  user: process.env.DB_USER || 'plaid_user',
  password: process.env.DB_PASSWORD || 'plaid_password',
  // Connection pool settings
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize database schema
async function initializeDatabase() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await pool.query(schema);
    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    // If schema already exists, that's okay
    if (error.code === '42P07') {
      console.log('✅ Database schema already exists');
    } else {
      console.error('❌ Error initializing database schema:', error.message);
      throw error;
    }
  }
}

// Test database connection
async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Item model functions
const Item = {
  // Create a new item
  async create(itemData) {
    const {
      user_id,
      item_id,
      access_token,
      environment,
      institution_id,
      institution_name,
      products,
      country_codes,
    } = itemData;

    const query = `
      INSERT INTO items (
        user_id, item_id, access_token, environment, institution_id, 
        institution_name, products, country_codes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      user_id || 'default_user',
      item_id,
      access_token,
      environment || 'sandbox',
      institution_id || null,
      institution_name || null,
      products || [],
      country_codes || [],
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Find item by item_id (optionally filtered by environment)
  async findByItemId(itemId, environment = null) {
    let query = 'SELECT * FROM items WHERE item_id = $1 AND deleted_at IS NULL';
    const params = [itemId];
    
    if (environment) {
      query += ' AND environment = $2';
      params.push(environment);
    }
    
    const result = await pool.query(query, params);
    return result.rows[0] || null;
  },

  // Find all items for a user (optionally filtered by environment)
  async findByUserId(userId, environment = null) {
    let query = 'SELECT * FROM items WHERE user_id = $1 AND deleted_at IS NULL';
    const params = [userId];
    
    if (environment) {
      query += ' AND environment = $2';
      params.push(environment);
    }
    
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    return result.rows;
  },

  // Find all items
  async findAll() {
    const query = 'SELECT * FROM items WHERE deleted_at IS NULL ORDER BY created_at DESC';
    const result = await pool.query(query);
    return result.rows;
  },

  // Update item
  async update(itemId, updates) {
    const allowedFields = [
      'access_token',
      'institution_id',
      'institution_name',
      'products',
      'country_codes',
      'last_successful_update',
      'error_code',
      'error_message',
    ];

    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      return null;
    }

    values.push(itemId);
    const query = `
      UPDATE items 
      SET ${setClauses.join(', ')}
      WHERE item_id = $${paramIndex} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  },

  // Soft delete item (optionally filtered by environment)
  async delete(itemId, environment = null) {
    let query = 'UPDATE items SET deleted_at = CURRENT_TIMESTAMP WHERE item_id = $1 AND deleted_at IS NULL';
    const params = [itemId];
    
    if (environment) {
      query += ' AND environment = $2';
      params.push(environment);
    }
    
    query += ' RETURNING *';
    const result = await pool.query(query, params);
    return result.rows[0] || null;
  },
};

module.exports = {
  pool,
  initializeDatabase,
  testConnection,
  Item,
};

