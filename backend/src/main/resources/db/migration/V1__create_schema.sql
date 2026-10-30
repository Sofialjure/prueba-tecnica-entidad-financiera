-- =====================================================================
-- V1: schema (DDL)
-- Business rules enforced by the database as a last line of defence.
-- See docs/03-modelo-datos.md
-- =====================================================================

-- Account numbers: 2-digit prefix by type + 8-digit sequence (RF-12)
CREATE SEQUENCE savings_account_number_seq  START WITH 1 MAXVALUE 99999999 NO CYCLE;
CREATE SEQUENCE checking_account_number_seq START WITH 1 MAXVALUE 99999999 NO CYCLE;

CREATE TABLE customers (
    id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    identification_type   VARCHAR(2)   NOT NULL,
    identification_number VARCHAR(20)  NOT NULL,
    first_name            VARCHAR(100) NOT NULL,
    last_name             VARCHAR(100) NOT NULL,
    email                 VARCHAR(150) NOT NULL,
    birth_date            DATE         NOT NULL,
    created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_customers_identification
        UNIQUE (identification_type, identification_number),
    CONSTRAINT ck_customers_identification_type
        CHECK (identification_type IN ('CC', 'CE', 'PA')),
    CONSTRAINT ck_customers_legal_age
        CHECK (birth_date <= CURRENT_DATE - INTERVAL '18 years'),
    CONSTRAINT ck_customers_name_length
        CHECK (char_length(first_name) >= 2 AND char_length(last_name) >= 2)
);

CREATE TABLE accounts (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_type      VARCHAR(10)   NOT NULL,
    account_number    CHAR(10)      NOT NULL,
    status            VARCHAR(10)   NOT NULL DEFAULT 'ACTIVE',
    balance           NUMERIC(19,2) NOT NULL DEFAULT 0,
    overdraft_limit   NUMERIC(19,2) NOT NULL DEFAULT 0,
    available_balance NUMERIC(19,2) GENERATED ALWAYS AS (balance + overdraft_limit) STORED,
    gmf_exempt        BOOLEAN       NOT NULL DEFAULT FALSE,
    customer_id       BIGINT        NOT NULL,
    created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_accounts_account_number
        UNIQUE (account_number),
    CONSTRAINT fk_accounts_customer
        FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE RESTRICT,
    CONSTRAINT ck_accounts_account_type
        CHECK (account_type IN ('SAVINGS', 'CHECKING')),
    CONSTRAINT ck_accounts_status
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'CANCELLED')),
    CONSTRAINT ck_accounts_account_number_format
        CHECK (account_number ~ '^(53|33)[0-9]{8}$'),
    CONSTRAINT ck_accounts_account_number_prefix
        CHECK ((account_type = 'SAVINGS'  AND account_number LIKE '53%')
            OR (account_type = 'CHECKING' AND account_number LIKE '33%')),
    CONSTRAINT ck_accounts_overdraft_limit
        CHECK (overdraft_limit >= 0 AND (account_type = 'CHECKING' OR overdraft_limit = 0)),
    CONSTRAINT ck_accounts_minimum_balance
        CHECK (balance >= -overdraft_limit),
    CONSTRAINT ck_accounts_cancelled_zero_balance
        CHECK (status <> 'CANCELLED' OR balance = 0)
);

CREATE INDEX ix_accounts_customer_id ON accounts (customer_id);

CREATE TABLE transactions (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reference     UUID          NOT NULL,
    account_id    BIGINT        NOT NULL,
    type          VARCHAR(10)   NOT NULL,
    entry_type    VARCHAR(6)    NOT NULL,
    amount        NUMERIC(19,2) NOT NULL,
    balance_after NUMERIC(19,2) NOT NULL,
    description   VARCHAR(255),
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_transactions_account
        FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE RESTRICT,
    CONSTRAINT ck_transactions_type
        CHECK (type IN ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'GMF')),
    CONSTRAINT ck_transactions_entry_type
        CHECK (entry_type IN ('CREDIT', 'DEBIT')),
    CONSTRAINT ck_transactions_amount
        CHECK (amount > 0)
);

CREATE INDEX ix_transactions_account_id_created_at ON transactions (account_id, created_at DESC);
CREATE INDEX ix_transactions_reference ON transactions (reference);
