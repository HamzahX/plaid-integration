# Implementation Plan: Enhanced Plaid Integration

## Overview

This document outlines the implementation plan for adding persistent storage, encryption, token management, and dynamic product selection to the Plaid quickstart application.

## Current State

- Access tokens are stored **in memory only** (lost on server restart)
- Products are configured via environment variable `PLAID_PRODUCTS`
- No user management or multi-item support
- No UI for managing linked accounts
- No encryption for sensitive data

## Requirements

### 1. Database for Persistent Storage

**Goal**: Store access tokens, item IDs, user information, and metadata persistently.

**Database Schema**:

```sql
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    item_id VARCHAR(255) UNIQUE NOT NULL,
    access_token_encrypted TEXT NOT NULL,
    institution_id VARCHAR(255),
    institution_name VARCHAR(255),
    products TEXT[], -- Array of product strings
    country_codes TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_successful_update TIMESTAMP,
    error_code VARCHAR(50),
    error_message TEXT
);

CREATE INDEX idx_items_user_id ON items(user_id);
CREATE INDEX idx_items_item_id ON items(item_id);
CREATE INDEX idx_items_institution_id ON items(institution_id);
```

**Implementation Suggestions**:

- **Database Choice**: 
  - **PostgreSQL** (recommended): Robust, supports arrays, JSON, encryption extensions
  - **SQLite**: Simpler for single-user deployments, no separate service needed
- **ORM/Library**:
  - **Node**: Sequelize, TypeORM, or Prisma
  - **Python**: SQLAlchemy
  - **Go**: GORM
  - **Ruby**: ActiveRecord (if using Rails) or Sequel
  - **Java**: Hibernate/JPA

**Docker Compose Integration**:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: plaid_quickstart
      POSTGRES_USER: plaid_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - quickstart

volumes:
  postgres_data:
