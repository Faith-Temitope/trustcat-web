/* Chidex admin: orders, products, settings */
(function () {
  const S = window.ChidexStore;
  const I = window.ChidexIcons;
  const N = S.naira;
  const $ = (sel, el = document) => el.querySelector(sel);
  const root = $('#admin');
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const catName = (id) => (S.categories.find((c) => c.id === id) || {}).name || id;
  const STATUSES = ['Paid', 'Packed', 'Ready for pickup', 'Out for delivery', 'Completed', 'Cancelled'];
  let tab = 'orders';
  let filters = { q: '', cat: '', status: '' };

  function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2200); }
  function modal(html, wide) { const c = $('#modal-card'); c.className = 'modal-card' + (wide ? ' wide' : ''); c.innerHTML = html; $('#modal').classList.add('open'); }
  function closeModal() { $('#modal').classList.remove('open'); }
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal' || e.target.closest('[data-close]')) closeModal(); });

  /* ---------- login gate (demo only: real login must be server-side) ---------- */
  function authed() { try { return sessionStorage.getItem('chidex:admin') === '1'; } catch (e) { return !!authed.mem; } }
  function setAuthed(v) { try { v ? sessionStorage.setItem('chidex:admin', '1') : sessionStorage.removeItem('chidex:admin'); } catch (e) { authed.mem = v; } }

  function gate() {
    $('#logout').hidden = true;
    root.innerHTML = `<div class="gate panel">
      <h2>Staff login</h2>
      <p class="note">Demo PIN is <b>2468</b>. Change it in Settings.</p>
      <form id="gate"><div class="field"><label for="pin">PIN</label><input id="pin" type="password" inputmode="numeric" autocomplete="current-password" required></div>
      <p class="error" id="gate-err" hidden>Wrong PIN</p><button class="btn block">Log in</button></form></div>`;
    $('#gate').addEventListener('submit', (e) => {
      e.preventDefault();
      if ($('#pin').value === String(S.getSettings().adminPin)) { setAuthed(true); render(); }
      else $('#gate-err').hidden = false;
    });
    $('#pin').focus();
  }
  $('#logout').addEventListener('click', () => { setAuthed(false); gate(); });

  function render() {
    if (!authed()) return gate();
    $('#logout').hidden = false;
    const newCount = S.getOrders().filter((o) => o.status === 'Paid').length;
    root.innerHTML = `
      <div class="tabs">
        <button class="tab ${tab === 'orders' ? 'on' : ''}" data-tab="orders">Orders${newCount ? ' · ' + newCount + ' new' : ''}</button>
        <button class="tab ${tab === 'products' ? 'on' : ''}" data-tab="products">Products (${S.getProducts().length})</button>
        <button class="tab ${tab === 'settings' ? 'on' : ''}" data-tab="settings">Settings</button>
      </div>
      <div id="pane"></div><div style="height:50px"></div>`;
    root.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.tab; render(); }));
    ({ orders, products, settings })[tab]();
  }

  /* ---------- orders ---------- */
  function orders() {
    const all = S.getOrders();
    const today = new Date().toDateString();
    const live = all.filter((o) => o.status !== 'Cancelled');
    const todays = live.filter((o) => new Date(o.createdAt).toDateString() === today);
    const open = all.filter((o) => !['Completed', 'Cancelled'].includes(o.status));
    let list = all;
    if (filters.status) list = list.filter((o) => o.status === filters.status);
    if (filters.q) { const q = filters.q.toLowerCase(); list = list.filter((o) => (o.id + o.customer.name + o.customer.phone).toLowerCase().includes(q)); }
    $('#pane').innerHTML = `
      <div class="stats">
        <div class="stat"><small>Orders today</small><b>${todays.length}</b></div>
        <div class="stat"><small>Sales today</small><b>${N(todays.reduce((s, o) => s + o.total, 0))}</b></div>
        <div class="stat"><small>To fulfil</small><b>${open.length}</b></div>
        <div class="stat"><small>Wholesale orders</small><b>${live.filter((o) => o.pricing === 'wholesale').length}</b></div>
      </div>
      <div class="bar">
        <input type="search" id="oq" placeholder="Search order no., name or phone" value="${esc(filters.q)}">
        <select id="os"><option value="">All statuses</option>${STATUSES.map((s) => `<option ${filters.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
      </div>
      ${list.length ? `<div class="table-wrap"><table>
        <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Fulfilment</th><th>Pricing</th><th>Total</th><th>Status</th><th></th></tr></thead>
        <tbody>${list.map((o) => `<tr>
          <td><b>${esc(o.id)}</b></td>
          <td class="num">${new Date(o.createdAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</td>
          <td>${esc(o.customer.name)}<br><span class="note">${esc(o.customer.phone)}</span></td>
          <td>${o.method === 'delivery' ? 'Delivery · ' + esc(o.zone) : 'Pickup'}</td>
          <td>${o.pricing === 'wholesale' ? '<span class="wchip">Wholesale</span>' : 'Retail'}</td>
          <td class="num"><b>${N(o.total)}</b></td>
          <td><span class="pill ${esc(o.status.split(' ')[0])}">${esc(o.status)}</span></td>
          <td><button class="btn small ghost" data-order="${esc(o.id)}">Open</button></td></tr>`).join('')}</tbody></table></div>`
        : `<div class="empty"><h3>No orders yet</h3><p>Paid orders from the store appear here.</p></div>`}`;
    $('#oq').addEventListener('input', (e) => { filters.q = e.target.value; orders(); $('#oq').focus(); $('#oq').setSelectionRange(99, 99); });
    $('#os').addEventListener('change', (e) => { filters.status = e.target.value; orders(); });
    $('#pane').querySelectorAll('[data-order]').forEach((b) => b.addEventListener('click', () => orderModal(b.dataset.order)));
  }

  function orderModal(id) {
    const o = S.getOrder(id);
    const st = S.getSettings();
    const wa = (o.customer.phone || '').replace(/\D/g, '').replace(/^0/, '234');
    modal(`
      <h3>${esc(o.id)}</h3>
      <p class="note">${new Date(o.createdAt).toLocaleString('en-NG')} · paid via ${esc(o.payment.provider || '')} (${esc(o.payment.reference || '')})</p>
      <div class="two" style="margin:12px 0">
        <div><small class="eyebrow">Customer</small><div><b>${esc(o.customer.name)}</b><br>${esc(o.customer.phone)}<br>${esc(o.customer.email)}</div></div>
        <div><small class="eyebrow">${o.method === 'delivery' ? 'Deliver to' : 'Pickup'}</small><div>${o.method === 'delivery' ? '<b>' + esc(o.zone) + '</b><br>' + esc(o.address) : esc(st.address)}</div></div>
      </div>
      ${o.notes ? `<p style="background:#fff8dc;padding:10px 12px;border-radius:10px"><b>Note:</b> ${esc(o.notes)}</p>` : ''}
      <div class="table-wrap"><table class="order-lines" style="min-width:0"><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
        <tbody>${o.lines.map((l) => `<tr><td>${esc(l.name)}<br><span class="note">${esc(l.id)} · ${esc(l.unit)}</span></td><td class="num">${l.qty}</td><td class="num">${N(l.unitPrice)}</td><td class="num">${N(l.total)}</td></tr>`).join('')}</tbody></table></div>
      <div style="margin:12px 0">
        <div class="sum-row"><span>${o.pricing === 'wholesale' ? 'Wholesale subtotal' : 'Subtotal'}</span><span>${N(o.subtotal)}</span></div>
        ${o.savings ? `<div class="sum-row save"><span>Customer saved</span><span>${N(o.savings)}</span></div>` : ''}
        <div class="sum-row"><span>Delivery</span><span>${N(o.deliveryFee)}</span></div>
        <div class="sum-row total"><span>Paid</span><span>${N(o.total)}</span></div>
      </div>
      <div class="field"><label for="ostatus">Status</label><select id="ostatus">${STATUSES.map((s) => `<option ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn" id="osave">Save status</button>
        <a class="btn tape" target="_blank" rel="noopener" href="https://wa.me/${esc(wa)}?text=${encodeURIComponent('Hello ' + o.customer.name + ', this is Chidex about your order ' + o.id + '.')}">WhatsApp customer</a>
        <button class="btn ghost" onclick="window.print()">Print</button>
        <button class="btn ghost" data-close>Close</button>
      </div>`, true);
    $('#osave').addEventListener('click', () => { S.updateOrder(o.id, { status: $('#ostatus').value }); closeModal(); toast('Order updated'); render(); });
  }

  /* ---------- products ---------- */
  function products() {
    let list = S.getProducts();
    if (filters.cat) list = list.filter((p) => p.category === filters.cat);
    if (filters.q) { const q = filters.q.toLowerCase(); list = list.filter((p) => (p.id + ' ' + p.name).toLowerCase().includes(q)); }
    $('#pane').innerHTML = `
      <div class="bar">
        <input type="search" id="pq" placeholder="Search name or code" value="${esc(filters.q)}">
        <select id="pc"><option value="">All categories</option>${S.categories.map((c) => `<option value="${c.id}" ${filters.cat === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
        <button class="btn" id="padd">+ Add product</button>
        <button class="btn ghost" id="pimport">Import CSV</button>
        <button class="btn ghost" id="pexport">Export CSV</button>
        <input type="file" id="pfile" accept=".csv,text/csv" hidden>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th></th><th>Product</th><th>Category</th><th>Unit</th><th>Retail</th><th>Wholesale</th><th>Stock</th><th></th></tr></thead>
        <tbody>${list.map((p) => `<tr>
          <td><div class="line-img" style="width:42px;height:42px;background:${I.tint(p.category)}">${p.image ? `<img src="${esc(p.image)}" alt="">` : I.get(p.category)}</div></td>
          <td><b>${esc(p.name)}</b>${p.featured ? ' <span class="wchip">Featured</span>' : ''}<br><span class="note">${esc(p.id)}</span></td>
          <td>${esc(catName(p.category))}</td><td>${esc(p.unit)}</td>
          <td class="num">${N(p.retail)}</td><td class="num">${N(p.wholesale)}</td>
          <td class="num" style="${Number(p.stock) < 20 ? 'color:var(--thread);font-weight:700' : ''}">${Number(p.stock) || 0}</td>
          <td><div class="row-actions"><button class="btn small ghost" data-edit="${esc(p.id)}">Edit</button><button class="btn small ghost" data-del="${esc(p.id)}" style="color:var(--thread);border-color:var(--thread)">Delete</button></div></td>
        </tr>`).join('')}</tbody></table></div>
      <p class="note" style="margin-top:10px">CSV columns: id, name, category, unit, retail, wholesale, stock, featured, description, image. Category must be one of: ${S.categories.map((c) => c.id).join(', ')}. Rows with an existing id are updated; new ids are added.</p>`;
    $('#pq').addEventListener('input', (e) => { filters.q = e.target.value; products(); $('#pq').focus(); $('#pq').setSelectionRange(99, 99); });
    $('#pc').addEventListener('change', (e) => { filters.cat = e.target.value; products(); });
    $('#padd').addEventListener('click', () => productModal());
    $('#pexport').addEventListener('click', exportCSV);
    $('#pimport').addEventListener('click', () => $('#pfile').click());
    $('#pfile').addEventListener('change', importCSV);
    $('#pane').querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => productModal(S.getProduct(b.dataset.edit))));
    $('#pane').querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => {
      const p = S.getProduct(b.dataset.del);
      if (confirm('Delete "' + p.name + '"?')) { S.deleteProduct(p.id); toast('Product deleted'); render(); }
    }));
  }

  function productModal(p) {
    const isNew = !p;
    p = p || { id: '', name: '', category: S.categories[0].id, unit: 'per piece', retail: '', wholesale: '', stock: '', desc: '', featured: false, image: '' };
    modal(`
      <h3>${isNew ? 'Add product' : 'Edit product'}</h3>
      <form id="pform">
        <div class="field"><label>Name</label><input name="name" required value="${esc(p.name)}"></div>
        <div class="two">
          <div class="field"><label>Category</label><select name="category">${S.categories.map((c) => `<option value="${c.id}" ${p.category === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
          <div class="field"><label>Sold</label><input name="unit" required value="${esc(p.unit)}" placeholder="per yard, per dozen…"></div>
          <div class="field"><label>Retail price (₦)</label><input name="retail" type="number" min="0" required value="${esc(p.retail)}"></div>
          <div class="field"><label>Wholesale price (₦)</label><input name="wholesale" type="number" min="0" required value="${esc(p.wholesale)}"></div>
          <div class="field"><label>Stock quantity</label><input name="stock" type="number" min="0" required value="${esc(p.stock)}"></div>
          <div class="field"><label>Product code</label><input name="id" value="${esc(p.id)}" placeholder="auto" ${isNew ? '' : 'readonly'}></div>
        </div>
        <div class="field"><label>Description</label><textarea name="desc">${esc(p.desc)}</textarea></div>
        <div class="field"><label>Photo</label><input type="file" id="pimg" accept="image/*"><input name="image" placeholder="…or paste an image link" value="${esc(p.image && !p.image.startsWith('data:') ? p.image : '')}" style="margin-top:6px">
          <span class="hint">${p.image ? 'A photo is set. Upload a new one to replace it.' : 'No photo yet, an illustration is shown.'}</span></div>
        <label style="display:flex;gap:8px;align-items:center;margin-bottom:14px;font-weight:600"><input type="checkbox" name="featured" ${p.featured ? 'checked' : ''}> Show on home page (featured)</label>
        <p class="error" id="perr" hidden></p>
        <div style="display:flex;gap:8px"><button class="btn">Save</button><button type="button" class="btn ghost" data-close>Cancel</button></div>
      </form>`, true);
    let uploaded = p.image && p.image.startsWith('data:') ? p.image : '';
    $('#pimg').addEventListener('change', (e) => {
      const f = e.target.files[0];
      if (!f) return;
      resizeImage(f, 700).then((d) => { uploaded = d; toast('Photo ready'); });
    });
    $('#pform').addEventListener('submit', (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.target).entries());
      const retail = Number(d.retail), wholesale = Number(d.wholesale);
      if (wholesale > retail) { $('#perr').textContent = 'Wholesale price should not be higher than retail.'; $('#perr').hidden = false; return; }
      if (isNew && d.id && S.getProduct(d.id.trim())) { $('#perr').textContent = 'That product code already exists.'; $('#perr').hidden = false; return; }
      S.upsertProduct({
        id: (d.id || '').trim(), name: d.name.trim(), category: d.category, unit: d.unit.trim(),
        retail, wholesale, stock: Number(d.stock) || 0, desc: d.desc.trim(), featured: !!d.featured,
        image: uploaded || d.image.trim(),
      });
      closeModal(); toast('Product saved'); render();
    });
  }

  function resizeImage(file, max) {
    return new Promise((res) => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.82));
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
    });
  }

  const COLS = ['id', 'name', 'category', 'unit', 'retail', 'wholesale', 'stock', 'featured', 'description', 'image'];
  function exportCSV() {
    const q = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const rows = [COLS.join(',')].concat(S.getProducts().map((p) =>
      [p.id, p.name, p.category, p.unit, p.retail, p.wholesale, p.stock, p.featured ? 'yes' : 'no', p.desc, p.image && p.image.startsWith('data:') ? '' : p.image].map(q).join(',')));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' }));
    a.download = 'chidex-products.csv';
    a.click();
  }
  function parseCSV(text) {
    const rows = []; let row = [], cur = '', inQ = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQ) {
        if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') inQ = false;
        else cur += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === ',') { row.push(cur); cur = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
      else cur += ch;
    }
    if (cur || row.length) { row.push(cur); rows.push(row); }
    return rows.filter((r) => r.some((c) => c.trim()));
  }
  function importCSV(e) {
    const f = e.target.files[0];
    if (!f) return;
    f.text().then((text) => {
      const rows = parseCSV(text);
      const head = rows.shift().map((h) => h.trim().toLowerCase());
      const idx = (k) => head.indexOf(k);
      if (idx('name') < 0 || idx('retail') < 0 || idx('wholesale') < 0) return alert('CSV needs at least: name, retail, wholesale columns.');
      const valid = S.categories.map((c) => c.id);
      const list = S.getProducts().slice();
      let added = 0, updated = 0, skipped = 0;
      rows.forEach((r) => {
        const g = (k) => (idx(k) >= 0 ? (r[idx(k)] || '').trim() : '');
        const name = g('name'), retail = Number(g('retail').replace(/[₦,\s]/g, '')), wholesale = Number(g('wholesale').replace(/[₦,\s]/g, ''));
        if (!name || !retail || !wholesale) { skipped++; return; }
        const cat = valid.includes(g('category').toLowerCase()) ? g('category').toLowerCase() : 'tools';
        const id = g('id') || 'CHX' + Math.random().toString(36).slice(2, 8).toUpperCase();
        const prev = list.find((p) => p.id === id);
        const p = { id, name, category: cat, unit: g('unit') || 'per piece', retail, wholesale,
          stock: Number(g('stock')) || 0, featured: /^(yes|true|1)$/i.test(g('featured')),
          desc: g('description'), image: g('image') || (prev ? prev.image : '') };
        if (prev) { Object.assign(prev, p); updated++; } else { list.push(p); added++; }
      });
      S.saveProducts(list);
      toast(`${added} added, ${updated} updated${skipped ? ', ' + skipped + ' skipped' : ''}`);
      render();
    });
  }

  /* ---------- settings ---------- */
  function settings() {
    const s = S.getSettings();
    $('#pane').innerHTML = `
      <form id="sform">
        <div class="panel">
          <h2>Wholesale & payment</h2>
          <div class="two">
            <div class="field"><label>Wholesale threshold (₦, retail value)</label><input name="threshold" type="number" min="0" value="${esc(s.threshold)}"></div>
            <div class="field"><label>Paystack public key</label><input name="paystackPublicKey" value="${esc(s.paystackPublicKey)}" placeholder="pk_live_…  (empty = demo payments)"><span class="hint">Public key only. Never put the secret key here.</span></div>
          </div>
        </div>
        <div class="panel">
          <h2>Store details</h2>
          <div class="two">
            <div class="field"><label>Phone</label><input name="phone" value="${esc(s.phone)}"></div>
            <div class="field"><label>WhatsApp number (international, digits only)</label><input name="whatsapp" value="${esc(s.whatsapp)}" placeholder="2348012345678"></div>
            <div class="field"><label>Email</label><input name="email" value="${esc(s.email)}"></div>
            <div class="field"><label>Opening hours</label><input name="hours" value="${esc(s.hours)}"></div>
          </div>
          <div class="field"><label>Store address</label><input name="address" value="${esc(s.address)}"></div>
          <div class="field"><label>Pickup instructions</label><input name="pickupNote" value="${esc(s.pickupNote)}"></div>
          <div class="field"><label>About Chidex (shown on the About page)</label><textarea name="about" rows="5">${esc(s.about)}</textarea></div>
        </div>
        <div class="panel">
          <h2>Delivery towns (Kogi State)</h2>
          <div class="field"><label>One town per line: Town, fee</label><textarea name="zones" rows="10">${s.deliveryZones.map((z) => z.name + ', ' + z.fee).join('\n')}</textarea></div>
        </div>
        <div class="panel">
          <h2>Security</h2>
          <div class="field"><label>Admin PIN</label><input name="adminPin" value="${esc(s.adminPin)}"></div>
          <p class="note">This PIN is a placeholder for the demo. The live site needs proper staff accounts on a server.</p>
        </div>
        <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">
          <button class="btn tape">Save settings</button>
          <button type="button" class="btn ghost" id="reset-products">Reset demo products</button>
        </div>
      </form>`;
    $('#sform').addEventListener('submit', (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.target).entries());
      const zones = d.zones.split('\n').map((l) => l.split(',')).filter((a) => a[0].trim())
        .map((a) => ({ name: a[0].trim(), fee: Number((a[1] || '0').replace(/[₦,\s]/g, '')) || 0 }));
      delete d.zones;
      S.saveSettings(Object.assign({}, s, d, { threshold: Number(d.threshold) || 0, whatsapp: d.whatsapp.replace(/\D/g, ''), deliveryZones: zones }));
      toast('Settings saved');
    });
    $('#reset-products').addEventListener('click', () => { if (confirm('Replace all products with the demo list?')) { S.resetProducts(); toast('Demo products restored'); render(); } });
  }

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  render();
})();
