# Campaign Counter Phase 1

Campaign Counter is a small Supabase-backed registry for generating shared
four-digit Campaign IDs. It does not scan folders, import XLSX files, or use
the Monday bookmarklet in this phase.

## Required setup

1. The Supabase project must expose `campaign_registry`,
   `generate_campaign_id`, and `set_next_campaign_id`.
2. Add the project URL and **Publishable/Anon** key directly to
   `js/supabase-config.js`.

```js
window.EDM_SUPABASE_CONFIG = {
  url: 'https://your-project.supabase.co',
  anonKey: 'your-publishable-anon-key'
};
```

Only the public anon key is valid in this static GitHub Pages app. Never add a
service-role key, database password, or private token to the repository.

## User flow

1. Open Campaign Counter and confirm `Connected`.
2. On the first visit, enter a name; it is retained in `localStorage` as
   `edm_username`.
3. Select **Generate Campaign ID**. The button locks while Supabase processes
   the request, preventing duplicate clicks.
4. The new ID is copied to the clipboard, Last Campaign refreshes, and the
   activity list shows who generated it and when.

Use the small edit icon next to Last Campaign when an ID must be set manually.
Any value from `0001` through `9999` is accepted. The optional reason is saved
with a `manual_set` activity record. The newest activity becomes the active
counter pointer: after manually setting `0314`, the next generated ID is `0315`.

If the badge says `Offline`, no ID can be generated. Check the network,
Supabase URL, anon key, and SQL setup, then refresh the page.

If manual adjustment returns PostgreSQL error `42702`, run
`supabase/fix-set-next-campaign-id.sql` in Supabase SQL Editor. It replaces the
RPC with a version that qualifies every `campaign_registry` column using `cr`.
Run the complete file, including its initial `drop function` statement.
