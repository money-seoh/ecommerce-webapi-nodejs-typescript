# Production Readiness Roadmap: Identity and Back-Office Administration


## Problem and approach


The repository has a solid initial user-management baseline: customer registration/login/profile access, JWT authorization, Admin/Customer roles, admin-created accounts, activation/deactivation, user detail retrieval, user search, and customer password changes.


It is not yet production-complete. The roadmap below separates:



1. Identity and user administration capabilities.

2. Full e-commerce back-office administration.



Work should be delivered as small vertical slices with schema migrations, strict DTOs, service/repository logic, OpenAPI contracts, audit events, and unit/integration tests.


## Current high-risk findings



- The closed Admin Login story is not represented by an Admin login route in the current source.

- Customer profile updates still accept an optional `password`, bypassing current-password verification in the dedicated change-password endpoint.

- Access tokens cannot be refreshed, revoked, or explicitly logged out; a stolen token remains valid until expiry.

- Registration has no email/mobile verification workflow.

- Password reset/recovery is absent.

- Admin accounts have no MFA.

- Brute-force protection is IP-only rate limiting; there is no account-aware lockout or suspicious-login monitoring.

- Roles are hardcoded to `Admin` and `Customer`; there are no granular permissions or role-management workflows.

- Security-sensitive actions are not persisted in an immutable audit trail.

- The repository contains no implemented catalog, inventory, cart, order, payment, fulfillment, refund, or reporting modules despite README descriptions.



## Roadmap A: Identity and user administration


### P0 — security and correctness



1. Add a dedicated Admin login endpoint with generic credential errors, active-account checks, Admin-role enforcement, rate limiting, and tests.

2. Remove password mutation from customer profile updates; require the dedicated current-password-verified endpoint.

3. Add refresh-token rotation and server-side session storage:

- short-lived access tokens;

- hashed refresh tokens;

- token family/reuse detection;

- logout-current-session and logout-all-sessions;

- revocation after password/security changes.

4. Add password recovery:

- forgot-password request with enumeration-safe response;

- single-use, hashed, expiring reset token;

- reset endpoint that revokes existing sessions;

- abuse controls and audit events.

5. Add email verification and controlled account activation:

- single-use expiring verification token;

- resend throttling;

- verified timestamp;

- explicit policy for admin approval versus automatic activation.

6. Add immutable security audit events for login success/failure, password changes/resets, role/status changes, session revocation, and admin mutations.



### P1 — production account lifecycle



1. Add MFA for Admin accounts, preferably TOTP with recovery codes; require step-up authentication for destructive/high-risk actions.

2. Add account-aware brute-force controls: failed-attempt counters, temporary lockout, lockout expiry, and notification hooks.

3. Replace hardcoded role checks with permission-based authorization while retaining roles as permission bundles; add protected role-assignment endpoints and last-super-admin safeguards.

4. Add verified email/mobile change workflows rather than direct mutation.

5. Add customer session/device management: list active sessions, revoke one, revoke all others.

6. Add privacy lifecycle endpoints and policies: customer account closure, retention/anonymization, and personal-data export.

7. Add customer address-book management with ownership enforcement and default billing/shipping semantics.



### P2 — operational maturity



1. Add admin user-list sorting, created/updated date filters, verification/lockout filters, and stable cursor pagination for large datasets.

2. Add administrative support metadata such as internal notes/tags with strict permission and audit boundaries.

3. Add identity-provider federation/social login only if product requirements justify it.

4. Add security operations: key rotation strategy, issuer/audience validation, secret-manager integration, anomaly alerts, and audit retention/export.



## Roadmap B: Full e-commerce back-office administration


### Foundation



1. Introduce granular back-office permissions (`catalog.read/write`, `inventory.adjust`, `orders.manage`, `refunds.issue`, `reports.read`) and audit every mutation.

2. Add shared admin-list conventions: strict filters, allowlisted sorting, pagination, date ranges, export jobs, idempotency, and optimistic concurrency/version checks.

3. Add request IDs, structured/redacted logs, security headers, CORS policy, body-size limits, readiness checks, and observable background jobs.



### P0 — commerce operations



1. Catalog administration:

- products, SKUs/variants, categories, attributes, media, prices;

- draft/published/archived lifecycle;

- unique SKU/slug validation and bulk import validation.

2. Inventory administration:

- warehouses/locations;

- stock-on-hand, reserved, and available quantities;

- append-only stock movements;

- atomic adjustments, reservation expiry, reconciliation, and low-stock thresholds.

3. Order administration:

- search/list/detail;

- validated lifecycle transitions;

- cancellation rules;

- immutable order snapshots and timelines.

4. Payment operations:

- webhook verification and replay protection;

- payment/refund reconciliation;

- idempotent capture/refund;

- partial refunds and failure recovery.

5. Fulfillment:

- shipment creation, partial fulfillment, tracking, carrier/status events, and delivery completion.



### P1 — commercial management



1. Returns/RMA workflows with eligibility rules, inspection outcomes, restocking, and refund orchestration.

2. Promotions/coupons with validity windows, usage limits, stacking rules, customer eligibility, and redemption audit.

3. Tax and shipping configuration with versioned rules and order-time snapshots.

4. Customer-service views combining customer, order, payment, shipment, return, and audit timelines without exposing secrets.

5. Background jobs/outbox for reliable email, inventory expiry, webhook processing, search indexing, and report generation.



### P2 — scale and governance



1. Operational dashboards and reports for sales, refunds, inventory aging, low stock, fulfillment SLAs, and failed payments.

2. Asynchronous CSV exports/imports with authorization, row-level error reports, expiring download links, and audit records.

3. Fraud/risk review queues, manual holds, decision reasons, and separation-of-duties controls.

4. Multi-warehouse routing, purchase orders, supplier management, and inventory transfer workflows if required by the business model.



## Recommended implementation sequence



1. Correct password/profile behavior and implement Admin login.

2. Add sessions, refresh rotation, logout, and revocation.

3. Add password recovery, verification, lockout, MFA, and audit logging.

4. Introduce permission-based authorization.

5. Build catalog and inventory foundations.

6. Build orders, payments/webhooks, refunds, and fulfillment.

7. Add promotions, returns, customer-support tooling, reporting, and bulk operations.



## Notes and considerations



- Do not treat account deactivation as deletion; define retention and anonymization separately.

- Security-sensitive token material must be random, single-use, expiring, stored hashed, and never logged.

- Admin action records should include actor, target, action, timestamp, request ID, and safe before/after metadata.

- Avoid a single all-powerful Admin role in production; use least-privilege permissions and step-up authentication.

- Monetary, inventory, order, and payment changes require transactional integrity, idempotency, and immutable history.

- Each roadmap item should become a dedicated GitHub issue or small epic before implementation.