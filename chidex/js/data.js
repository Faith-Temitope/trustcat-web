/* Chidex data layer.
 * Everything the storefront and admin read/write goes through ChidexStore.
 * Right now it saves to the browser (localStorage) so the site works with no server.
 * To go live, swap these functions for calls to a real backend (e.g. Supabase) —
 * nothing else in the app needs to change.
 */
(function () {
  const PREFIX = 'chidex:';

  const DEFAULT_SETTINGS = {
    storeName: 'Chidex',
    tagline: 'Sewing materials, retail & wholesale',
    threshold: 100000,
    paystackPublicKey: '', // pk_live_... or pk_test_... — empty = demo payment
    phone: '+234 800 000 0000',
    whatsapp: '2348000000000',
    email: 'orders@chidex.ng',
    address: 'Chidex Sewing Materials, Lokoja, Kogi State',
    hours: 'Mon – Sat, 8:00am – 6:00pm',
    pickupNote: 'Bring your order number. We will call you when it is packed.',
    about:
      'Chidex has supplied tailors, fashion designers and resellers across Kogi State with threads, zips, linings, laces and everything in between. Our new large store means more stock, better wholesale prices, and now you can order from your phone and we will have it ready.',
    adminPin: '2468',
    deliveryZones: [
      { name: 'Lokoja', fee: 2000 },
      { name: 'Koton Karfe', fee: 3500 },
      { name: 'Ajaokuta', fee: 4000 },
      { name: 'Obajana', fee: 3500 },
      { name: 'Okene', fee: 4500 },
      { name: 'Kabba', fee: 4500 },
      { name: 'Isanlu', fee: 5000 },
      { name: 'Egbe', fee: 5500 },
      { name: 'Anyigba', fee: 5000 },
      { name: 'Ankpa', fee: 6000 },
      { name: 'Dekina', fee: 5500 },
      { name: 'Idah', fee: 6000 },
    ],
  };

  const CATEGORIES = [
    { id: 'threads', name: 'Threads', blurb: 'Polyester, cotton, embroidery cones' },
    { id: 'zips', name: 'Zips', blurb: 'Invisible, metal, nylon, jacket' },
    { id: 'buttons', name: 'Buttons & Fasteners', blurb: 'Buttons, hooks, press studs' },
    { id: 'linings', name: 'Linings & Interfacing', blurb: 'Aba lining, fusing, buckram' },
    { id: 'lace', name: 'Lace & Trimmings', blurb: 'Lace trims, ribbons, piping' },
    { id: 'stones', name: 'Stones & Beads', blurb: 'Crystals, pearls, appliqués' },
    { id: 'elastic', name: 'Elastic & Tapes', blurb: 'Waistband, bra, bias tape' },
    { id: 'needles', name: 'Needles & Pins', blurb: 'Machine, hand, pins' },
    { id: 'tools', name: 'Tools', blurb: 'Scissors, tapes, chalk, rippers' },
    { id: 'machine', name: 'Machine Parts', blurb: 'Feet, bobbins, oil, belts' },
    { id: 'fabric', name: 'Fabrics', blurb: 'Mikado, crepe, chiffon, cotton' },
  ];

  let n = 0;
  const P = (category, name, unit, retail, wholesale, stock, desc, featured) => ({
    id: 'CHX' + String(++n).padStart(4, '0'),
    category, name, unit, retail, wholesale, stock, desc: desc || '', featured: !!featured, image: '',
  });

  const SEED_PRODUCTS = [
    P('threads', 'Polyester Sewing Thread 40/2 (Assorted Colours)', 'per dozen', 2400, 1900, 400, 'All-purpose spun polyester. Strong, low-lint, perfect for everyday garment sewing.', true),
    P('threads', 'Industrial Thread Cone 5000m', 'per cone', 1500, 1150, 320, 'Large cone for industrial machines. Ask for colour on checkout notes.'),
    P('threads', 'Overlock Thread Cone (Set of 4)', 'per set', 4800, 3900, 120, 'Matching set for 4-thread overlockers.'),
    P('threads', 'Embroidery Rayon Thread', 'per cone', 1800, 1400, 200, 'High-sheen rayon for machine embroidery.'),
    P('threads', 'Button Hole Thread (Gimp)', 'per roll', 900, 700, 150),
    P('zips', 'Invisible Zip 22"', 'per dozen', 3000, 2300, 500, 'Concealed zips for gowns and skirts. Mixed or single colour.', true),
    P('zips', 'Nylon Zip 9"', 'per dozen', 1500, 1100, 600),
    P('zips', 'Metal Jeans Zip 7"', 'per dozen', 2800, 2200, 240),
    P('zips', 'Open-End Jacket Zip 24"', 'per piece', 900, 650, 180),
    P('zips', 'Long Zip Roll + Sliders (Coil #5)', 'per 100 yards', 12500, 9800, 40, 'Cut your own lengths. Sliders included.'),
    P('buttons', 'Shirt Buttons 4-Hole (Gross)', 'per gross (144)', 1800, 1300, 300, 'Classic white and black shirt buttons.'),
    P('buttons', 'Gold Metal Shank Buttons', 'per dozen', 2500, 1900, 160, '', true),
    P('buttons', 'Hook & Eye (Trouser)', 'per gross', 2200, 1650, 200),
    P('buttons', 'Press Studs / Snap Buttons', 'per gross', 2600, 2000, 180),
    P('buttons', 'Agbada Buttons (Assorted)', 'per dozen', 3200, 2500, 90),
    P('linings', 'Aba Lining', 'per yard', 700, 520, 1500, 'Smooth, breathable lining for gowns and natives.', true),
    P('linings', 'Fusing / Iron-on Interfacing', 'per yard', 600, 450, 1200),
    P('linings', 'Buckram (Cap & Collar)', 'per yard', 900, 700, 400),
    P('linings', 'Satin Lining', 'per yard', 1100, 850, 700),
    P('linings', 'Silk Organza Underlay', 'per yard', 1800, 1400, 300),
    P('lace', 'Beaded Lace Trim', 'per yard', 2500, 1900, 250, 'Delicate beaded edging for bridal and asoebi.', true),
    P('lace', 'Satin Ribbon 1" (Roll)', 'per roll', 1600, 1200, 220),
    P('lace', 'Piping Cord', 'per 50 yards', 3500, 2700, 100),
    P('lace', 'Embroidered Applique Patches', 'per pack of 10', 4500, 3500, 80),
    P('stones', 'Crystal Rhinestones SS16 (Gross)', 'per gross', 1500, 1100, 600, 'Hotfix stones for owambe sparkle.', true),
    P('stones', 'Pearl Beads 8mm', 'per pack', 1800, 1350, 300),
    P('stones', 'Sew-on Stones (Assorted)', 'per pack', 2500, 1900, 200),
    P('stones', 'Stone Glue (E6000 type)', 'per tube', 2800, 2200, 150),
    P('elastic', 'Waistband Elastic 1.5"', 'per 10 yards', 2500, 1900, 300, '', true),
    P('elastic', 'Bra Elastic / Strap', 'per 10 yards', 1800, 1350, 200),
    P('elastic', 'Bias Binding Tape', 'per roll', 1400, 1050, 250),
    P('elastic', 'Twill Tape 1"', 'per roll', 2000, 1500, 120),
    P('needles', 'Machine Needles DBx1 (Pack of 10)', 'per pack', 1200, 900, 500, 'For industrial straight-stitch machines.', true),
    P('needles', 'Domestic Machine Needles HAx1', 'per pack', 1500, 1150, 300),
    P('needles', 'Hand Sewing Needles (Assorted)', 'per pack', 500, 350, 400),
    P('needles', 'Dressmaker Pins (Box)', 'per box', 1200, 900, 250),
    P('tools', 'Tailoring Scissors 10"', 'per piece', 6500, 5200, 80, 'Sharp steel shears that last for years.', true),
    P('tools', 'Measuring Tape 60"', 'per dozen', 2400, 1800, 200),
    P('tools', 'Tailor’s Chalk (Box of 10)', 'per box', 1200, 900, 300),
    P('tools', 'Seam Ripper', 'per dozen', 2400, 1800, 150),
    P('tools', 'Thread Snips', 'per dozen', 3600, 2700, 100),
    P('machine', 'Industrial Bobbins (Pack of 10)', 'per pack', 1500, 1100, 300),
    P('machine', 'Bobbin Case (Industrial)', 'per piece', 1800, 1350, 120),
    P('machine', 'Presser Foot Set (11 pcs)', 'per set', 5500, 4300, 60),
    P('machine', 'Sewing Machine Oil', 'per bottle', 1200, 900, 200),
    P('machine', 'Motor / Treadle Belt', 'per piece', 1500, 1100, 120),
    P('fabric', 'Mikado Fabric', 'per yard', 3500, 2800, 300, 'Structured sheen for gowns and peplums.', true),
    P('fabric', 'Dull Face Satin', 'per yard', 2500, 1950, 400),
    P('fabric', 'Chiffon', 'per yard', 1500, 1150, 500),
    P('fabric', 'Crepe', 'per yard', 2200, 1700, 450),
    P('fabric', 'Plain Cotton (Shirting)', 'per yard', 1800, 1400, 500),
    P('fabric', 'Tulle / Net', 'per yard', 1000, 750, 600),
  ];

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (e) { /* storage blocked */ }
  }

  const memory = {};
  function cached(key, seed) {
    if (!(key in memory)) memory[key] = read(key, null) ?? JSON.parse(JSON.stringify(seed));
    return memory[key];
  }

  const ChidexStore = {
    categories: CATEGORIES,
    defaults: DEFAULT_SETTINGS,

    getSettings() { return Object.assign({}, DEFAULT_SETTINGS, cached('settings', DEFAULT_SETTINGS)); },
    saveSettings(s) { memory.settings = s; write('settings', s); },

    getProducts() { return cached('products', SEED_PRODUCTS); },
    getProduct(id) { return this.getProducts().find((p) => p.id === id); },
    saveProducts(list) { memory.products = list; write('products', list); },
    upsertProduct(p) {
      const list = this.getProducts().slice();
      if (!p.id) p.id = 'CHX' + Date.now().toString(36).toUpperCase();
      const i = list.findIndex((x) => x.id === p.id);
      if (i >= 0) list[i] = p; else list.unshift(p);
      this.saveProducts(list);
      return p;
    },
    deleteProduct(id) { this.saveProducts(this.getProducts().filter((p) => p.id !== id)); },
    resetProducts() { this.saveProducts(JSON.parse(JSON.stringify(SEED_PRODUCTS))); },

    getCart() { return cached('cart', []); },
    saveCart(c) { memory.cart = c; write('cart', c); },

    getOrders() { return cached('orders', []); },
    getOrder(id) { return this.getOrders().find((o) => o.id === id); },
    addOrder(o) {
      const list = [o].concat(this.getOrders());
      memory.orders = list; write('orders', list);
      // reduce stock
      const prods = this.getProducts().slice();
      o.lines.forEach((l) => {
        const p = prods.find((x) => x.id === l.id);
        if (p) p.stock = Math.max(0, (Number(p.stock) || 0) - l.qty);
      });
      this.saveProducts(prods);
    },
    updateOrder(id, patch) {
      const list = this.getOrders().map((o) => (o.id === id ? Object.assign({}, o, patch) : o));
      memory.orders = list; write('orders', list);
    },
  };

  /* Pricing rule: if the RETAIL subtotal reaches the threshold,
     every line is charged at its wholesale price. Delivery is added on top. */
  ChidexStore.priceCart = function (cart) {
    const settings = this.getSettings();
    const lines = cart
      .map((item) => {
        const p = this.getProduct(item.id);
        return p ? { id: p.id, product: p, qty: item.qty } : null;
      })
      .filter(Boolean);
    const retailSubtotal = lines.reduce((s, l) => s + l.product.retail * l.qty, 0);
    const wholesaleSubtotal = lines.reduce((s, l) => s + l.product.wholesale * l.qty, 0);
    const threshold = Number(settings.threshold) || 0;
    const isWholesale = retailSubtotal >= threshold && lines.length > 0;
    lines.forEach((l) => {
      l.unitPrice = isWholesale ? l.product.wholesale : l.product.retail;
      l.total = l.unitPrice * l.qty;
    });
    return {
      lines,
      count: lines.reduce((s, l) => s + l.qty, 0),
      retailSubtotal,
      wholesaleSubtotal,
      isWholesale,
      subtotal: isWholesale ? wholesaleSubtotal : retailSubtotal,
      potentialSavings: retailSubtotal - wholesaleSubtotal,
      remaining: Math.max(0, threshold - retailSubtotal),
      progress: threshold ? Math.min(1, retailSubtotal / threshold) : 1,
      threshold,
    };
  };

  ChidexStore.naira = (v) => '₦' + Math.round(Number(v) || 0).toLocaleString('en-NG');

  window.ChidexStore = ChidexStore;
})();
