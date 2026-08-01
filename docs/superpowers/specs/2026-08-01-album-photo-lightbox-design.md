# Album Photo Lightbox Design

## Goal

Let visitors click any photo inside a Twisted Custom Leather album and view that same photo at a larger size without leaving the album page.

## Scope

The lightbox applies to every photo displayed inside these gallery albums:

- Custom Wallets
- Belts
- Welding Gear
- Purses & Leather Work
- Bible Covers
- Portfolios

Homepage feature cards, product pages, logos, and decorative images are unchanged.

## Visitor Experience

Each album photo is presented as an accessible button while preserving the current card, title, aspect ratio, and album filters. Activating a photo opens a full-screen overlay with a darkened backdrop. The selected photo is shown as large as the visitor's screen allows and uses `object-contain`, so the complete image remains visible without cropping or stretching. Its existing title appears as a caption.

The overlay includes:

- A clearly labeled close button in the upper-right corner.
- Previous and Next controls for browsing the currently displayed album photos.
- Keyboard support: `Escape` closes the overlay, while Left and Right Arrow keys change photos.
- Touch-friendly on-screen controls for phones and tablets.
- Backdrop click support for closing the overlay.

Previous and Next wrap around at the beginning and end of the current photo list. In the Custom Wallets album, navigation follows the photos visible under the active category filter. Closing the lightbox leaves the visitor on the same album with the same wallet filter and scroll position.

## Components and Data Flow

A shared client-side `GalleryLightbox` component receives the current array of gallery images and renders both the existing card grid and the overlay. The regular gallery page passes its album images directly to this component. The wallet gallery passes its filtered `visibleImages`, allowing one interaction model to serve all albums while preserving wallet category behavior.

The lightbox stores only the selected image index. Opening sets the index, navigation updates it, and closing clears it. No image files, gallery records, routes, or external services change.

## Accessibility and Interaction Safety

- Every photo button has an accessible name based on its existing alternative text.
- The overlay uses dialog semantics and identifies itself as a modal image viewer.
- Opening moves keyboard focus to the close button.
- Closing returns focus to the photo that opened the lightbox.
- Background page scrolling is disabled while the overlay is open and restored when it closes.
- Controls have visible focus styling and text labels for screen readers.
- The overlay handles an empty image list safely by rendering no photo viewer.

## Visual Treatment

The lightbox uses the site's charcoal, cream, and copper palette. The backdrop is nearly black and slightly translucent so the enlarged leatherwork is the visual focus. Controls use copper borders and cream text, with generous hit areas on mobile. The image is centered with comfortable spacing and a restrained caption below it.

## Testing and Acceptance

Automated checks will verify that:

- Both wallet and non-wallet album grids use the shared lightbox.
- Clicking a card selects its exact image.
- Close, Previous, and Next controls are present and labeled.
- Navigation wraps at both ends.
- `Escape`, Left Arrow, and Right Arrow behaviors are wired.
- The enlarged photo uses complete-image presentation without cropping.
- Existing wallet filters and custom-order links remain intact.
- The complete project type-check and production build succeed before publishing.

The feature is complete when every album photo opens its matching larger image, visitors can browse and close the viewer by mouse, touch, or keyboard, and the published site continues to serve all existing album pages successfully.
