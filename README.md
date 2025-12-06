# Plaid Integration

This repository is a **fork** of the [Plaid Quickstart](https://github.com/plaid/quickstart) with enhanced features for managing Plaid items, persistent storage, and dynamic product selection.

## What's Different

This fork extends the original Plaid Quickstart with:

- **Persistent Storage**: PostgreSQL database to store access tokens, item IDs, and metadata across server restarts
- **Item Management UI**: View and manage all linked Plaid items with a dedicated interface
- **Dynamic Product Selection**: Choose Plaid products at runtime via a modal before linking accounts
- **Environment Awareness**: Separate sandbox and production data with environment filtering
- **Production Warning Banner**: Visual warning when running in production mode to prevent accidental billable actions
- **Soft Delete**: Items are soft-deleted (marked as deleted) rather than permanently removed
- **Single Backend**: Streamlined to use only Node.js backend (removed multi-language support)

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- `make` available at your command line
- Plaid API credentials from [Plaid Dashboard](https://dashboard.plaid.com/developers/keys)

### Setup

1. **Clone the repository**

```bash
git clone https://github.com/HamzahX/plaid-integration
cd plaid-integration
```

2. **Set up environment variables**

```bash
cp .env.example .env
```

Edit `.env` and add your Plaid credentials:
- `PLAID_CLIENT_ID` - Your Plaid Client ID
- `PLAID_SECRET` - Your Plaid Secret (sandbox)
- `PLAID_ENV` - Environment: `sandbox`
- `PLAID_PRODUCTS` - Set as required. See: https://plaid.com/docs/api/link/?utm_source=chatgpt.com#link-token-create-request-products. Note: These are defaults and are settable at runtime
- `PLAID_COUNTRY_CODES` - Set as required. See: https://plaid.com/docs/api/link/?utm_source=chatgpt.com#link-token-create-request-country-codes

Optional database configuration (defaults are provided):
- `DB_NAME` - Database name (default: `plaid_quickstart`)
- `DB_USER` - Database user (default: `plaid_user`)
- `DB_PASSWORD` - Database password (default: `plaid_password`)

3. **Start the application**

```bash
make sandbox
```

The application will be available at:
- **Frontend**: https://localhost:4000
- **Backend**: http://localhost:8000
- **Database**: localhost:5432

### Production Mode

To run with production Plaid credentials:

1. Create a `.env.prod` file with your production credentials
- `PLAID_SECRET` - Your Plaid Secret (production)
- `PLAID_ENV` - Environment: `production`
- `PLAID_PRODUCTS` - Set as required. See: https://plaid.com/docs/api/link/?utm_source=chatgpt.com#link-token-create-request-products. Note: These are defaults and are settable at runtime
- `PLAID_COUNTRY_CODES` - Set as required. See: https://plaid.com/docs/api/link/?utm_source=chatgpt.com#link-token-create-request-country-codes

2. **Set up HTTPS certificates** (required for redirect URI in production)

To test in Production with a redirect URI, you need to use HTTPS. The frontend is already configured to use HTTPS, but you need to create self-signed certificates:

```bash
cd frontend

# Install mkcert (macOS with Homebrew)
brew install mkcert

# Install the local CA
mkcert -install

# Create certificate for localhost
mkcert localhost
```

This will create `localhost.pem` and `localhost-key.pem` in the `frontend` folder. The `package.json` is already configured to use these certificates.

**Note**: Self-signed certificates should be used for testing purposes only, never for actual deployments. On Windows, you may get an invalid certificate warning in your browser - click "Advanced" and proceed. Also ensure you access `https://localhost:4000` (not `http://`).

For detailed instructions, see the [Plaid Quickstart HTTPS setup guide](https://github.com/plaid/quickstart#instructions-for-using-https-with-localhost).

3. Run:

```bash
make production
```

**⚠️ Warning**: A production mode banner will be displayed at the top of the application warning about real, billable charges.

## Available Commands

- `make sandbox` - Build and start containers (sandbox mode)
- `make production` - Build and start containers (production mode)
- `make logs` - View container logs
- `make stop` - Stop all containers
- `make build` - Build containers without starting

## Features

### Item Management

After linking an account, you can:

- **View Linked Accounts**: Click "View Linked Accounts" to see all items
- **View Details**: Click on any item to see detailed information including:
  - Institution name and ID
  - Products enabled
  - Access token (hidden by default, click eye icon to reveal)
  - Item ID (with copy-to-clipboard)
  - Last successful update timestamp
- **Delete Items**: Remove items from Plaid and mark as deleted in the database

### Dynamic Product Selection

When clicking "Launch Link", you'll be prompted to select which Plaid products to enable before linking an account. This allows you to:

- Choose products per account link
- Test different product combinations
- Avoid hardcoding products in environment variables

### Environment Filtering

Items are automatically filtered by environment:
- Sandbox items are only visible when `PLAID_ENV=sandbox`
- Production items are only visible when `PLAID_ENV=production`
- Items are stored with their environment to prevent cross-environment access

### Soft Delete

When deleting an item:
- The item is removed from Plaid via `itemRemove` API
- The item is marked as deleted in the database (`deleted_at` timestamp)
- Deleted items are filtered from all queries
- No restore functionality (item is permanently removed from Plaid)

## Database Schema

The application uses PostgreSQL with the following schema:

- **items** table: Stores Plaid items with access tokens, metadata, and environment information
- **Soft delete**: `deleted_at` column for marking deleted items
- **Environment tracking**: `environment` column to separate sandbox/production data
- **Unique constraint**: `(item_id, environment)` to prevent duplicates per environment

See `backend/db/schema.sql` for the full schema definition.

## Project Structure

```
.
├── backend/              # Node.js backend service
│   ├── db/              # Database schema and connection
│   ├── index.js         # Main server file
│   └── Dockerfile
├── frontend/            # React frontend
│   ├── src/
│   │   ├── Components/
│   │   │   ├── ItemsList/      # List of linked items
│   │   │   ├── ItemDetails/    # Item detail view
│   │   │   ├── ProductSelector/# Product selection modal
│   │   │   └── Link/           # Plaid Link integration
│   │   └── App.tsx
│   └── Dockerfile
├── docker-compose.yml    # Docker services configuration
├── Makefile             # Build and run commands
└── docs/                # Documentation
    └── ITEM_MANAGEMENT_IMPLEMENTATION_PLAN.md
```

## Test Credentials

### Sandbox Mode

- **Username**: `user_good`
- **Password**: `pass_good`
- **2FA Code**: `1234`

### Transactions Testing

For more realistic transaction data, use:
- **Institution**: First Platypus Bank
- **Username**: `user_transactions_dynamic`
- **Password**: Any non-blank string

## Troubleshooting

### Can't connect to database

- Ensure Docker is running
- Check that the `postgres` service is healthy: `docker ps`
- View logs: `make logs`

### Link token errors

- Verify `PLAID_CLIENT_ID` and `PLAID_SECRET` are set in `.env`
- Check backend logs for detailed error messages
- Ensure your Plaid credentials match the environment (`sandbox` vs `production`)

### Production mode issues

- Make sure `.env.prod` exists with production credentials
- Verify OAuth redirect URI is registered in Plaid Dashboard
- Check that you have production access approved in Plaid Dashboard

### Items not showing

- Verify the `PLAID_ENV` matches the environment where items were created
- Check database connection and ensure items exist: `docker exec -it <postgres-container> psql -U plaid_user -d plaid_quickstart -c "SELECT * FROM items;"`

## Documentation

- [Item Management Implementation Plan](docs/ITEM_MANAGEMENT_IMPLEMENTATION_PLAN.md) - Detailed implementation notes
- [Plaid API Usage & Billing](PLAID_API_USAGE.md) - Billing information for API endpoints

## License

MIT License (same as original Plaid Quickstart)

## Acknowledgments

This project is based on the [Plaid Quickstart](https://github.com/plaid/quickstart) repository.
