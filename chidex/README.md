# Chidex: sewing materials store

E-commerce website for Chidex (Kogi State). Shoppers can buy at retail any time. When the cart's **retail value reaches ₦100,000**, every item switches to its wholesale price.

## Run it
Open `index.html` through any static server, for example `python3 -m http.server` in this folder, then visit http://localhost:8000.
- Store: `index.html`
- Staff admin: `admin.html` (demo PIN `2468`)

## What's included
- Home, shop (categories, search, sort), product pages, About / contact, "How wholesale works"
- Retail and wholesale price on every product
- Cart with a tape-measure meter that tracks progress to ₦100,000; once reached, the whole cart reprices to wholesale
- Checkout: free store pickup, or delivery to a Kogi town (fee per town), with full online payment through Paystack Inline
- Order confirmation page with a WhatsApp follow-up link
- Admin:
  - Orders: status flow Paid → Packed → Ready / Out for delivery → Completed, with a WhatsApp link to the customer
  - Products: add, edit, delete, photo upload, CSV import/export for hundreds of products
  - Settings: threshold, Paystack key, contact details, About text, delivery towns and fees

## Files
- `js/data.js`: the data layer (products, settings, orders, pricing rule). **This is the only file to change when moving to a real backend.**
- `js/app.js`: storefront
- `js/admin.js`: admin
- `css/style.css`: theme

## Before going live (phase 2)
Right now, data lives in each browser (localStorage). That is fine for a demo, but orders placed on a phone will **not** show up in the admin on another device. To go live:
1. Move products, orders and settings to a database (e.g. Supabase) by swapping the functions in `js/data.js`.
2. Add real staff login to replace the PIN.
3. Verify every Paystack payment on the server with the secret key (Paystack webhook or `/transaction/verify`) before an order counts as paid. Also re-calculate prices server-side.
4. Store product photos in file storage instead of inline.
5. Send email/WhatsApp alerts to Chidex staff on each new order.
6. Fill in the real address, phone, WhatsApp, delivery fees, logo and product photos.
