# Catalog images

Drop real photos here. Each catalog item in `src/lib/catalog.ts` has an
`image` field like `tickets/ticket_standard`. The app loads it from:

```
/public/catalog/<image>.jpg
```

So `tickets/ticket_standard` → `public/catalog/tickets/ticket_standard.jpg`.

**No image yet?** The card automatically falls back to a tasteful gradient +
category glyph, so the gallery always looks finished. Add files any time — no
code changes needed (or tweak the mapping in `src/lib/images.ts`).

Expected folders (one per category):
`tickets, attire, photography, videography, venues, catering, cakes,
decorations, music, guests, afterparty, transport, invitations, favors, beauty`
