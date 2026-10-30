# Security Specification & Firestore Hardening Spec

## 1. Data Invariants

1. **Identity & Multi-Tenant Isolation**: Every document in `/users/{userId}`, `/categories/{categoryId}`, `/tasks/{taskId}`, `/habitLogs/{logId}`, and `/progressMetrics/{metricId}` is owned by the authenticated user (`request.auth.uid`). Users can never read, create, update, or delete other users' documents.
2. **Path Parameter Safety**: All document IDs `{userId}`, `{categoryId}`, `{taskId}`, `{logId}`, `{metricId}` must satisfy `isValidId(id)` (`^[a-zA-Z0-9_\-]+$`, size <= 128) to prevent ID poisoning attacks.
3. **Immutability of Ownership & Creation**: `userId` and `id` can never be modified on update (`incoming().userId == existing().userId`).
4. **Validation and Bound Constraints**:
   - `Task`: Title <= 160 chars, description <= 1000 chars, itemType in ['habit', 'reminder', 'goal'], status in ['todo', 'in_progress', 'completed'].
   - `Category`: Name <= 80 chars, color <= 30 chars, icon <= 50 chars.
   - `HabitLog`: Date formatted YYYY-MM-DD (length 10), completed is boolean.
   - `ProgressMetric`: Value is number, date formatted YYYY-MM-DD.
5. **No Blanket Reads**: Every list operation mandates `resource.data.userId == request.auth.uid`.
6. **No Client Query Reliance**: The rules reject any collection scan that does not guarantee tenant segregation.

## 2. The Dirty Dozen Payloads (Designed to Break Identity, Integrity, and State)

1. **Payload 1 (Identity Theft on Task Create)**:
   Authenticated user `user_attacker` attempts to create a task with `userId: "user_victim"`.
   *Expected Result*: `PERMISSION_DENIED`.
2. **Payload 2 (Ghost Field Injection / Shadow Update)**:
   User sends `isAdmin: true` or `shadowField: "exploit"` in task update.
   *Expected Result*: `PERMISSION_DENIED` via strict allowed keys.
3. **Payload 3 (ID Poisoning Path Attack)**:
   Attacker targets `/tasks/../../../etc/passwd` or oversized junk ID (10,000 bytes).
   *Expected Result*: `PERMISSION_DENIED` via `isValidId()`.
4. **Payload 4 (Buffer / Denial of Wallet Attack)**:
   Task title with 50,000 characters payload.
   *Expected Result*: `PERMISSION_DENIED` via `.size() <= 160`.
5. **Payload 5 (Unauthenticated Read/Write)**:
   Anonymous or unauthenticated request to `/categories` or `/tasks`.
   *Expected Result*: `PERMISSION_DENIED`.
6. **Payload 6 (Category Cross-Tenant Deletion)**:
   `user_attacker` attempts to delete a category owned by `user_victim`.
   *Expected Result*: `PERMISSION_DENIED`.
7. **Payload 7 (Invalid Enum ItemType)**:
   Task created with `itemType: "malicious_script"`.
   *Expected Result*: `PERMISSION_DENIED`.
8. **Payload 8 (Invalid Status Mutation)**:
   Task status updated to `"hacked"`.
   *Expected Result*: `PERMISSION_DENIED`.
9. **Payload 9 (Ownership Tampering on Update)**:
   Attacker attempts to change task `userId` from `"user_victim"` to `"user_attacker"`.
   *Expected Result*: `PERMISSION_DENIED`.
10. **Payload 10 (HabitLog Negative Date or Invalid Format)**:
    Log entry created with `date: "not-a-date-12345678901234567890"`.
    *Expected Result*: `PERMISSION_DENIED`.
11. **Payload 11 (Blanket Collection Snooping)**:
    Attempt to run `getDocs(collection(db, 'tasks'))` without user filter matching authenticated user.
    *Expected Result*: `PERMISSION_DENIED`.
12. **Payload 12 (ProgressMetric Type Pollution)**:
    Metric value sent as string `"infinite"` instead of number.
    *Expected Result*: `PERMISSION_DENIED`.

## 3. Test Runner Invariants
All tests ensure `request.auth.uid` matches the target resource owner and validate all fields against strict ABAC rules.
