-- =====================================================================
-- V2: sample data (DML)
-- Balances match the movements below, including the 4x1000 GMF charged
-- to non-exempt accounts on withdrawals and outgoing transfers.
-- =====================================================================

INSERT INTO customers (identification_type, identification_number, first_name, last_name, email, birth_date, created_at, updated_at)
VALUES ('CC', '1020304050', 'Ana María',     'Gómez',    'ana.gomez@correo.com',     '1995-04-12', '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
       ('CC', '79845123',   'Carlos Andrés', 'Pérez',    'carlos.perez@correo.com',  '1988-09-30', '2026-10-01 08:30:00', '2026-10-01 08:30:00'),
       ('CE', '456789',     'Laura',         'Restrepo', 'laura.restrepo@correo.com', '1990-01-15', '2026-10-01 09:00:00', '2026-10-01 09:00:00');

-- One statement per account so the sequence order is deterministic
INSERT INTO accounts (account_type, account_number, status, balance, overdraft_limit, gmf_exempt, customer_id, created_at, updated_at)
SELECT 'SAVINGS', '53' || lpad(nextval('savings_account_number_seq')::text, 8, '0'), 'ACTIVE', 1799200.00, 0, FALSE, id,
       '2026-10-01 08:05:00', '2026-10-05 10:00:00'
FROM customers WHERE identification_type = 'CC' AND identification_number = '1020304050';

INSERT INTO accounts (account_type, account_number, status, balance, overdraft_limit, gmf_exempt, customer_id, created_at, updated_at)
SELECT 'CHECKING', '33' || lpad(nextval('checking_account_number_seq')::text, 8, '0'), 'ACTIVE', 899600.00, 500000.00, FALSE, id,
       '2026-10-01 08:10:00', '2026-10-10 15:00:00'
FROM customers WHERE identification_type = 'CC' AND identification_number = '1020304050';

INSERT INTO accounts (account_type, account_number, status, balance, overdraft_limit, gmf_exempt, customer_id, created_at, updated_at)
SELECT 'SAVINGS', '53' || lpad(nextval('savings_account_number_seq')::text, 8, '0'), 'ACTIVE', 600000.00, 0, TRUE, id,
       '2026-10-01 08:35:00', '2026-10-10 15:00:00'
FROM customers WHERE identification_type = 'CC' AND identification_number = '79845123';

INSERT INTO accounts (account_type, account_number, status, balance, overdraft_limit, gmf_exempt, customer_id, created_at, updated_at)
SELECT 'CHECKING', '33' || lpad(nextval('checking_account_number_seq')::text, 8, '0'), 'INACTIVE', 0, 1000000.00, FALSE, id,
       '2026-10-01 09:05:00', '2026-10-15 11:00:00'
FROM customers WHERE identification_type = 'CE' AND identification_number = '456789';

-- ORDER BY keeps ids in chronological order (a withdrawal before its GMF)
INSERT INTO transactions (reference, account_id, type, entry_type, amount, balance_after, description, created_at)
SELECT t.reference::uuid, a.id, t.type, t.entry_type, t.amount, t.balance_after, t.description, t.created_at::timestamp
FROM (VALUES
    -- Ana María: savings 5300000001
    (1, '0b7d9f1e-1c2a-4e3b-9a4d-000000000001', '5300000001', 'DEPOSIT',    'CREDIT', 2000000.00, 2000000.00, 'Consignación inicial',      '2026-10-01 09:00:00'),
    (2, '0b7d9f1e-1c2a-4e3b-9a4d-000000000002', '5300000001', 'WITHDRAWAL', 'DEBIT',   200000.00, 1800000.00, 'Retiro en cajero',          '2026-10-05 10:00:00'),
    (3, '0b7d9f1e-1c2a-4e3b-9a4d-000000000002', '5300000001', 'GMF',        'DEBIT',      800.00, 1799200.00, 'GMF 4x1000',                '2026-10-05 10:00:00'),
    -- Ana María: checking 3300000001
    (4, '0b7d9f1e-1c2a-4e3b-9a4d-000000000003', '3300000001', 'DEPOSIT',    'CREDIT', 1000000.00, 1000000.00, 'Consignación inicial',      '2026-10-02 09:00:00'),
    (5, '0b7d9f1e-1c2a-4e3b-9a4d-000000000004', '3300000001', 'TRANSFER',   'DEBIT',   100000.00,  900000.00, 'Transferencia a 5300000002', '2026-10-10 15:00:00'),
    (6, '0b7d9f1e-1c2a-4e3b-9a4d-000000000004', '3300000001', 'GMF',        'DEBIT',      400.00,  899600.00, 'GMF 4x1000',                '2026-10-10 15:00:00'),
    -- Carlos Andrés: savings 5300000002 (GMF exempt)
    (7, '0b7d9f1e-1c2a-4e3b-9a4d-000000000005', '5300000002', 'DEPOSIT',    'CREDIT',  500000.00,  500000.00, 'Consignación inicial',      '2026-10-03 09:00:00'),
    (8, '0b7d9f1e-1c2a-4e3b-9a4d-000000000004', '5300000002', 'TRANSFER',   'CREDIT',  100000.00,  600000.00, 'Transferencia de 3300000001', '2026-10-10 15:00:00')
) AS t (seq, reference, account_number, type, entry_type, amount, balance_after, description, created_at)
JOIN accounts a ON a.account_number = t.account_number
ORDER BY t.seq;
