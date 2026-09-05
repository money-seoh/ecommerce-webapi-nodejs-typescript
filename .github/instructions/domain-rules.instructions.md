---
description: "Use when implementing business logic for cart, inventory, checkout, orders, or payments. Covers stock validation, pricing, discounts, and order lifecycle rules."
applyTo: "src/services/**"
---
# E-commerce Domain Rules

## Inventory & Stock
- Enforce non-negative stock atomically at the database layer (for example, use a conditional update that only succeeds when available stock is sufficient and verify the affected-row count, or equivalent row locking in a transaction); a prior read-and-check alone is insufficient.
- Reserve stock at checkout start; release the reservation if payment fails or the session times out.

## Pricing & Discounts
- Compute prices server-side only; never trust client-submitted prices or totals.
- Apply discounts/promotions in a defined order (item-level, then cart-level, then shipping) and record the applied rule for auditability.

## Cart
- Validate product availability and price on every cart mutation, not just at checkout.

## Checkout & Payments
- Checkout is an idempotent workflow: validate the cart -> atomically reserve stock and create a PENDING order -> process payment outside the database transaction -> atomically record payment and mark the order PAID. On payment failure, release the reservation and cancel the order; if post-payment persistence fails, reconcile by idempotency key instead of assuming the external charge can be rolled back.
- Payment processing must be idempotent (use an idempotency key) to avoid double charges on retry.

## Order Lifecycle
- Valid order status transitions: PENDING -> PAID -> FULFILLED -> COMPLETED; PENDING may transition to CANCELLED, and PAID may transition to REFUNDED.
- Reject any transition not in the allowed state machine; log rejected transitions.

## User Management & Authentication
- Normalize user identifiers such as email (trim + lowercase) before lookup, uniqueness checks, and persistence.
- Customer self-registration must always enforce `role=Customer` and server-defined activation defaults, regardless of request payload.
- Passwords must be hashed with bcrypt before persistence; plaintext passwords must never leave request scope.
- Authentication failures must return non-enumerating responses (same behavior/message for unknown user and wrong password).
- Bootstrap admin-creation bypass is allowed only until the first active admin exists; afterwards admin-only authorization is mandatory.
