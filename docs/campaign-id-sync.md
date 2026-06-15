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

- IDs are grouped into Regular `0001-0999`, then one range for every thousand
  through `9000-9999`.
- Each range shows its latest used ID and the next number after it.
- Numbers with `reserved` or `used` status are skipped automatically.
- A released record remains in the audit trail but can become available again.
- Atomic reservation prevents two users from receiving the same number.

Example:

```text
Regular used: 0244, 0245, 0246
Regular next: 0247

1000 Series used: 1111-1116
1000 Series next: 1117
```

Higher ranges do not move the next number in lower ranges.

## Monday XLSX Import

Export the Monday board as XLSX, then import it on Campaign Counter. The tool
scans Campaign ID values, skips duplicates, and stores new IDs in the existing
`campaign_id_allocations` table.

## Monday Bookmarklet

Install **Monday Campaign ID** from the Bookmarklet page, then run it on
Monday. A lightweight allocator opens without loading the full Campaign
Counter page.

The allocator:

- Shows Regular and every thousand series together in compact rows.
- Shows the latest used ID from Supabase.
- Marks an already-used candidate in red.
- Supports Previous and Next independently for every series.
- Reserves and copies an available ID with Use.
- Uses a hidden data-only bridge if Monday blocks direct Supabase requests;
  the visible panel never embeds the eDM Helper application.

## Compatibility Fallback

Before the migration is installed, both tools fall back to the existing
`campaign_history` table. The UI remains usable, but atomic conflict protection
requires the migration and RPC.
