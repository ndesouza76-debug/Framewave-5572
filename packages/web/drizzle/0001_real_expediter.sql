DROP INDEX `credit_events_idempotency_key_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `credit_events_idem_key_idx` ON `credit_events` (`idempotency_key`);--> statement-breakpoint
DROP INDEX `referral_codes_code_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `referral_codes_code_idx` ON `referral_codes` (`code`);