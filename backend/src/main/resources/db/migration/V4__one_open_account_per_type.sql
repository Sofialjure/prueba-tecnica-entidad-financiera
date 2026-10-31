-- =====================================================================
-- V4: one active or inactive account of each type per customer (SUP-15)
-- The service checks it before opening an account; this partial unique
-- index is the last barrier if two requests open the same type at once.
-- Cancelled accounts are closed for good, so they are left out.
-- =====================================================================

CREATE UNIQUE INDEX uk_accounts_customer_open_type
    ON accounts (customer_id, account_type)
    WHERE status <> 'CANCELLED';
