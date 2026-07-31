# Custom Wallets Gallery Design

## Goal

Replace the current mixed wallet navigation with a single, easy-to-browse Custom Wallets album. Visitors should explore prior work by wallet style, then continue to the existing custom-order section.

## Navigation

- Remove the complete `Wallets` group from the Products dropdown on desktop and mobile, including Slim Wallets, Bifold & Trifold, Clutch Wallets, Roper Wallets, and Biker Wallets.
- Keep the album links as the Products menu content.
- Rename `Photo Albums` to `Albums` for a shorter, clearer label.
- Keep `Wallet Album` linked to `/gallery/wallets`.
- Preserve the remaining album links and their current destinations.

## Custom Wallets Page

- Change the gallery title from `Wallets` to `Custom Wallets`.
- Keep the existing introduction and custom-order card, revised where needed to describe the broader wallet collection.
- Add filter controls for `All`, `Bifold`, `Tri-fold`, `Roper`, `Biker`, and `Checkbook/Long`.
- `All` is selected on first load.
- Filtering happens immediately on the page without navigation or reload.
- Each gallery record has one explicit category. Interior photos use the category of the wallet they show.
- Add the supplied Roper and Tri-fold photographs to the existing wallet photography, selecting the clearest exterior and interior views and avoiding near-duplicates.
- Keep a clear `Start Your Custom Order` action near the introduction and repeat it after the gallery. Both actions link to `/#custom-order`.

## Interaction and Accessibility

- Filters use real buttons with a visible selected state and `aria-pressed`.
- Keyboard and touch behavior match pointer behavior.
- Changing filters preserves the page position and does not open a new page.
- Empty filter results show a short message and the custom-order link instead of a blank grid.
- Existing image alternative text remains descriptive; new images receive similarly specific alternative text.
- The layout remains usable on mobile, with filters wrapping into multiple rows when necessary.
- Reduced-motion preferences are respected for gallery transitions.

## Structure

- Extend the wallet gallery image data with a wallet-category field.
- Use a wallet-specific client gallery component to hold the selected filter and render matching records.
- Keep other album pages on the existing generic gallery component and data shape.
- Keep the current `/gallery/wallets` URL, metadata pattern, header, footer, background, and overall visual system.

## Asset Handling

- Convert selected HEIC source photographs to web-ready WebP files.
- Correct orientation during conversion and preserve the complete wallet whenever practical.
- Use clear file names grouped under `public/gallery/wallets/`.
- Do not remove or overwrite the original photographs on the D: drive.
- Do not attempt to remove historical watermarks from supplied photographs.

## Validation

- Confirm the Products menu shows album links only on desktop and mobile.
- Confirm each filter shows only its assigned category and `All` restores the complete gallery.
- Confirm both order actions reach `/#custom-order`.
- Confirm the page builds successfully and existing non-wallet galleries still render.
- Check the Custom Wallets page at desktop and mobile widths for wrapped filters, readable titles, and uncropped primary subjects.