```

### 2. Access Token Encryption

**Goal**: Encrypt access tokens at rest in the database.

**Implementation Suggestions**:

- **Encryption Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Management**:
  - Store encryption key in environment variable `ENCRYPTION_KEY` (32 bytes for AES-256)
  - **Never commit** encryption keys to version control
  - For production: Use a key management service (AWS KMS, HashiCorp Vault, etc.)
- **Library Recommendations**:
  - **Node**: `crypto` (built-in) or `node-forge`
  - **Python**: `cryptography` library
  - **Go**: `crypto/aes` (built-in)
  - **Ruby**: `openssl` (built-in) or `rbnacl`
  - **Java**: `javax.crypto` (built-in)

**Example Encryption Pattern**:

```javascript
// Node.js example
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 64 hex chars = 32 bytes

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return {
    encrypted: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

function decrypt(encryptedData) {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(encryptedData.iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

**Database Storage**: Store encrypted token, IV, and auth tag as JSON or separate columns.

### 3. Access Token Management Screen

**Goal**: Provide UI to view and manage all linked Plaid items.

**Frontend Components Needed**:

1. **ItemsList Component** (`frontend/src/Components/ItemsList/index.tsx`)
   - Display table/cards of all linked items
   - Show: Institution name, products, date linked, last update status
   - Action buttons: View details, Delete item

2. **ItemDetails Component** (`frontend/src/Components/ItemDetails/index.tsx`)
   - Show detailed information about a specific item
   - Display accounts, balances, transaction count
   - Show error status if item needs attention

3. **DeleteItemModal Component**
   - Confirmation dialog before deletion
   - Show warning about data loss

**Backend API Endpoints**:

```javascript
// GET /api/items - List all items for current user
app.get('/api/items', async (req, res) => {
  // Query database for user's items
  // Decrypt access tokens if needed for API calls
  // Return items with metadata
});

// GET /api/items/:item_id - Get specific item details
app.get('/api/items/:item_id', async (req, res) => {
  // Fetch item from database
  // Optionally fetch current account/balance data from Plaid
  // Return item details
});

// DELETE /api/items/:item_id - Remove item from Plaid and database
app.delete('/api/items/:item_id', async (req, res) => {
  // 1. Call Plaid's itemRemove endpoint
  // 2. Delete from database
  // 3. Return success
});
```

**Plaid Item Removal**:

```javascript
// Use Plaid's itemRemove API
const response = await client.itemRemove({
  access_token: decryptedAccessToken
});
```

### 4. Dynamic Product Selector

**Goal**: Allow users to select products before linking an account, instead of using environment variable.

**Frontend Implementation**:

1. **ProductSelector Component** (`frontend/src/Components/ProductSelector/index.tsx`)
   - Multi-select checkboxes/dropdown for available products
   - Show product descriptions
   - Validate product combinations (some products require others)
   - Store selected products in component state

2. **Update Link Flow**:
   - Before initializing Plaid Link, show product selector
   - Pass selected products to `/api/create_link_token` endpoint
   - Store selected products when item is created

**Backend Changes**:

```javascript
// Update /api/create_link_token to accept products from request
app.post('/api/create_link_token', function (request, response, next) {
  const { products, user_id } = request.body;
  
  const configs = {
    user: {
      client_user_id: user_id || 'user-id',
    },
    client_name: 'Plaid Quickstart',
    products: products || PLAID_PRODUCTS, // Use request products or fallback to env
    country_codes: PLAID_COUNTRY_CODES,
    language: 'en',
  };
  
  // ... rest of link token creation
});
```

**Product Validation**:

- Some products require others (e.g., `statements` may require `transactions`)
- Validate on frontend before submission
- Backend should also validate and return clear error messages

### 5. User Management (Optional)

**Goal**: Support multiple users if needed.

**Implementation Options**:

1. **Simple User ID**: Use a simple identifier (email, UUID) passed from frontend
2. **Session-based**: Implement session management with cookies/JWT
3. **Full Authentication**: OAuth, username/password, etc.

**Minimal Implementation**:

```javascript
// Simple user_id from request
app.post('/api/set_access_token', async (req, res) => {
  const { public_token, user_id } = req.body;
  // Store item with user_id
});
```

## Implementation Order

### Phase 1: Foundation
1. ✅ Add database service to docker-compose.yml
2. ✅ Create database schema/migrations
3. ✅ Set up database connection in backend
4. ✅ Implement encryption utilities

### Phase 2: Core Functionality
5. ✅ Update `/api/set_access_token` to save to database
6. ✅ Implement encryption when storing tokens
7. ✅ Create `/api/items` GET endpoint
8. ✅ Update frontend to fetch and display items

### Phase 3: Management Features
9. ✅ Implement `/api/items/:item_id` GET endpoint
10. ✅ Implement `/api/items/:item_id` DELETE endpoint with Plaid item removal
11. ✅ Build ItemsList component
12. ✅ Build ItemDetails component
13. ✅ Build DeleteItemModal component

### Phase 4: Product Selection
14. ✅ Build ProductSelector component
15. ✅ Update `/api/create_link_token` to accept products
16. ✅ Update Link flow to use selected products
17. ✅ Store selected products in database

## Environment Variables

Add to `.env.example`:

```bash
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=plaid_quickstart
DB_USER=plaid_user
DB_PASSWORD=your_secure_password

# Encryption
ENCRYPTION_KEY=your_64_character_hex_encryption_key_here

# User Management (optional)
SESSION_SECRET=your_session_secret_here
```

## Security Considerations

1. **Encryption Keys**: Never commit to version control, use secure key management in production
2. **Database Credentials**: Store in environment variables, not in code
3. **Access Tokens**: Never log or expose in API responses to frontend
4. **HTTPS**: Always use HTTPS in production
5. **Input Validation**: Validate all user inputs, especially user_id and item_id
6. **SQL Injection**: Use parameterized queries/ORM, never string concatenation
7. **Rate Limiting**: Consider rate limiting on API endpoints

## Testing

1. **Unit Tests**: Test encryption/decryption functions
2. **Integration Tests**: Test database operations
3. **API Tests**: Test all new endpoints
4. **E2E Tests**: Test full flow from product selection to item deletion

## Migration Path

1. For existing deployments: Create migration script to move in-memory tokens to database (if any exist)
2. Handle case where database is unavailable (graceful degradation)
3. Consider data backup strategy before deletion operations

