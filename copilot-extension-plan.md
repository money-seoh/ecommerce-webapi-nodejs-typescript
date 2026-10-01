## Plan: User and Admin Management Roadmap

The current API has a useful account-management baseline, but is not yet a complete production user lifecycle. Keep customer registration inactive until admin approval, close the confirmed password-change bypass first, then add recovery, traceability, and progressively stronger administrative/security controls. This is an API-only roadmap; advanced features stay staged so the core lifecycle can ship independently.

**Steps**

**Phase 1: Close lifecycle and security gaps**
1. Remove `password` from customer profile updates so credential changes go only through the dedicated endpoint that verifies the current password. Preserve admin password reset as a separately authorized operation and audit it.
2. Add account recovery with time-limited, single-use reset tokens stored hashed, generic responses that do not disclose whether an email exists, abuse throttling, and password-change notification. Admin approval remains the activation policy; recovery must not activate a deactivated account.
3. Add admin-initiated invitation / set-password flow in place of distributing permanent initial passwords, if the product can support email delivery. Keep current admin approval of customer accounts.
4. Add durable account-management audit events for actor, target, action, timestamp, and safe metadata; include creation, profile/role/status/password resets, failed admin actions where useful. Never log tokens, hashes, or credentials.

**Phase 2: Strengthen administrator access and account security**
5. Introduce explicit permission-based authorization for distinct admin responsibilities (for example account support vs. full administrator) only after confirming required admin personas. Replace hard-coded all-admin authorization with permission checks while preserving the last-active-admin safeguard.
6. Add login abuse controls with per-account failure state, progressive delay or temporary lockout, and safe recovery; retain IP rate limiting and avoid permanent lockout that enables denial of service.
7. Add admin MFA, prioritizing privileged accounts. Define enrollment, recovery codes, recovery/admin reset controls, and enforcement policy before implementation.
8. Add refreshable/revocable sessions only if persistent login or ΓÇ£log out all devicesΓÇ¥ is required. Store refresh/session credentials hashed, rotate on use, revoke on password reset/deactivation, and keep access tokens short-lived. Existing middleware rechecks the active user on each request, so deactivation already blocks access; this does not replace explicit session revocation.

**Phase 3: Complete operations and privacy lifecycle**
9. Track `lastLoginAt` and password-change timestamps; add admin filters for status, role/permission, and useful account dates, plus audit-backed account history. Keep list pagination bounded.
10. Add verified email change and optional phone verification. Verification is distinct from activation: customer accounts remain inactive until an admin approves them.
11. Define account erasure/retention behavior before adding deletion endpoints. Prefer deactivation plus selective anonymization where orders, payments, or legal records must remain; do not hard-delete records blindly.
12. Add focused unit/integration coverage, update OpenAPI route documentation, Prisma migrations, and README/API examples with each delivered phase.

**Relevant files**
- `f:\Github Copilot\VS Code\ecommerce-webapi-nodejs-typescript\src\dtos\user.dto.ts` ΓÇö profile/password input boundaries and strict request schemas.
- `f:\Github Copilot\VS Code\ecommerce-webapi-nodejs-typescript\src\services\user.service.ts` ΓÇö lifecycle rules, recovery, lockout, permission checks, and safe response mapping.
- `f:\Github Copilot\VS Code\ecommerce-webapi-nodejs-typescript\src\controllers\user.controller.ts` ΓÇö request validation and response handling for new account workflows.
- `f:\Github Copilot\VS Code\ecommerce-webapi-nodejs-typescript\src\routes\customer.routes.ts` and `src\routes\admin-user.routes.ts` ΓÇö endpoint registration, rate limits, auth, and OpenAPI annotations.
- `f:\Github Copilot\VS Code\ecommerce-webapi-nodejs-typescript\src\middlewares\auth.middleware.ts` ΓÇö evolve role checks to permission checks while retaining active-account validation.
- `f:\Github Copilot\VS Code\ecommerce-webapi-nodejs-typescript\src\repositories\user.repository.ts` and `src\repositories\role.repository.ts` ΓÇö persistence operations; add repositories for tokens, sessions, and audit events as needed.
- `f:\Github Copilot\VS Code\ecommerce-webapi-nodejs-typescript\prisma\schema.prisma` and `prisma\migrations\` ΓÇö account-security state, permission model, token/session storage, and append-only audit records.
- `f:\Github Copilot\VS Code\ecommerce-webapi-nodejs-typescript\test\user.service.test.ts`, `test\customer-profile.integration.test.ts`, and relevant admin/customer integration tests ΓÇö regressions and workflow coverage.
- `f:\Github Copilot\VS Code\ecommerce-webapi-nodejs-typescript\README.md` ΓÇö document lifecycle, admin approval, auth/session policy, and endpoint behavior.

**Verification**
1. Run focused tests proving customer profile updates cannot set passwords and the dedicated password-change endpoint still requires the current password.
2. Test reset-token expiry, single use, hashed-at-rest storage, enumeration-safe responses, throttling, and that reset never activates/deactivates an account.
3. Test admin audit attribution and ensure logs/responses omit passwords, hashes, and tokens; test permission denial and last-active-admin invariants.
4. Test lockout/rate-limit behavior, MFA recovery policy, and session rotation/revocation if those phases are selected.
5. Run `npm test`, `npm run lint`, and `npm run build`; apply and validate Prisma migrations against the configured SQL Server test database; manually exercise documented OpenAPI flows.

**Decisions**
- Customer self-registration remains inactive until admin approval.
- Scope selected: full roadmap, delivered in independently reviewable phases; this project is backend/API-only.
- Email verification can verify ownership but does not change the chosen admin-approval activation policy.
- Admin permission personas, email-delivery provider, session duration, audit retention, MFA enforcement, and deletion/retention obligations remain product/security decisions. Do not impose periodic password rotation absent a compliance requirement.
- Keep soft deactivation; permanent deletion is out of scope until retention/anonymization rules are agreed.
