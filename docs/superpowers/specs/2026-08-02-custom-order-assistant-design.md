# Custom Order Assistant Design

**Date:** 2026-08-02
**Status:** Approved direction; pending written-spec review
**Primary goal:** Increase completed custom orders by making the path from inspiration to payment simpler, clearer, and more reassuring on phones and desktops.

## Decisions Confirmed With the Owner

- Each checkout contains one custom piece.
- Square collects the full published starting price immediately.
- The published price remains a starting price. The customer must be told before payment that approved upgrades or design changes can require an additional payment.
- Square remains the payment provider.

## Current Experience and Problem

The homepage, product galleries, and new photo popup communicate the quality of the leatherwork well. The main friction is the ordering section:

- Customers see ten products and a large all-purpose form at once.
- Unrelated questions appear together, such as belt measurements and purse dimensions.
- A customer viewing an inspiring gallery photo cannot carry that reference directly into an order.
- The full starting-price payment happens before the site clearly explains design confirmation, possible added costs, production, and delivery.
- The success page confirms payment but gives only a short description of what happens next.

The next improvement should turn this into a guided, one-piece ordering journey that preserves the existing products, prices, delivery estimate, and Square checkout.

## Approaches Considered

### 1. Guided Custom Order Assistant — Recommended

Replace the long product grid and universal form with three focused steps: choose a piece, customize it, and review/pay.

**Benefits:** Lowest cognitive load, best mobile experience, product-specific questions, clear progress, and a natural place for gallery references and reassurance.
**Trade-off:** More implementation and testing than simply rearranging the current form.

### 2. Conditionally Collapse the Existing Form

Keep the current layout but hide irrelevant fields after a product is selected.

**Benefits:** Smaller code change.
**Trade-off:** The page still feels like a cart and form rather than personal guidance, and the product list remains lengthy on phones.

### 3. Quote First, Pay Later

Collect design details first and send a final payment request after review.

**Benefits:** Removes uncertainty before payment.
**Trade-off:** Adds manual follow-up and contradicts the confirmed decision to collect the full starting price immediately.

## Recommended Customer Journey

### Entry Points

Customers can enter the assistant from:

- Any existing “Start A Custom Order” call to action.
- A product or category page.
- A new “Make One Like This” action in a featured-work photo popup.

Gallery entry links use stable product and reference identifiers, for example:

`/?product=custom-wallet&reference=wallet-set#custom-order`

The assistant reads these values, preselects the matching product, displays the referenced work, and still lets the customer change products.

### Step 1: Choose Your Piece

- Show the ten existing products as compact, grouped choices rather than quantity-based cart cards.
- Group choices under Wallets, Belts, Covers, Welding Gear, Straps, and Bags.
- Each choice shows its name, starting price, and one-sentence description.
- Only one product can be selected.
- The primary action is “Customize This Piece.”
- A “Not Sure?” link explains how to contact Twisted Custom Leather before paying.

### Step 2: Customize It

Only fields relevant to the selected product appear. Common fields include:

- Primary and secondary color.
- Leather or material preference.
- Tooling, artwork, initials, brand, or design description.
- Hardware preference when relevant.
- Lace or special stitching, with the existing $25 upcharge shown beside the choice.
- Exotic-hide choice, with existing upcharges shown before selection.

Product-specific fields include:

- **Wallets:** layout or wallet style and special interior requests.
- **Belts:** pants size, belt measurement guidance, fold-to-center-hole measurement, width, and buckle preference.
- **Bible/book covers:** closed height, width, thickness, closure preference, and intended book type.
- **Welding gear:** selected gear type, fit measurements, pipeliner or special finish, and work-use notes.
- **Guitar straps:** preferred length, width, attachment style, and hardware.
- **Purses/bags:** approximate size, carry style, pocket needs, strap preference, and hardware.

Fields must use visible labels and short helper text rather than relying only on placeholders. Required fields are minimal; customers can choose “I need help deciding” for optional material or hardware choices.

#### Inspiration and Photos

- If the customer entered from a gallery popup, show a removable “Inspired by” card with that image title and thumbnail.
- Allow up to three optional JPEG or PNG source images. Cloudflare Images must decode and re-encode each accepted source to canonical, non-animated JPEG before R2 storage.
- Limit each file to 8 MB and explain that reference images are used only to prepare the order.
- Failed uploads do not erase other form answers. Customers can retry or remove a file.

### Step 3: Review and Pay

Show a plain-language summary containing:

- Selected product and starting price.
- Every selected paid upgrade.
- Order total.
- Current estimated delivery window.
- The inspiration reference and uploaded-file count.
- Customer name, email, phone, and shipping address.
- Customization answers.

Before the Square button, show this required acknowledgement:

> I understand that I am paying the full starting price for this custom piece. Twisted Custom Leather will confirm the design and measurements before work begins. Upgrades or changes I approve may require an additional payment.

The button reads “Pay [total] Securely With Square.” A secondary Back action returns to customization without losing answers.

## After Payment

The checkout success page should show a simple four-part timeline:

1. Payment received.
2. Twisted Custom Leather reviews the details and contacts the customer to confirm the design and measurements.
3. The piece is handcrafted during the displayed delivery window.
4. The customer receives completion and shipping information.

It should repeat the customer’s order reference number and provide email and Facebook contact links. It must not promise production has started until the design is confirmed.

## Trust Information Around the Assistant

Place a compact reassurance section immediately before or beside the assistant:

- “More than 30 years of leatherwork.”
- Two or three short customer-review excerpts with a link to all Google reviews.
- Secure Square payment.
- Handmade in Valliant, Oklahoma.
- Clear link to a concise FAQ covering starting prices, additional charges, measurements, turnaround, shipping, changes, and leather care.

