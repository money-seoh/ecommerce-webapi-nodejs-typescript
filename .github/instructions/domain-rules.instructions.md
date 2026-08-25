---
description: "Use when implementing business logic for cart, inventory, checkout, orders, or payments. Covers stock validation, pricing, discounts, and order lifecycle rules."
applyTo: "src/services/**"
---
# E-commerce Domain Rules

## Inventory & Stock
- Never let available stock go negative; validate stock before confirming a cart item or order line.
- Reserve stock at checkout start; release the reservation if payment fails or the session times out.

## Pricing & Discounts
- Compute prices server-side only; never trust client-submitted prices or totals.
- Apply discounts/promotions in a defined order (item-level, then cart-level, then shipping) and record the applied rule for auditability.

## Cart
- Validate product availability and price on every cart mutation, not just at checkout.

## Checkout & Payments
- Checkout is a multi-step, idempotent process: validate cart -> reserve stock -> create order (status PENDING) -> process payment -> confirm order (status PAID) or roll back.
- Payment processing must be idempotent (use an idempotency key) to avoid double charges on retry.

## Order Lifecycle
- Valid order status transitions: PENDING -> PAID -> FULFILLED -> COMPLETED, with CANCELLED/REFUNDED reachable from PENDING/PAID.
- Reject any transition not in the allowed state machine; log rejected transitions.
