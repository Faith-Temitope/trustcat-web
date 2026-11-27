/* Chidex storefront */
(function () {
  const S = window.ChidexStore;
  const I = window.ChidexIcons;
  const N = S.naira;
  const $ = (sel, el = document) => el.querySelector(sel);
  const app = $('#app');

  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const catName = (id) => (S.categories.find((c) => c.id === id) || {}).name || id;

  /* ---------- small helpers ---------- */
  function art(p, cls = '') {
    if (p.image) return `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" ${cls}>`;
    return I.get(p.category);
  }
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove('show'), 2200);
  }
  function modal(html) {
    $('#modal-card').innerHTML = html;
    $('#modal').classList.add('open');
  }
  function closeModal() { $('#modal').classList.remove('open'); }
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });

  /* ---------- cart ---------- */
  function cartQty(id) { return (S.getCart().find((i) => i.id === id) || {}).qty || 0; }
  function setQty(id, qty) {
    const p = S.getProduct(id);
    let cart = S.getCart().slice();
    const max = p ? Math.max(0, Number(p.stock) || 0) : 0;
    qty = Math.max(0, Math.min(max, Math.floor(qty) || 0));
    const i = cart.findIndex((x) => x.id === id);
    if (qty === 0) cart = cart.filter((x) => x.id !== id);
    else if (i >= 0) cart[i] = { id, qty };
    else cart.push({ id, qty });
    S.saveCart(cart);
    refreshCart();
    return qty;
  }
  function addToCart(id, qty = 1) {
    const before = S.priceCart(S.getCart()).isWholesale;
    const p = S.getProduct(id);
    if (!p) return;
    const wanted = cartQty(id) + qty;
    const got = setQty(id, wanted);
    const after = S.priceCart(S.getCart()).isWholesale;
    if (got < wanted) toast('Only ' + p.stock + ' in stock. Your cart has ' + got + '.');
    else if (!before && after) celebrate();
    else toast('Added: ' + p.name);
  }
  function celebrate() {
    toast('🎉 Wholesale unlocked! Every item is now at wholesale price.');
  }

  function meterHTML(t, dark) {
    const pct = Math.round(t.progress * 100);
    const msg = t.isWholesale
      ? `<b>Wholesale prices applied.</b> You are saving <b>${N(t.potentialSavings)}</b>.`
      : t.retailSubtotal === 0
        ? `Spend <b>${N(t.threshold)}</b> and every item drops to wholesale price.`
        : `You are <b>${N(t.remaining)}</b> away from wholesale prices (save ${N(t.potentialSavings)} or more).`;
    return `<div class="tape-meter ${t.isWholesale ? 'done' : ''} ${dark ? 'on-dark' : ''}">
      <p class="tape-msg">${msg}</p>
      <div class="tape-track" role="progressbar" aria-valuemin="0" aria-valuemax="${t.threshold}" aria-valuenow="${Math.min(t.retailSubtotal, t.threshold)}" aria-label="Progress to wholesale">
        <div class="tape-fill" style="width:${pct}%"></div><div class="tape-ticks"></div>
      </div>
      <div class="tape-labels"><span>₦0</span><span>${N(t.threshold / 2)}</span><span>${N(t.threshold)}</span></div>
    </div>`;
  }

  function qtyHTML(id, qty) {
    return `<div class="qty" data-qty="${esc(id)}">
      <button type="button" data-step="-1" aria-label="Decrease">−</button>
      <input type="number" inputmode="numeric" min="0" value="${qty}" aria-label="Quantity">
      <button type="button" data-step="1" aria-label="Increase">+</button>
    </div>`;
  }

  function renderDrawer() {
    const t = S.priceCart(S.getCart());
    $('#drawer-meter').innerHTML = meterHTML(t);
    if (!t.lines.length) {
      $('#drawer-body').innerHTML = `<div class="empty"><h3>Cart is empty</h3><p>Add threads, zips, lace and more.</p><a class="btn small" href="#/shop" data-close-cart>Start shopping</a></div>`;
      $('#drawer-foot').innerHTML = '';
      return;
    }
    $('#drawer-body').innerHTML = t.lines.map((l) => `
      <div class="line">
        <div class="line-img" style="background:${I.tint(l.product.category)}">${art(l.product)}</div>
        <div>
          <div class="line-name">${esc(l.product.name)}</div>
          <div class="line-meta">${N(l.unitPrice)} ${esc(l.product.unit)}${t.isWholesale ? ' · <b style="color:var(--mint)">wholesale</b>' : ''}</div>
          ${qtyHTML(l.id, l.qty)}
          <button class="link-btn" data-remove="${esc(l.id)}">Remove</button>
        </div>
        <div class="line-total">${N(l.total)}${t.isWholesale ? `<s>${N(l.product.retail * l.qty)}</s>` : ''}</div>
      </div>`).join('');
    $('#drawer-foot').innerHTML = `
      <div class="sum-row"><span>Retail value</span><span>${N(t.retailSubtotal)}</span></div>
      ${t.isWholesale ? `<div class="sum-row save"><span>Wholesale savings</span><span>−${N(t.potentialSavings)}</span></div>` : ''}
      <div class="sum-row total"><span>Subtotal</span><span>${N(t.subtotal)}</span></div>
      <p style="font-size:12.5px;color:var(--muted);margin:4px 0 12px">Delivery or pickup chosen at checkout.</p>
      <a class="btn tape block" href="#/checkout" data-close-cart>Checkout · ${N(t.subtotal)}</a>`;
  }

  function refreshCart() {
    const t = S.priceCart(S.getCart());
    const b = $('#cart-count');
    b.hidden = t.count === 0;
    b.textContent = t.count > 99 ? '99+' : t.count;
    renderDrawer();
    document.querySelectorAll('[data-live-meter]').forEach((el) => (el.innerHTML = meterHTML(t, el.dataset.liveMeter === 'dark')));
    document.querySelectorAll('[data-card-prices]').forEach((el) => {
      const p = S.getProduct(el.dataset.cardPrices);
      if (p) el.outerHTML = pricesHTML(p, t.isWholesale);
    });
    if (location.hash.startsWith('#/checkout')) renderCheckoutSummary();
  }

  function openCart() {
    renderDrawer();
    $('#drawer').classList.add('open');
    $('#scrim').classList.add('open');
    $('#drawer').setAttribute('aria-hidden', 'false');
  }
  function closeCart() {
    $('#drawer').classList.remove('open');
    $('#scrim').classList.remove('open');
    $('#drawer').setAttribute('aria-hidden', 'true');
  }
  $('#scrim').addEventListener('click', closeCart);

  /* ---------- product card ---------- */
  function pricesHTML(p, w) {
    return `<div class="prices ${w ? 'is-w' : ''}" data-card-prices="${esc(p.id)}">
      ${w
        ? `<div class="p-retail" style="color:var(--mint)">${N(p.wholesale)}<s>${N(p.retail)}</s></div><div class="p-whole"><span class="wchip">Wholesale</span> applied</div>`
        : `<div class="p-retail">${N(p.retail)}</div><div class="p-whole"><span class="wchip">Wholesale</span> <b>${N(p.wholesale)}</b></div>`}
    </div>`;
  }
  function cardHTML(p, w) {
    const stock = Number(p.stock) || 0;
    const tag = stock === 0 ? '<span class="tag low">Sold out</span>' : stock < 20 ? `<span class="tag low">Only ${stock} left</span>` : p.featured ? '<span class="tag">Best seller</span>' : '';
    return `<article class="card">
      <a class="card-img" href="#/p/${esc(p.id)}" style="background:${I.tint(p.category)}">${tag}${art(p)}</a>
      <div class="card-body">
        <div class="card-cat">${esc(catName(p.category))}</div>
        <a class="card-name" href="#/p/${esc(p.id)}">${esc(p.name)}</a>
        <div class="card-unit">${esc(p.unit)}</div>
        ${pricesHTML(p, w)}
        <div class="add-row"><button class="btn" data-add="${esc(p.id)}" ${stock === 0 ? 'disabled' : ''}>${stock === 0 ? 'Sold out' : 'Add to cart'}</button></div>
      </div>
    </article>`;
  }

  /* ---------- pages ---------- */
  function pageHome() {
    const st = S.getSettings();
    const t = S.priceCart(S.getCart());
    const featured = S.getProducts().filter((p) => p.featured).slice(0, 8);
    const sample = featured[0] || S.getProducts()[0];
    app.innerHTML = `
      <section class="hero">
        <div class="wrap hero-grid">
          <div class="reveal">
            <div class="eyebrow">Kogi State’s sewing materials store</div>
            <h1>Everything a tailor needs, <em>by the piece</em> or by the carton.</h1>
            <p class="lead">Threads, zips, linings, laces, stones and tools. Shop retail any day. Hit <b>${N(st.threshold)}</b> in your cart and <b>every item drops to wholesale price</b>, no account needed.</p>
            <div class="hero-ctas">
              <a class="btn tape" href="#/shop">Shop all materials</a>
              <a class="btn ghost" href="#/wholesale">How wholesale works</a>
            </div>
            <div class="hero-facts">
              <span><b>${S.getProducts().length}+</b>products in stock</span>
              <span><b>${st.deliveryZones.length}</b>Kogi towns delivered</span>
              <span><b>100%</b>secure online payment</span>
            </div>
          </div>
          <div class="hero-card">
            <div class="spool-deco">${I.get('threads')}</div>
            <div class="eyebrow">Two prices on everything</div>
            <h3>${esc(sample.name)}</h3>
            <div class="price-demo">
              <div><small>Retail</small><strong>${N(sample.retail)}</strong></div>
              <div class="w"><small>Wholesale</small><strong>${N(sample.wholesale)}</strong></div>
            </div>
            <div data-live-meter="dark">${meterHTML(t, true)}</div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="wrap">
          <div class="section-head"><h2>Shop by category</h2><a href="#/shop">View all →</a></div>
          <div class="cat-grid">
            ${S.categories.map((c) => `
              <a class="cat" href="#/shop?cat=${c.id}">
                <span class="ic" style="background:${I.tint(c.id)}">${I.get(c.id)}</span>
                <b>${esc(c.name)}</b><span>${esc(c.blurb)}</span>
              </a>`).join('')}
            <a class="cat" href="#/wholesale" style="background:var(--tape);border-color:var(--tape-deep)">
              <span class="ic" style="background:#fff3c4">${I.get('cart')}</span>
              <b>Buying in bulk?</b><span>See wholesale rules</span>
            </a>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="wrap">
          <div class="section-head"><h2>Tailors’ favourites</h2><a href="#/shop">Shop all →</a></div>
          <div class="grid">${featured.map((p) => cardHTML(p, t.isWholesale)).join('')}</div>
        </div>
      </section>

      <section class="section">
        <div class="wrap">${howHTML(st)}</div>
      </section>`;
  }

  function howHTML(st) {
    return `<div class="how">
      <div class="eyebrow" style="color:var(--tape)">Wholesale, made simple</div>
      <h2>Fill your cart to <em>${N(st.threshold)}</em>.<br>Pay wholesale on everything.</h2>
      <div class="steps">
        <div class="step"><b>See both prices</b><p>Every product shows its retail price and its wholesale price. No login, no hidden list.</p></div>
        <div class="step"><b>Watch the tape fill</b><p>Your cart measures your order. Once the retail total reaches ${N(st.threshold)}, every item switches to wholesale price.</p></div>
        <div class="step"><b>Pay & collect</b><p>Pay securely online. Pick up at our store, or we deliver to you anywhere in Kogi State.</p></div>
      </div>
    </div>`;
  }

  function pageWholesale() {
    const st = S.getSettings();
    app.innerHTML = `<section class="section"><div class="wrap">${howHTML(st)}
      <div class="panel" style="margin-top:20px">
        <h2>Good to know</h2>
        <ul style="margin:0;padding-left:18px;color:var(--ink-2);line-height:1.9">
          <li>The ${N(st.threshold)} is counted on the <b>retail</b> value of your cart, before delivery.</li>
          <li>Mix and match freely: threads, zips, fabric, anything counts towards it.</li>
          <li>If you remove items and drop below ${N(st.threshold)}, prices go back to retail.</li>
          <li>Delivery is available to ${st.deliveryZones.map((z) => esc(z.name)).join(', ')}. Store pickup is free.</li>
          <li>Need a very large quantity or something not listed? <a href="https://wa.me/${esc(st.whatsapp)}" target="_blank" rel="noopener">Message us on WhatsApp</a>.</li>
        </ul>
        <a class="btn tape" style="margin-top:18px" href="#/shop">Start filling your cart</a>
      </div></div></section>`;
  }

  function pageShop(params) {
    const cat = params.get('cat') || '';
    const q = (params.get('q') || '').trim().toLowerCase();
    const sort = params.get('sort') || 'popular';
    const t = S.priceCart(S.getCart());
    let list = S.getProducts().filter((p) => (!cat || p.category === cat));
    if (q) list = list.filter((p) => (p.name + ' ' + p.desc + ' ' + catName(p.category)).toLowerCase().includes(q));
    if (sort === 'low') list = list.slice().sort((a, b) => a.retail - b.retail);
    if (sort === 'high') list = list.slice().sort((a, b) => b.retail - a.retail);
    if (sort === 'popular') list = list.slice().sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    const link = (o) => {
      const p = new URLSearchParams({ cat, q: params.get('q') || '', sort, ...o });
      [...p.keys()].forEach((k) => !p.get(k) && p.delete(k));
      return '#/shop' + (p.toString() ? '?' + p : '');
    };
    app.innerHTML = `
      <div class="wrap">
        <div class="shop-head">
          <div class="eyebrow">${q ? 'Search results' : 'Shop'}</div>
          <h1>${q ? '“' + esc(params.get('q')) + '”' : cat ? esc(catName(cat)) : 'All sewing materials'}</h1>
        </div>
        <div class="chips">
          <a class="chip ${!cat ? 'on' : ''}" href="${link({ cat: '' })}" style="display:inline-flex;align-items:center;text-decoration:none">All</a>
          ${S.categories.map((c) => `<a class="chip ${cat === c.id ? 'on' : ''}" href="${link({ cat: c.id })}" style="display:inline-flex;align-items:center;text-decoration:none">${esc(c.name)}</a>`).join('')}
        </div>
        <div class="panel" style="padding:16px 18px;margin-bottom:18px" data-live-meter>${meterHTML(t)}</div>
        <div class="toolbar">
          <span>${list.length} product${list.length === 1 ? '' : 's'}</span>
          <select aria-label="Sort" id="sort">
            <option value="popular" ${sort === 'popular' ? 'selected' : ''}>Popular</option>
            <option value="low" ${sort === 'low' ? 'selected' : ''}>Price: low to high</option>
            <option value="high" ${sort === 'high' ? 'selected' : ''}>Price: high to low</option>
          </select>
        </div>
        ${list.length ? `<div class="grid">${list.map((p) => cardHTML(p, t.isWholesale)).join('')}</div>`
          : `<div class="empty"><h3>Nothing found</h3><p>Try another word, or ask us on WhatsApp, we probably have it.</p><a class="btn small" href="#/shop">See all products</a></div>`}
        <div style="height:40px"></div>
      </div>`;
    $('#sort').addEventListener('change', (e) => (location.hash = link({ sort: e.target.value })));
    document.querySelectorAll('[data-search] input').forEach((i) => (i.value = params.get('q') || ''));
  }

  function pageProduct(id) {
    const p = S.getProduct(id);
    if (!p) return pageNotFound();
    const t = S.priceCart(S.getCart());
    const st = S.getSettings();
    const stock = Number(p.stock) || 0;
    const related = S.getProducts().filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);
    app.innerHTML = `
      <div class="wrap">
        <div class="pd">
          <div class="pd-img" style="background:${I.tint(p.category)}">${art(p)}</div>
          <div>
            <div class="crumbs"><a href="#/shop">Shop</a> / <a href="#/shop?cat=${esc(p.category)}">${esc(catName(p.category))}</a></div>
            <h1>${esc(p.name)}</h1>
            <div class="pd-unit">Sold ${esc(p.unit)} · Code ${esc(p.id)}</div>
            <div class="price-box">
              <div><small>Retail price</small><strong>${N(p.retail)}</strong></div>
              <div class="w"><small>Wholesale price</small><strong>${N(p.wholesale)}</strong></div>
            </div>
            <p class="pd-note">${t.isWholesale
              ? '<b style="color:var(--mint)">Your cart has unlocked wholesale.</b> This item will be charged at ' + N(p.wholesale) + '.'
              : 'Wholesale price applies to <b>every item</b> once your cart reaches ' + N(st.threshold) + ' at retail value.'}</p>
            <div class="pd-buy">
              ${qtyHTML('pd', 1)}
              <button class="btn tape" id="pd-add" ${stock === 0 ? 'disabled' : ''}>${stock === 0 ? 'Sold out' : 'Add to cart'}</button>
            </div>
            <div class="stock ${stock < 20 ? 'low' : 'ok'}">${stock === 0 ? 'Out of stock. Message us to reserve.' : stock < 20 ? 'Only ' + stock + ' left' : 'In stock'}</div>
            <div class="panel" style="margin-top:18px;padding:16px 18px" data-live-meter>${meterHTML(t)}</div>
            ${p.desc ? `<div class="pd-desc">${esc(p.desc)}</div>` : ''}
          </div>
        </div>
        ${related.length ? `<div class="section-head"><h2>More ${esc(catName(p.category).toLowerCase())}</h2></div><div class="grid">${related.map((r) => cardHTML(r, t.isWholesale)).join('')}</div><div style="height:40px"></div>` : ''}
      </div>`;
    const input = $('[data-qty="pd"] input');
    $('[data-qty="pd"]').addEventListener('click', (e) => {
      const b = e.target.closest('[data-step]');
      if (b) input.value = Math.max(1, Math.min(stock, (Number(input.value) || 1) + Number(b.dataset.step)));
    });
    $('#pd-add') && $('#pd-add').addEventListener('click', () => addToCart(p.id, Math.max(1, Number(input.value) || 1)));
  }

  /* ---------- checkout ---------- */
  let checkoutState = { method: 'pickup', zone: '' };

  function deliveryFee() {
    if (checkoutState.method !== 'delivery') return 0;
    const z = S.getSettings().deliveryZones.find((x) => x.name === checkoutState.zone);
    return z ? Number(z.fee) || 0 : 0;
  }

  function renderCheckoutSummary() {
    const box = $('#co-summary');
    if (!box) return;
    const t = S.priceCart(S.getCart());
    if (!t.lines.length) { route(); return; }
    const fee = deliveryFee();
    box.innerHTML = `
      <h2>Order summary</h2>
      ${meterHTML(t)}
      <div style="margin-top:14px">
        ${t.lines.map((l) => `<div class="mini-line"><span>${l.qty} × ${esc(l.product.name)}</span><span>${N(l.total)}</span></div>`).join('')}
      </div>
      <div style="margin-top:12px">
        <div class="sum-row"><span>Retail value</span><span>${N(t.retailSubtotal)}</span></div>
        ${t.isWholesale ? `<div class="sum-row save"><span>Wholesale savings</span><span>−${N(t.potentialSavings)}</span></div>` : ''}
        <div class="sum-row"><span>Subtotal</span><span>${N(t.subtotal)}</span></div>
        <div class="sum-row"><span>${checkoutState.method === 'delivery' ? 'Delivery' + (checkoutState.zone ? ' to ' + esc(checkoutState.zone) : '') : 'Store pickup'}</span><span>${checkoutState.method === 'delivery' ? (checkoutState.zone ? N(fee) : 'Choose town') : 'Free'}</span></div>
        <div class="sum-row total"><span>Total to pay</span><span>${N(t.subtotal + fee)}</span></div>
      </div>
      ${!t.isWholesale ? `<a href="#/shop" class="btn ghost small block" style="margin-top:12px">Add ${N(t.remaining)} more for wholesale</a>` : ''}`;
  }

  function pageCheckout() {
    const t = S.priceCart(S.getCart());
    const st = S.getSettings();
    if (!t.lines.length) {
      app.innerHTML = `<div class="wrap"><div class="empty"><h3>Your cart is empty</h3><p>Add some materials first.</p><a class="btn" href="#/shop">Go to shop</a></div></div>`;
      return;
    }
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem('chidex:buyer') || '{}'); } catch (e) {}
    app.innerHTML = `
      <div class="wrap">
        <div class="shop-head"><div class="eyebrow">Checkout</div><h1>Almost done</h1></div>
        <div class="checkout">
          <form id="co-form" novalidate>
            <div class="panel">
              <h2>Your details</h2>
              <div class="two">
                <div class="field"><label for="co-name">Full name / business name</label><input id="co-name" name="name" required autocomplete="name" value="${esc(saved.name)}"></div>
                <div class="field"><label for="co-phone">Phone (WhatsApp)</label><input id="co-phone" name="phone" required type="tel" autocomplete="tel" placeholder="080..." value="${esc(saved.phone)}"></div>
              </div>
              <div class="field"><label for="co-email">Email (for receipt)</label><input id="co-email" name="email" required type="email" autocomplete="email" value="${esc(saved.email)}"></div>
            </div>
            <div class="panel">
              <h2>Pickup or delivery</h2>
              <div class="choice">
                <label><input type="radio" name="method" value="pickup" ${checkoutState.method === 'pickup' ? 'checked' : ''}><div><b>Pick up at store</b><span>Free · ${esc(st.address)}</span></div></label>
                <label><input type="radio" name="method" value="delivery" ${checkoutState.method === 'delivery' ? 'checked' : ''}><div><b>Deliver to me</b><span>Anywhere in Kogi State · fee by town</span></div></label>
              </div>
              <div id="delivery-fields" ${checkoutState.method === 'delivery' ? '' : 'hidden'}>
                <div class="field"><label for="co-zone">Town</label>
                  <select id="co-zone" name="zone">
                    <option value="">Select your town…</option>
                    ${st.deliveryZones.map((z) => `<option value="${esc(z.name)}" ${checkoutState.zone === z.name ? 'selected' : ''}>${esc(z.name)} · ${N(z.fee)}</option>`).join('')}
                  </select>
                  <span class="hint">Not listed? Choose the nearest town and add directions below.</span>
                </div>
                <div class="field"><label for="co-addr">Delivery address</label><textarea id="co-addr" name="address" placeholder="Street, landmark, shop name…">${esc(saved.address)}</textarea></div>
              </div>
              <p id="pickup-note" class="hint" style="font-size:13px;color:var(--muted)" ${checkoutState.method === 'pickup' ? '' : 'hidden'}>${esc(st.pickupNote)} Open ${esc(st.hours)}.</p>
              <div class="field" style="margin-top:8px"><label for="co-notes">Order notes (optional)</label><textarea id="co-notes" name="notes" placeholder="Colours, sizes, anything we should know"></textarea></div>
            </div>
            <div class="panel">
              <p class="error" id="co-error" hidden></p>
              <button class="btn tape block" type="submit" id="co-pay">Pay securely</button>
              <div class="secure"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg> Card, bank transfer or USSD via Paystack</div>
            </div>
          </form>
          <aside class="panel" id="co-summary" style="position:sticky;top:90px"></aside>
        </div>
      </div>`;
    renderCheckoutSummary();
    updatePayButton();

    const form = $('#co-form');
    form.addEventListener('change', (e) => {
      if (e.target.name === 'method') {
        checkoutState.method = e.target.value;
        $('#delivery-fields').hidden = checkoutState.method !== 'delivery';
        $('#pickup-note').hidden = checkoutState.method !== 'pickup';
      }
      if (e.target.name === 'zone') checkoutState.zone = e.target.value;
      renderCheckoutSummary();
      updatePayButton();
    });
    form.addEventListener('submit', (e) => { e.preventDefault(); submitOrder(form); });
  }

  function updatePayButton() {
    const t = S.priceCart(S.getCart());
    const b = $('#co-pay');
    if (b) b.textContent = 'Pay ' + N(t.subtotal + deliveryFee()) + ' securely';
  }

  function submitOrder(form) {
    const d = Object.fromEntries(new FormData(form).entries());
    const err = $('#co-error');
    const fail = (m) => { err.textContent = m; err.hidden = false; };
    err.hidden = true;
    if (!d.name || d.name.trim().length < 2) return fail('Please enter your name.');
    if (!/^\+?[0-9\s-]{10,15}$/.test(d.phone || '')) return fail('Please enter a valid phone number.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email || '')) return fail('Please enter a valid email for your receipt.');
    if (d.method === 'delivery' && !d.zone) return fail('Please choose your delivery town.');
    if (d.method === 'delivery' && (!d.address || d.address.trim().length < 5)) return fail('Please enter your delivery address.');

    try { localStorage.setItem('chidex:buyer', JSON.stringify({ name: d.name, phone: d.phone, email: d.email, address: d.address || '' })); } catch (e) {}

    const t = S.priceCart(S.getCart());
    const fee = deliveryFee();
    const ref = 'CHX-' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    const order = {
      id: ref,
      createdAt: new Date().toISOString(),
      customer: { name: d.name.trim(), phone: d.phone.trim(), email: d.email.trim() },
      method: d.method,
      zone: d.method === 'delivery' ? d.zone : '',
      address: d.method === 'delivery' ? d.address.trim() : '',
      notes: (d.notes || '').trim(),
      pricing: t.isWholesale ? 'wholesale' : 'retail',
      lines: t.lines.map((l) => ({ id: l.id, name: l.product.name, unit: l.product.unit, qty: l.qty, unitPrice: l.unitPrice, total: l.total })),
      retailSubtotal: t.retailSubtotal,
      subtotal: t.subtotal,
      savings: t.isWholesale ? t.potentialSavings : 0,
      deliveryFee: fee,
      total: t.subtotal + fee,
      status: 'Paid',
      payment: {},
    };
    pay(order, (payment) => {
      order.payment = payment;
      S.addOrder(order);
      S.saveCart([]);
      refreshCart();
      location.hash = '#/order/' + order.id;
    });
  }

  /* Paystack Inline. Without a public key the site runs in demo mode.
     IMPORTANT for go-live: verify every reference on a server with the
     Paystack SECRET key (GET /transaction/verify/:ref) before packing an order. */
  function pay(order, onPaid) {
    const key = S.getSettings().paystackPublicKey;
    if (!key) {
      modal(`<h3>Demo payment</h3>
        <p style="color:var(--ink-2)">No Paystack key has been added yet (Admin → Settings). In the live site this opens Paystack for <b>${N(order.total)}</b>.</p>
        <div style="display:flex;gap:10px;margin-top:16px"><button class="btn tape" id="demo-ok">Simulate successful payment</button><button class="btn ghost" id="demo-x">Cancel</button></div>`);
      $('#demo-ok').onclick = () => { closeModal(); onPaid({ provider: 'demo', reference: order.id }); };
      $('#demo-x').onclick = closeModal;
      return;
    }
    const start = () => {
      const handler = window.PaystackPop.setup({
        key,
        email: order.customer.email,
        amount: Math.round(order.total * 100),
        currency: 'NGN',
        ref: order.id,
        metadata: { custom_fields: [
          { display_name: 'Customer', variable_name: 'customer', value: order.customer.name },
          { display_name: 'Phone', variable_name: 'phone', value: order.customer.phone },
          { display_name: 'Fulfilment', variable_name: 'fulfilment', value: order.method + (order.zone ? ' – ' + order.zone : '') },
        ] },
        callback: (res) => onPaid({ provider: 'paystack', reference: res.reference, status: res.status }),
        onClose: () => toast('Payment window closed. Your cart is saved.'),
      });
      handler.openIframe();
    };
    if (window.PaystackPop) return start();
    const s = document.createElement('script');
    s.src = 'https://js.paystack.co/v1/inline.js';
    s.onload = start;
    s.onerror = () => toast('Could not reach Paystack. Check your connection and try again.');
    document.head.appendChild(s);
  }

  function pageOrder(id) {
    const o = S.getOrder(id);
    const st = S.getSettings();
    if (!o) return pageNotFound();
    app.innerHTML = `
      <div class="wrap"><div class="order-done">
        <div class="tick"><svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg></div>
        <h1>Payment received. Thank you, ${esc(o.customer.name.split(' ')[0])}!</h1>
        <div class="ref">${esc(o.id)}</div>
        <p style="color:var(--ink-2)">${o.method === 'pickup'
          ? 'We are packing your order. We will call <b>' + esc(o.customer.phone) + '</b> when it is ready for pickup at ' + esc(st.address) + '.'
          : 'We are packing your order for delivery to <b>' + esc(o.zone) + '</b>. Our team will call <b>' + esc(o.customer.phone) + '</b> before dispatch.'}</p>
        <div class="panel receipt">
          ${o.lines.map((l) => `<div class="mini-line"><span>${l.qty} × ${esc(l.name)}</span><span>${N(l.total)}</span></div>`).join('')}
          <div style="margin-top:10px">
            ${o.savings ? `<div class="sum-row save"><span>Wholesale savings</span><span>−${N(o.savings)}</span></div>` : ''}
            <div class="sum-row"><span>${o.method === 'delivery' ? 'Delivery' : 'Pickup'}</span><span>${o.deliveryFee ? N(o.deliveryFee) : 'Free'}</span></div>
            <div class="sum-row total"><span>Paid</span><span>${N(o.total)}</span></div>
          </div>
        </div>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:20px">
          <a class="btn tape" target="_blank" rel="noopener" href="https://wa.me/${esc(st.whatsapp)}?text=${encodeURIComponent('Hello Chidex, I just paid for order ' + o.id + '.')}">Message us on WhatsApp</a>
          <a class="btn ghost" href="#/shop">Continue shopping</a>
        </div>
      </div></div>`;
  }

  function pageAbout() {
    const st = S.getSettings();
    app.innerHTML = `
      <div class="wrap"><div class="about-grid">
        <div class="reveal">
          <div class="eyebrow">About Chidex</div>
          <h1>Supplying the tailors of Kogi State.</h1>
          <p>${esc(st.about)}</p>
          <div class="hero-ctas" style="margin-top:22px"><a class="btn tape" href="#/shop">Shop now</a><a class="btn ghost" target="_blank" rel="noopener" href="https://wa.me/${esc(st.whatsapp)}">Chat on WhatsApp</a></div>
        </div>
        <div class="panel">
          <h2>Visit or contact us</h2>
          <ul class="info-list">
            <li><small>Store</small>${esc(st.address)}</li>
            <li><small>Opening hours</small>${esc(st.hours)}</li>
            <li><small>Phone</small><a href="tel:${esc(st.phone.replace(/\s/g, ''))}">${esc(st.phone)}</a></li>
            <li><small>Email</small><a href="mailto:${esc(st.email)}">${esc(st.email)}</a></li>
            <li><small>We deliver to</small>${st.deliveryZones.map((z) => esc(z.name)).join(' · ')}</li>
          </ul>
        </div>
      </div></div>`;
  }

  function pageNotFound() {
    app.innerHTML = `<div class="wrap"><div class="empty"><h3>Page not found</h3><p>That item may have been removed.</p><a class="btn" href="#/shop">Go to shop</a></div></div>`;
  }

  /* ---------- router ---------- */
  function route() {
    const hash = location.hash.slice(1) || '/';
    const [path, query] = hash.split('?');
    const params = new URLSearchParams(query || '');
    const parts = path.split('/').filter(Boolean);
    document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === parts[0]));
    $('#mobile-nav').classList.remove('open');
    if (!parts.length) pageHome();
    else if (parts[0] === 'shop') pageShop(params);
    else if (parts[0] === 'p') pageProduct(decodeURIComponent(parts[1] || ''));
    else if (parts[0] === 'checkout') pageCheckout();
    else if (parts[0] === 'order') pageOrder(decodeURIComponent(parts[1] || ''));
    else if (parts[0] === 'about') pageAbout();
    else if (parts[0] === 'wholesale') pageWholesale();
    else pageNotFound();
    if (!route.keepScroll) window.scrollTo(0, 0);
    route.keepScroll = false;
  }

  /* ---------- global events ---------- */
  document.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) { addToCart(add.dataset.add, 1); return; }
    if (e.target.closest('[data-open-cart]')) { openCart(); return; }
    if (e.target.closest('[data-close-cart]')) closeCart();
    const rm = e.target.closest('[data-remove]');
    if (rm) { setQty(rm.dataset.remove, 0); return; }
    const step = e.target.closest('[data-qty]:not([data-qty="pd"]) [data-step]');
    if (step) {
      const id = step.closest('[data-qty]').dataset.qty;
      setQty(id, cartQty(id) + Number(step.dataset.step));
    }
  });
  document.addEventListener('change', (e) => {
    const box = e.target.closest('[data-qty]:not([data-qty="pd"])');
    if (box && e.target.tagName === 'INPUT') setQty(box.dataset.qty, Number(e.target.value));
  });
  document.querySelectorAll('[data-search]').forEach((f) =>
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = f.q.value.trim();
      location.hash = '#/shop' + (q ? '?q=' + encodeURIComponent(q) : '');
    })
  );
  $('#menu-btn').addEventListener('click', () => {
    const nav = $('#mobile-nav');
    nav.classList.toggle('open');
    $('#menu-btn').setAttribute('aria-expanded', nav.classList.contains('open'));
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeCart(); closeModal(); } });
  window.addEventListener('hashchange', route);

  /* ---------- chrome ---------- */
  function chrome() {
    const st = S.getSettings();
    $('#strip').innerHTML = `Buy <b>${N(st.threshold)}</b> or more and <b>every item</b> drops to wholesale price · Delivery across Kogi State`;
    $('#foot-about').textContent = st.tagline + '. ' + st.address + '.';
    $('#foot-cats').innerHTML = S.categories.slice(0, 6).map((c) => `<a href="#/shop?cat=${c.id}">${esc(c.name)}</a>`).join('') + '<a href="#/about">About us</a>';
    $('#foot-contact').innerHTML = `<a href="tel:${esc(st.phone.replace(/\s/g, ''))}">${esc(st.phone)}</a><a href="mailto:${esc(st.email)}">${esc(st.email)}</a><a href="https://wa.me/${esc(st.whatsapp)}" target="_blank" rel="noopener">WhatsApp us</a><span style="display:block;padding:3px 0">${esc(st.hours)}</span>`;
    $('#wa-float').href = 'https://wa.me/' + st.whatsapp;
    $('#year').textContent = new Date().getFullYear();
  }

  chrome();
  refreshCart();
  route();
})();
