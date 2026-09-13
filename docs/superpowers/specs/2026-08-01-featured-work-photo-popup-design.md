# Featured Work Photo Popup Design

## Goal

Let visitors enlarge every photo in the seven-card **Featured Leather Work** section without replacing or rolling back the current website. Preserve the four existing Google Photos album links by presenting them as an explicit action inside the popup.

## Scope

- Make all seven Featured Work cards open a large photo popup.
- Show the same source image used by the selected card, without cropping it.
- Show the card title and category in the popup.
- Provide Previous and Next navigation through all seven photos, wrapping from the first to the last and from the last to the first.
- Support keyboard Left Arrow, Right Arrow, and Escape controls.
- Close from the close button or the shaded backdrop.
- Show a **View Full Album** button only for the four cards that already have Google Photos links.
- Keep the header menu, album destinations, custom-order section, and all other current site content unchanged.

## User Experience

Each Featured Work card behaves like a button. Selecting it opens a centered, responsive overlay above the page. The selected image is displayed at the largest practical size with `object-contain`, so the full image remains visible on phones and computers. The title, category, navigation controls, close control, and optional album button remain readable without covering important parts of the image.

The album button opens the existing Google Photos destination in a new tab. Closing the popup returns keyboard focus to the card that opened it.

## Architecture

### Featured Work data

Keep the seven existing entries and image sources in `FeaturedWork.tsx`. The current `href` values remain the source of truth for optional album buttons. The cards pass their index into the popup state rather than navigating directly when selected.

### Popup component

Add a focused client component responsible for:

- the active photo index;
- rendering the overlay and selected photo;
- Previous, Next, close, backdrop, and keyboard behavior;
- body scroll locking while open;
- focus placement, focus trapping, and focus restoration;
- the conditional Google Photos album action.

The component receives the photo list and selected index through a small, clear interface. Pure navigation calculations should remain separate and independently testable.

### Data flow

1. A visitor selects a Featured Work card.
2. `FeaturedWork` stores the selected index and opens the popup.
3. The popup reads the matching item and renders its image and metadata.
4. Navigation changes the selected index within the same seven-item list.
5. Closing clears the active selection and restores the page state and focus.

## Accessibility and Error Handling

- Use an accessible dialog with a clear label.
- Give all icon controls descriptive labels.
- Trap keyboard focus inside the open dialog and restore it on close.
- Prevent the page behind the popup from scrolling or receiving focus while the popup is open.
- Preserve alternative text for every image.
- If an image fails to load, the dialog remains closable and its title, navigation, and album action remain usable.
- External album links keep `noopener noreferrer` protection.

## Testing

Automated tests will verify:

- all seven cards participate in the popup;
- first/last navigation wraps correctly;
- Escape and arrow-key behavior is wired in;
- close, backdrop, focus restoration, and scroll restoration contracts are present;
- album buttons appear only when an item has an existing album URL;
- current Google Photos URLs remain unchanged.

The full project type check, production build, and Cloudflare deployment dry run must pass before publishing. After deployment, verify the live home page on desktop and mobile widths, open multiple cards, navigate between photos, follow an album button, and close the popup in each supported way.

## Acceptance Criteria

- Every Featured Work card opens its own larger, uncropped image.
- Previous and Next navigation reaches all seven images and wraps correctly.
- The popup works with mouse, touch, and keyboard controls.
- Four album cards retain access to their current Google Photos albums through **View Full Album**.
- No existing menu item, album URL, card image, or unrelated page content changes.
- Tests, type checks, the production build, and live smoke checks pass.