This information should support the order decision without interrupting the three steps.

## Component and Data Design

### Product Configuration

Extend `src/data/checkout-products.ts` so each product defines:

- Stable ID, name, starting amount, description, and category.
- Relevant field keys.
- Required field keys.
- Supported upgrades.
- Gallery-reference aliases.

This configuration is the source of truth for both the interface and server validation. The client must not invent prices or accepted upgrades independently from the server.

### Assistant Components

Replace the single large `CustomOrderCheckout` interface with a small orchestrating component and focused children:

- `CustomOrderAssistant` — owns selected product, current step, draft state, validation, and submission.
- `OrderProgress` — accessible three-step progress indicator.
- `ProductSelectionStep` — grouped one-product selection.
- `CustomizationStep` — renders fields from product configuration and manages inspiration assets.
- `OrderReviewStep` — contact information, disclosure, total, delivery estimate, and Square handoff.

The current checkout component can be migrated behind the existing `#custom-order` anchor so navigation links remain valid.

### Draft Preservation

Save the selected product and non-sensitive customization answers in local browser storage with a seven-day expiry. Do not persist name, email, phone, address, or payment information. Clear the draft after successful checkout.

### Order and Upload Data

Use explicit shared types for:

- `CustomOrderDraft`
- `CustomOrderItem`
- `ProductCustomization`
- `OrderReference`
- `OrderAsset`

Reference images are stored privately in Cloudflare R2 under cryptographically random `order-uploads/` keys, then promoted to `order-assets/` only after checkout succeeds. Private measurements, contact details, customization, and image URLs live in a signed `order-manifests/` record. Objects are never listed publicly, and temporary uploads are reconciled and removed when their intent expires. Configure automatic deletion after 90 days.

The interface applies clear character limits to free-text answers. The server builds a 500-character Square payment note containing only the order reference, compact item/total text, and the private-manifest reference. Contact details, measurements, customization, and reference-image URLs remain only in the signed private manifest.

Customization answers allow up to 2,000 characters each; customer notes allow up to 300 characters. Attached images use `order-assets/<checkout-attempt-id>/<upload-uuid>.jpg`, binding every durable asset to the checkout attempt rather than the customer-facing reference. Square receives only the compact note (never more than 500 characters); private contact, notes, customization, and image metadata remain in `order-manifests/`.

On final submission:

1. Validate image types and sizes on the client and server.
2. Upload any reference images and receive opaque asset identifiers.
3. Post the selected product, customization data, customer details, gallery reference, asset identifiers, and disclosure acceptance to `/api/checkout`.
4. Recalculate all prices on the server.
5. Generate a customer-friendly order reference such as `TCL-8K4M2P`.
6. Create the Square payment link for the full starting total.
7. Put only compact references in the 500-character Square payment note; keep private details and reference-image URLs in the signed `order-manifests/` record.
8. Set Square’s return URL to `/checkout/success?ref=<order-reference>` and redirect the customer to Square.

No card information passes through or is stored by the Twisted Custom Leather site.

## Validation and Error Handling

- Each step validates only the fields visible for that product.
- Validation errors appear beside the affected field and in an accessible summary.
- Back and forward actions preserve all valid entries.
- A gallery reference that is missing or no longer recognized is ignored safely.
- An unavailable upload service does not lose the draft; the customer can retry or proceed without images.
- Square failures keep the completed order review visible and offer a retry action.
- Server-side validation rejects unknown products, fields, upgrades, altered prices, invalid files, quantities greater than one, and missing disclosure acceptance.
- The submit button prevents duplicate checkout requests while a request is active.

## Accessibility and Mobile Requirements

- Full keyboard operation and visible focus styles.
- Step changes move focus to the new step heading and announce validation errors.
- Every input has a visible label and useful autocomplete attributes where appropriate.
- Touch targets are at least 44 by 44 pixels.
- At 390-pixel width, product selection, fields, summary, and buttons remain single-column with no horizontal scrolling.
- The active step and total remain easy to find without a permanently obstructive overlay.
- Respect reduced-motion preferences.

## Testing

### Unit Tests

- Product-to-field mappings.
- Server-side price and upgrade calculations.
- Delivery-window calculation.
- Gallery-reference mapping.
- Draft expiry and sanitization.
- File type, count, and size validation.

### Component Tests

- One product can be selected.
- Only relevant fields render.
- Back and next preserve answers.
- Required acknowledgement gates checkout.
- Gallery entry preselects a product and shows the correct reference.
- Upload failure, removal, and retry behavior.
- Error focus and keyboard navigation.

### API Tests

- Valid Square checkout creation.
- Rejection of unknown products, altered totals, duplicate submission, and invalid assets.
- R2 storage failure and Square failure responses.
- Compact Square-note generation that preserves order references, measurements, prices, and image URLs within the provider limit.

### End-to-End Verification

- Complete one representative wallet order and one measurement-heavy belt order in Square sandbox mode.
- Verify success-page next steps and draft clearing.
- Verify desktop and 390-pixel mobile layouts.
- Confirm existing homepage, gallery popups, album links, header anchors, and unrelated pages remain unchanged.

## Non-Goals

- Multiple custom pieces in one checkout.
- A customer login or order-tracking portal.
- A new staff administration dashboard.
- Automatic approval of custom artwork or final pricing.
- Replacing Square.
- Live inventory management.
- Rebuilding product galleries outside the new “Make One Like This” entry point.

## Suggested Delivery Order

1. Product configuration, server validation, and assistant steps without uploads.
2. Gallery preselection and “Make One Like This.”
3. Secure reference-image uploads and stored order summaries.
4. Success-page timeline, review excerpts, and FAQ links.
5. Mobile, accessibility, failure-path, and Square sandbox verification.
