# Phase 1 deployment notes

## Before deployment

1. Back up the PostgreSQL database and the entire upload directory. Confirm the database backup can be restored in a separate environment.
2. Run `npm run db:preflight` from `backend`. It aborts if the historical migration that drops status/download columns is pending on a populated database, or if duplicate licenses would prevent the existing unique index migration. Reconcile either case from the backup before continuing. Do not edit an already-applied migration checksum.
3. Run `npx prisma migrate status`. The new `20261012120000_phase1_security_integrity` migration should be pending. Review the SQL, then run `npx prisma migrate deploy` in the intended environment. The Docker image runs the preflight and deploy commands before starting the API.
4. Run `npm run db:audit-storage` after migration. Investigate every missing referenced file, license without an approved asset, approved product without an asset, and completed order without a seller snapshot. The command only reports old unreferenced files; it never deletes them. Historic missing files or seller links must be restored from backups or reconciled manually.

The existing `20261012075124_add_license_unique_constraint` migration is preserved. An environment that has not yet applied it must resolve any duplicate `(user_id, product_id)` license groups before deployment. Keep the license that represents the correct entitlement, and preserve an audit copy of any removed rows.

## Configuration

- Set a strong `POSTGRES_PASSWORD` in the root `.env`. Docker Compose binds PostgreSQL and Prisma Studio to loopback; Studio starts only with `--profile tools`. Existing PostgreSQL volumes retain their original password until it is rotated in PostgreSQL, so coordinate the `.env` change with that rotation. URL-encode reserved password characters in the local `DATABASE_URL`.
- Set `TRUST_PROXY_HOPS` to the exact number of trusted reverse proxies. The default is `0` for a directly exposed API. Rate limits use PostgreSQL so replicas share counters.
- Configure `PASSWORD_RESET_DELIVERY_URL`, `PASSWORD_RESET_DELIVERY_KEY`, and `PASSWORD_RESET_URL` together. The delivery service must accept an authenticated HTTPS `POST` with `{to,subject,text}` and keep the reset URL private. Without all three, forgot-password returns `503`; no reset token is logged or returned.
- `PAYMENT_PROVIDER=unconfigured` leaves checkout as a pending order with no payment session or automatic completion. Set `PAYMENT_CURRENCY` to the currency represented by product prices in minor units before connecting a gateway. Existing prices and the frontend currently represent USD cents.

## Gateway integration point

Implement `PaymentVerifier` in `src/modules/payments/payments.service.ts` for the selected provider and register it during startup. Its `verify` method receives the raw webhook body and headers. It must validate the provider signature, timestamp/replay rules, and provider transaction state, then return a normalized `VerifiedPayment`. Set `PAYMENT_PROVIDER` to the registered provider name. The webhook handler accepts paid events only when gateway, order ID, amount, and currency match a pending order; order completion and license issuance happen in one transaction. Until a verifier is installed, webhooks return `503` and no license can be issued. A manual receipt workflow needs an authenticated administrator verification process before it can call this boundary; a buyer-submitted receipt alone is not proof of payment.

Pending orders are not a payment link. The buyer must receive gateway or manual payment instructions when a provider is integrated. Frontend Phase 1 copy reports the pending state and does not show a license or download button for pending orders.
