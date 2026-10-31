-- =====================================================================
-- V3: a cancelled account has no overdraft line (SUP-14)
-- Cancelling is final, so a cancelled checking account must not show its
-- former overdraft limit as available balance.
-- =====================================================================

UPDATE accounts
SET overdraft_limit = 0
WHERE status = 'CANCELLED'
  AND overdraft_limit <> 0;

ALTER TABLE accounts
    ADD CONSTRAINT ck_accounts_cancelled_no_overdraft
        CHECK (status <> 'CANCELLED' OR overdraft_limit = 0);
