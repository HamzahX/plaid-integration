# Plaid API Usage & Billing

## Billing Overview

| Plaid Endpoint | Our Endpoint | Used Where | Billable? | Billing Model |
|----------------|--------------|------------|-----------|---------------|
| `linkTokenCreate` | `POST /api/create_link_token` | Product selector → Link flow | ❌ FREE | No charge |
| `itemPublicTokenExchange` | `POST /api/set_access_token` | After Link success | ⚠️ **BILLABLE** | Triggers monthly subscription per account when linking with billable products (Transactions, Investments) |
| `itemGet` | `GET /api/items/:item_id` | Item details view | ❌ FREE | No charge |
| `institutionsGetById` | `GET /api/items/:item_id` | Item details view | ❌ FREE | No charge |
| `itemRemove` | `DELETE /api/items/:item_id` | Delete item button | ❌ FREE | No charge |
| `accountsGet` | `GET /api/accounts` | Products screen (if used) | ❌ FREE | No charge |
| `transactionsSync` | `GET /api/transactions` | Products screen → Transactions button | ⚠️ **BILLABLE** | Monthly subscription per account (charged regardless of API call frequency) |
| `investmentsTransactionsGet` | `GET /api/investments_transactions` | Products screen → Investment Transactions button | ⚠️ **BILLABLE** | Monthly subscription per account (charged regardless of API call frequency) |
| `investmentsHoldingsGet` | `GET /api/holdings` | Products screen → Holdings button | ⚠️ **BILLABLE** | Monthly subscription per account (charged regardless of API call frequency) |
| `accountsBalanceGet` | `GET /api/balance` | Products screen → Balance button (if used) | ⚠️ **BILLABLE** | Per-request fee (flat fee per successful API call) |

## Key Points

- **Linking an account** with Transactions or Investments products starts monthly subscription billing for that account
- **Monthly subscription** products (Transactions, Investments) are charged per account per month, regardless of how many API calls you make
- **Per-request** endpoints (`accountsBalanceGet`) charge a flat fee each time they're called
- **Item details view** (`/api/items/:item_id`) only uses FREE endpoints - no billing
- **Sandbox environment**: All endpoints are free (no charges)
- **Production environment**: Billable endpoints incur charges

## What Costs Money

1. **Linking accounts** with billable products → Monthly subscription starts
2. **`accountsBalanceGet`** → Per-request fee each time called
3. **Monthly subscriptions** → Recurring charge per account with Transactions/Investments

## What's Free

- Creating link tokens
- Getting item metadata
- Getting institution info
- Removing items
- Viewing item details (our implementation)
- All endpoints in sandbox environment
