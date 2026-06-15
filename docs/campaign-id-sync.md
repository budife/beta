# Campaign ID Local Workflow

Campaign Counter and the Monday Campaign ID bookmarklet intentionally use
separate browser-local databases. No Campaign ID, campaign name, blast date,
or XLSX content is sent to Supabase or another application server.

## Campaign Counter

1. Export the Monday board as XLSX.
2. Choose **Merge** to retain prior XLSX data or **Replace XLSX data** to
   replace imported records while keeping manually reserved IDs.
3. Open Campaign Counter and select **Import XLSX**.
4. The browser reads `Task` / `Campaign ID` and `Subitem` /
   `Campaign ID (sub)`.
5. Records are stored in IndexedDB for the eDM Helper origin.

Campaign Counter stores full Campaign IDs, item names, item type, blast dates,
and four-digit sequence numbers. Reblasts with the same four-digit number are
grouped under one ID box and shown in its tooltip.
The import summary reports campaigns, unique IDs, reblasts, and malformed
campaign rows. Click an ID box to keep its detail popup open while scrolling.

Use **Reset** to remove all Campaign Counter data stored by the current
browser. Reset does not contact or modify any remote database.
Use **Export JSON** to download a local backup before clearing browser data.

## Monday Bookmarklet

1. Install **Monday Campaign ID** from the Bookmarklet page.
2. Run it on Monday.
3. Choose **Merge** or **Replace**, then select **Upload XLSX** inside the
   bookmarklet panel.
4. Used four-digit numbers are stored in IndexedDB for the Monday origin.

The bookmarklet has its own series tabs, local candidate allocator, and Reset
button. Its ID list scrolls independently so the panel stays compact. Use
**Export** to back up the bookmarklet's local allocation data. It does not read
Campaign Counter storage because browser same-origin rules keep the two
databases separate.

## Storage Boundaries

- Campaign Counter data belongs to the eDM Helper website origin.
- Bookmarklet data belongs to the current Monday hostname.
- Upload the XLSX separately in each tool.
- Clearing browser site data also clears the corresponding Campaign ID data.
- Data does not synchronize between browsers, devices, or Monday hostnames.
