# Campaign ID Sync

Campaign Counter and the Monday Campaign ID bookmarklet share one gap-aware
sequence stored in Supabase.

## Supabase Setup

1. Open the Supabase SQL Editor for the eDM Helper project.
2. Run [`supabase/campaign-id-allocator.sql`](../supabase/campaign-id-allocator.sql).
3. Confirm that `campaign_id_allocations` exists.
4. Confirm that the `reserve_next_campaign_id` RPC is available.

Do not paste the schema export for `campaign_counters` or `campaign_history`.
Those existing tables are referenced and preserved by the migration.

The migration imports existing values from `campaign_history` and
`campaign_counters`, so previously used numbers remain unavailable.

## Allocation Rules

- The sequence starts from the active counter value for that campaign type.
- The allocator returns the smallest available gap.
- Numbers with `reserved` or `used` status are skipped automatically.
- A released record remains in the audit trail but can become available again.
- Atomic reservation prevents two users from receiving the same number.

Example:

```text
Used: 0228, 0229, 0231, 0235
Next: 0230
```

After `0230` is used, the next number becomes `0232`.

## Monday Bookmarklet

Install **Monday Campaign ID** from the Bookmarklet page, then run it while a
Monday item is open.

The panel:

- Detects the current board and item when available.
- Reads the same campaign types used by Campaign Counter.
- Shows the next available number and nearby used numbers.
- Saves the selected number to Supabase.
- Copies the reserved four-digit number to the clipboard.

Clicking a used-number button copies that number for reference.

## Compatibility Fallback

Before the migration is installed, both tools fall back to the existing
`campaign_history` table. The UI remains usable, but atomic conflict protection
requires the migration and RPC.
