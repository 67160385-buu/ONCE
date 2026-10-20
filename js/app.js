/**
 * ONCE — 1-of-1 Curated Thrift & Archive Apparel
 * Frontend Application Logic (app.js)
 * Fully connected to REST API via api.js + Resilient Local Fallback
 */

// Global State
let db = {
  settings: { shippingFee: 50, freeShippingMin: 1500, promptpayNumber: '089-987-6543', promptpayName: 'ONCE ARCHIVE & VINTAGE' },
  products: [],
  orders: [],
  messages: [],
  users: []
};

let me = null;
let cart = [];
let wishlist = [];
let view = 'shop';
let detailId = null;
let activeDetailImg = '';
let q = '';
let cat = 'ทั้งหมด';
let sz = 'ทั้งหมด';
let brand = 'ทั้งหมด';
let minPrice = '';
let maxPrice = '';
let sortBy = 'newest';
let showOnlyAvail = false;
let showOnlyWishlist = false;
let tab = 'dash';
let edit = null;
let editPhoto = '';
let editExtraPhotos = [];
let reg = false;
let payMethod = 'promptpay';
let uploadedSlip = null;
let lastSeenOrderStatus = {};

// Helper DOM & Utilities
const $ = id => document.getElementById(id);
const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const baht = n => '฿' + Number(n || 0).toLocaleString();

// Fallback Silhouette Illustration (when item has no photo)
const img = p => {
  if (p && p.image) return p.image;
  const isJacket = (p.category || '').includes('แจ็คเก็ต');
  const isHoodie = (p.category || '').includes('ฮู้ดดี้');
  const color = p.color || '#2b2b2b';

  let garmentPath = '';
  if (isHoodie) {
    garmentPath = `
      <path d="M75 55 Q100 25 125 55 Q100 70 75 55 Z" fill="${color}" opacity="0.88"/>
      <path d="M68 62 L42 95 L58 108 L72 88 L72 165 L128 165 L128 88 L142 108 L158 95 L132 62 Z" fill="${color}"/>
      <path d="M82 125 L118 125 L114 152 L86 152 Z" fill="${color}" stroke="#141414" stroke-width="1.5" opacity="0.7"/>
      <line x1="94" y1="65" x2="94" y2="90" stroke="#f4f3ef" stroke-width="1.8"/>
      <line x1="106" y1="65" x2="106" y2="90" stroke="#f4f3ef" stroke-width="1.8"/>
    `;
  } else if (isJacket) {
    garmentPath = `
      <path d="M65 60 L38 95 L54 108 L70 86 L70 166 L130 166 L130 86 L146 108 L162 95 L135 60 Z" fill="${color}"/>
      <polygon points="65,60 85,75 100,64 115,75 135,60 100,50" fill="#141414" opacity="0.88"/>
      <line x1="100" y1="64" x2="100" y2="166" stroke="#141414" stroke-width="1.8"/>
      <rect x="76" y="90" width="18" height="18" fill="none" stroke="#141414" stroke-width="1.5" rx="2"/>
      <rect x="106" y="90" width="18" height="18" fill="none" stroke="#141414" stroke-width="1.5" rx="2"/>
    `;
  } else {
    garmentPath = `
      <path d="M70 55 L38 82 L54 96 L70 82 L70 165 L130 165 L130 82 L146 96 L162 82 L130 55 Z" fill="${color}"/>
      <path d="M85 55 Q100 66 115 55" fill="none" stroke="#141414" stroke-width="2.5"/>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="#f0eee8"/>
    <circle cx="100" cy="105" r="75" fill="#e5e2d8" opacity="0.45"/>
    <g stroke="#141414" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">
      ${garmentPath}
    </g>
    <text x="100" y="185" font-family="'Space Grotesk', sans-serif" font-weight="700" font-size="9" letter-spacing="2" text-anchor="middle" fill="#737068">${esc(p.brand).toUpperCase()}</text>
    <text x="100" y="22" font-family="'Space Grotesk', sans-serif" font-weight="700" font-size="8" letter-spacing="1.5" text-anchor="middle" fill="#99958d">ONCE • 1 OF 1</text>
  </svg>`;

  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
};

const getProductImg = p => (p && p.image) ? p.image : img(p);

function toast(m) {
  const t = $('toast');
  if (!t) return;
  t.textContent = m;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2600);
}

function go(v, id = null) {
  view = v;
  detailId = id;
  edit = null;
  editPhoto = '';
  editExtraPhotos = [];
  render();
}

function toggleCart() {
  const drawer = $('drawer');
  if (drawer) drawer.classList.toggle('open');
  renderCart();
}

// Local Session Load & Save
function loadLocalSessions() {
  try {
    const u = localStorage.getItem('once_user_session');
    if (u) me = JSON.parse(u);
    const c = localStorage.getItem('once_cart');
    if (c) cart = JSON.parse(c);
    const w = localStorage.getItem('once_wishlist');
    if (w) wishlist = JSON.parse(w);
    const s = localStorage.getItem('once_last_status');
    if (s) lastSeenOrderStatus = JSON.parse(s);
  } catch (e) {}
}

function saveLocalSessions() {
  try {
    localStorage.setItem('once_user_session', me ? JSON.stringify(me) : '');
    localStorage.setItem('once_cart', JSON.stringify(cart));
    localStorage.setItem('once_wishlist', JSON.stringify(wishlist));
    localStorage.setItem('once_last_status', JSON.stringify(lastSeenOrderStatus));
  } catch (e) {}
}

// Initialize Application Data from API
async function initApp() {
  loadLocalSessions();
  try {
    const [settings, prods, msgs] = await Promise.all([
      window.api.getSettings().catch(() => null),
      window.api.getProducts().catch(() => null),
      window.api.getMessages().catch(() => null)
    ]);

    if (settings) db.settings = settings;
    if (prods) db.products = prods;
    if (msgs) db.messages = msgs;

    if (me) {
      const orders = await window.api.getOrders(me.id, me.role).catch(() => []);
      db.orders = orders || [];
    }
  } catch (err) {
    console.warn('API init error:', err);
  }

  render();
  startChatPolling();
  startHoldTimer();
}

// Top Navbar
function nav() {
  const b = (v, t, badge = '') => `<button class="${view === v ? 'on' : ''}" onclick="go('${v}')">${t}${badge ? ` <span class="chat-badge">${badge}</span>` : ''}</button>`;
  
  // Calculate unread status changes for customer
  let orderBadge = '';
  if (me && me.role === 'customer' && db.orders) {
    const unreadStatusCount = db.orders.filter(o => o.status !== (lastSeenOrderStatus[o.id] || o.status)).length;
    if (unreadStatusCount > 0) orderBadge = String(unreadStatusCount);
  }

  $('nav').innerHTML = 
    b('shop', 'คอลเลกชัน') +
    (me && me.role === 'customer' ? b('history', 'ประวัติสั่งซื้อ', orderBadge) : '') +
    (me && me.role === 'admin' ? b('admin', 'จัดการร้าน (Admin)') : '') +
    (me ? `<button onclick="logout()">ออกจากระบบ (${esc(me.name)})</button>` : b('auth', 'เข้าสู่ระบบ'));
}

function logout() {
  me = null;
  saveLocalSessions();
  go('shop');
}

function render() {
  nav();
  $('cc').textContent = cart.length;
  updateChatBadge();
  ({ shop, detail, auth, checkout, history, admin }[view] || shop)();
}

/* ========================================================
   PHASE 2 & 3: SHOP, WISHLIST & ADVANCED FILTERS
   ======================================================== */
async function shop() {
  const categories = ['ทั้งหมด', 'เสื้อยืด', 'แจ็คเก็ต', 'ฮู้ดดี้', 'กางเกง'];
  const sizes = ['ทั้งหมด', 'S', 'M', 'L', 'XL'];
  const brands = ['ทั้งหมด', 'Carhartt', 'Nike', 'Champion', 'Stüssy', "Levi's", 'Adidas', 'Harley Davidson', 'Ralph Lauren'];

  $('app').innerHTML = `
    <div class="hero-once">
      <div class="hero-tag">● 1-OF-1 ARCHIVE</div>
      <h1>ONCE</h1>
      <div style="font-family:var(--font-head);font-size:22px;font-weight:700;letter-spacing:-0.01em;color:var(--fg);margin:-4px 0 8px">Worn by me, found by you.</div>
      <p style="font-size:15px;margin:0 0 18px;color:var(--mut)">ของในตู้ที่อยากให้ได้ไปอยู่กับคนใหม่</p>
      <div class="hero-pills">
        <span class="pill-badge">✦ FROM MY CLOSET</span>
        <span class="pill-badge">⚡ SECOND ROUND</span>
        <span class="pill-badge">✧ NO TWO STORIES ALIKE</span>
      </div>
    </div>

    <!-- Primary Filters -->
    <div class="bar">
      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input id="s" placeholder="ค้นหาชิ้นงาน หรือ แบรนด์ (เช่น Carhartt, Nike, Stüssy)…" value="${esc(q)}" oninput="q=this.value;applyShopFilters()">
      </div>
      ${categories.map(c => `<button class="chip ${cat === c ? 'on' : ''}" onclick="cat='${c}';applyShopFilters()">${c}</button>`).join('')}
      ${sizes.map(s => `<button class="chip ${sz === s ? 'on' : ''}" onclick="sz='${s}';applyShopFilters()">${s}</button>`).join('')}
      <button class="chip ${showOnlyWishlist ? 'on' : ''}" onclick="showOnlyWishlist=!showOnlyWishlist;applyShopFilters()">❤️ รายการโปรด (${wishlist.length})</button>
      <button class="chip ${showOnlyAvail ? 'on' : ''}" onclick="showOnlyAvail=!showOnlyAvail;applyShopFilters()">${showOnlyAvail ? '✓ เฉพาะพร้อมส่ง' : 'รวมที่ขายแล้ว'}</button>
    </div>

    <!-- Advanced Filters Bar (Price, Brand, Sort) -->
    <div class="filters-bar">
      <div style="display:flex;align-items:center;gap:6px">
        <span class="mut" style="font-size:12px;font-weight:700">แบรนด์:</span>
        <select class="sort-select" onchange="brand=this.value;applyShopFilters()">
          ${brands.map(b => `<option value="${b}" ${brand === b ? 'selected' : ''}>${b}</option>`).join('')}
        </select>
      </div>

      <div style="display:flex;align-items:center;gap:6px">
        <span class="mut" style="font-size:12px;font-weight:700">งบประมาณ:</span>
        <input id="f_min_price" type="number" placeholder="ต่ำสุด" value="${minPrice}" style="width:80px;padding:6px 10px;border-radius:999px;font-size:12px" onchange="minPrice=this.value;applyShopFilters()">
        <span class="mut">-</span>
        <input id="f_max_price" type="number" placeholder="สูงสุด" value="${maxPrice}" style="width:80px;padding:6px 10px;border-radius:999px;font-size:12px" onchange="maxPrice=this.value;applyShopFilters()">
      </div>

      <div style="display:flex;align-items:center;gap:6px;margin-left:auto">
        <span class="mut" style="font-size:12px;font-weight:700">เรียงตาม:</span>
        <select class="sort-select" onchange="sortBy=this.value;applyShopFilters()">
          <option value="newest" ${sortBy === 'newest' ? 'selected' : ''}>ชิ้นงานล่าสุด</option>
          <option value="price_asc" ${sortBy === 'price_asc' ? 'selected' : ''}>ราคา ต่ำ → สูง</option>
          <option value="price_desc" ${sortBy === 'price_desc' ? 'selected' : ''}>ราคา สูง → ต่ำ</option>
        </select>
      </div>
    </div>

    <div class="grid" id="g" style="margin-top:16px"></div>
  `;

  await applyShopFilters();
}

async function applyShopFilters() {
  try {
    const list = await window.api.getProducts({
      q,
      category: cat,
      size: sz,
      brand,
      minPrice,
      maxPrice,
      sort: sortBy,
      onlyAvail: showOnlyAvail
    });
    db.products = list;
    renderGrid(list);
  } catch (e) {
    // Local filter fallback
    let list = db.products.filter(p =>
      (sz === 'ทั้งหมด' || p.size === sz) &&
      (cat === 'ทั้งหมด' || p.category === cat) &&
      (brand === 'ทั้งหมด' || p.brand === brand) &&
      (!minPrice || p.price >= Number(minPrice)) &&
      (!maxPrice || p.price <= Number(maxPrice)) &&
      (!showOnlyAvail || !p.sold) &&
      (p.title + ' ' + p.brand + ' ' + p.category).toLowerCase().includes(q.toLowerCase())
    );
    if (sortBy === 'price_asc') list.sort((a,b) => a.price - b.price);
    else if (sortBy === 'price_desc') list.sort((a,b) => b.price - a.price);
    renderGrid(list);
  }
}

function renderGrid(list) {
  if (showOnlyWishlist) {
    list = list.filter(p => wishlist.includes(p.id));
  }

  const g = $('g');
  if (!g) return;

  g.innerHTML = list.length ? list.map(p => {
    const isWished = wishlist.includes(p.id);
    const holdText = p.isHeld ? '🔒 มีคนเลือกในกระเป๋า' : '';

    return `
      <div class="card ${p.sold ? 'sold-out' : ''}">
        <div class="card-img-wrap" onclick="go('detail', ${p.id})">
          <span class="badge-piece">1 OF 1</span>
          <span class="badge-status ${p.sold ? 'sold' : ''}">${p.sold ? 'SOLD' : (p.isHeld ? 'HELD' : 'AVAILABLE')}</span>
          <button class="btn-heart ${isWished ? 'active' : ''}" onclick="event.stopPropagation();toggleWishlist(${p.id})" title="${isWished ? 'นำออกจากสิ่งที่ชอบ' : 'บันทึกเป็นสิ่งที่ชอบ'}">
            ${isWished ? '❤️' : '🤍'}
          </button>
          <img src="${getProductImg(p)}" alt="${esc(p.title)}">
          ${p.sold ? `<div class="sold-overlay"><div class="sold-stamp">SOLD OUT • ขายแล้ว</div></div>` : ''}
          ${!p.sold && p.isHeld ? `<div class="sold-overlay" style="background:rgba(0,0,0,0.4)"><div class="sold-stamp" style="font-size:12px;border-color:#ffc53d;color:#ffc53d">🔒 ติดจองในตะกร้า 15 นาที</div></div>` : ''}
        </div>
        <div class="in">
          <div class="brand-meta">
            <span>${esc(p.brand)}</span>
            <span>SIZE ${esc(p.size)}</span>
          </div>
          <div class="card-title" onclick="go('detail', ${p.id})" style="cursor:pointer">${esc(p.title)}</div>
          <div class="card-sub">${esc(p.category)} • สภาพ ${esc(p.cond)}</div>
          <div class="card-action row">
            <span class="price">${baht(p.price)}</span>
            ${p.sold
              ? `<button disabled>จำหน่ายแล้ว (SOLD)</button>`
              : (p.isHeld
                  ? `<button disabled style="opacity:.65">🔒 มีผู้กำลังเลือก</button>`
                  : `<button class="pri" onclick="add(${p.id})">+ เก็บชิ้นนี้</button>`)}
          </div>
        </div>
      </div>
    `;
  }).join('') : '<p class="mut" style="padding:40px 0;text-align:center;grid-column:1/-1">ไม่พบชิ้นงานในเงื่อนไขที่คุณเลือก</p>';
}

function toggleWishlist(id) {
  if (wishlist.includes(id)) {
    wishlist = wishlist.filter(x => x !== id);
    toast('นำออกจากรายการโปรดแล้ว');
  } else {
    wishlist.push(id);
    toast('เพิ่มในรายการโปรด ❤️');
  }
  saveLocalSessions();
  render();
}

/* ========================================================
   PHASE 3: PRODUCT DETAIL PAGE (MEASUREMENTS, DEFECTS, GALLERY)
   ======================================================== */
async function detail() {
  let p = db.products.find(x => x.id === detailId);
  try {
    const fetched = await window.api.getProduct(detailId);
    if (fetched) p = fetched;
  } catch (e) {}

  if (!p) {
    $('app').innerHTML = '<div class="panel">ไม่พบข้อมูลชิ้นงานนี้ <br><button onclick="go(\'shop\')">← กลับไปหน้าร้าน</button></div>';
    return;
  }

  const gallery = [getProductImg(p), ...(p.images || [])].filter(Boolean);
  if (!activeDetailImg || !gallery.includes(activeDetailImg)) {
    activeDetailImg = gallery[0] || getProductImg(p);
  }

  const m = p.measurements || {};
  const isWished = wishlist.includes(p.id);

  $('app').innerHTML = `
    <div style="margin-bottom:12px">
      <button class="btn-sm" onclick="go('shop')">← ย้อนกลับไปคอลเลกชัน</button>
    </div>

    <div class="detail-grid">
      <!-- Gallery Column -->
      <div class="detail-gallery">
        <div style="position:relative">
          <img id="mainDetailImg" src="${activeDetailImg}" class="detail-main-img" alt="${esc(p.title)}">
          <button class="btn-heart ${isWished ? 'active' : ''}" style="top:16px;right:16px" onclick="toggleWishlist(${p.id})">
            ${isWished ? '❤️' : '🤍'}
          </button>
        </div>
        ${gallery.length > 1 ? `
          <div class="detail-thumbs">
            ${gallery.map(src => `
              <img src="${src}" class="detail-thumb ${activeDetailImg === src ? 'active' : ''}" onclick="activeDetailImg='${src}';$('mainDetailImg').src='${src}';document.querySelectorAll('.detail-thumb').forEach(el=>el.classList.remove('active'));this.classList.add('active')">
            `).join('')}
          </div>
        ` : ''}
      </div>

      <!-- Info Column -->
      <div>
        <div class="pill-badge" style="margin-bottom:8px">1-OF-1 ARCHIVE PIECE • UNIQUE</div>
        <div class="brand-meta" style="font-size:14px;margin-bottom:4px">
          <b>${esc(p.brand)}</b> • ไซส์ ${esc(p.size)} • หมวดหมู่: ${esc(p.category)}
        </div>
        <h1 style="font-size:28px;margin:4px 0 12px;line-height:1.25">${esc(p.title)}</h1>
        <div class="price" style="font-size:26px;margin-bottom:16px">${baht(p.price)}</div>

        <!-- Defect Disclosure -->
        <div class="defects-box">
          <b style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
            <span>🔍 รายละเอียดสภาพสินค้า &amp; ตำหนิที่ต้องแจ้ง:</span>
          </b>
          <div>${esc(p.defects || 'สภาพสวยสมบูรณ์ตามเกณฑ์วินเทจ ไม่มีรอยขาดหรือคราบฝังแน่น')}</div>
          <div class="mut" style="font-size:11.5px;margin-top:6px">สภาพประเมิน: <b>${esc(p.cond || '9/10 Vintage')}</b> (เสื้อผ้ามือสองผ่านการคัดสรรและทำความสะอาดแล้ว)</div>
        </div>

        <!-- Real Measurements Table -->
        <h4 style="margin:16px 0 6px">ตารางวัดขนาดจริงจากตัวเสื้อ (นิ้ว)</h4>
        <table class="measure-table">
          <tr><th>รอบอก (Chest)</th><td>${esc(m.chest || 'วัดตามสัดส่วนไซส์ ' + p.size)}</td></tr>
          <tr><th>ความยาวหลัง (Length)</th><td>${esc(m.length || '-')}</td></tr>
          <tr><th>ความกว้างไหล่ (Shoulder)</th><td>${esc(m.shoulder || '-')}</td></tr>
          <tr><th>ความยาวแขน (Sleeve)</th><td>${esc(m.sleeve || '-')}</td></tr>
        </table>

        <!-- Actions -->
        <div style="margin-top:24px;display:flex;gap:10px;flex-wrap:wrap">
          ${p.sold
            ? `<button class="pri" style="flex:1;padding:14px;font-size:15px;background:#777;border-color:#777" disabled>ชิ้นนี้ถูกจำหน่ายไปแล้ว (SOLD OUT)</button>`
            : (p.isHeld
                ? `<button class="pri" style="flex:1;padding:14px;font-size:15px;opacity:.65" disabled>🔒 มีลูกค้ากำลังเลือกในตะกร้า</button>`
                : `<button class="pri" style="flex:1;padding:14px;font-size:15px" onclick="add(${p.id})">+ เก็บชิ้นนี้ใส่กระเป๋า (${baht(p.price)})</button>`)}
          
          <button style="padding:14px 20px" onclick="inquireProduct('${esc(p.title)}')">💬 ถามร้านเกี่ยวกับชิ้นนี้</button>
        </div>
      </div>
    </div>
  `;
}

function inquireProduct(title) {
  toggleChat();
  const inp = $('chatInput');
  if (inp) {
    inp.value = `สวัสดีครับ สนใจชิ้นงาน "${title}" รบกวนสอบถามข้อมูลเพิ่มเติมหน่อยครับ`;
    inp.focus();
  }
}

/* ========================================================
   PHASE 2 & 3: 15-MINUTE CART HOLD & SHIPPING CALCULATION
   ======================================================== */
async function add(id) {
  const p = db.products.find(x => x.id === id);
  if (!p) return;
  if (p.sold) return toast('สินค้านี้ถูกจำหน่ายไปแล้ว');
  if (cart.find(x => x.id === id)) return toast('ชิ้นนี้อยู่ในกระเป๋าของคุณแล้ว');

  try {
    // Request server-side 15-minute Cart Hold
    const holdRes = await window.api.holdCartItem(id);
    const heldUntil = holdRes.heldUntil || (Date.now() + 15 * 60 * 1000);
    cart.push({ id, heldUntil });
    saveLocalSessions();
    toast('ล็อคสิทธิ์ชิ้นงานให้คุณ 15 นาทีแล้ว (1-of-1 Piece)');
    render();
    renderCart();
    $('drawer').classList.add('open');
  } catch (err) {
    toast(err.message || 'ไม่สามารถเก็บชิ้นนี้ได้ กำลังมีผู้จองในตะกร้า');
  }
}

async function delCartItem(id) {
  try {
    await window.api.releaseCartItem(id);
  } catch (e) {}
  cart = cart.filter(x => x.id !== id);
  saveLocalSessions();
  render();
  renderCart();
}

function subtotal() {
  return cart.reduce((a, c) => {
    const p = db.products.find(x => x.id === c.id);
    return a + (p ? p.price : 0);
  }, 0);
}

function calcShipping(sub) {
  const min = (db.settings && db.settings.freeShippingMin) || 1500;
  const fee = (db.settings && db.settings.shippingFee) || 50;
  return sub >= min ? 0 : fee;
}

function grandTotal() {
  const sub = subtotal();
  return sub + calcShipping(sub);
}

function startHoldTimer() {
  setInterval(() => {
    if (!cart.length) return;
    const now = Date.now();
    let expiredAny = false;
    cart = cart.filter(c => {
      if (c.heldUntil && c.heldUntil < now) {
        expiredAny = true;
        return false;
      }
      return true;
    });

    if (expiredAny) {
      saveLocalSessions();
      toast('หมดเวลาล็อคสิทธิ์ 15 นาที สินค้าถูกคืนสู่ร้าน');
      render();
      renderCart();
    } else {
      updateCartTimerDisplay();
    }
  }, 1000);
}

function updateCartTimerDisplay() {
  const el = $('holdCountdown');
  if (!el || !cart.length) return;
  const nearest = Math.min(...cart.map(c => c.heldUntil || (Date.now() + 15 * 60000)));
  const diff = Math.max(0, nearest - Date.now());
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  el.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function renderCart() {
  const sub = subtotal();
  const ship = calcShipping(sub);
  const tot = grandTotal();
  const freeMin = (db.settings && db.settings.freeShippingMin) || 1500;
  const remainForFree = Math.max(0, freeMin - sub);

  const cl = $('cl');
  if (!cl) return;

  cl.innerHTML = cart.length ? `
    <!-- Hold Countdown Banner -->
    <div class="cart-hold-banner">
      <span>⏳ ล็อคชิ้นงานให้คุณ:</span>
      <b id="holdCountdown" style="font-family:'Space Grotesk',monospace;font-size:14px">15:00</b>
      <span class="mut" style="font-size:11px;margin-left:auto">(15 นาที)</span>
    </div>

    <!-- Free Shipping Progress Indicator -->
    <div class="shipping-progress">
      <div class="row">
        <span>${remainForFree === 0 ? '🎉 ได้รับสิทธิ์จัดส่งฟรี!' : `ช้อปอีก <b>${baht(remainForFree)}</b> เพื่อรับสิทธิ์ส่งฟรี!`}</span>
        <b>${ship === 0 ? 'ฟรี' : baht(ship)}</b>
      </div>
      <div class="shipping-bar-bg">
        <div class="shipping-bar-fill" style="width:${Math.min(100, Math.round((sub / freeMin) * 100))}%"></div>
      </div>
    </div>

    ${cart.map(c => {
      const p = db.products.find(x => x.id === c.id);
      if (!p) return '';
      return `
        <div class="ci">
          <img src="${getProductImg(p)}" alt="">
          <div class="ci-info">
            <div class="ci-badge">${esc(p.brand)} • SIZE ${esc(p.size)} (1 OF 1)</div>
            <div class="ci-title">${esc(p.title)}</div>
            <div class="price" style="font-size:14.5px">${baht(p.price)}</div>
          </div>
          <button class="ci-del" onclick="delCartItem(${p.id})" title="นำออกจากกระเป๋า">✕ ลบ</button>
        </div>
      `;
    }).join('')}
  ` : '<div style="text-align:center;padding:40px 0" class="mut">กระเป๋าของคุณว่างเปล่า<br><span style="font-size:12px">เลือกชิ้นงาน 1-of-1 ที่คุณชื่นชอบได้เลย</span></div>';

  $('ct').innerHTML = `
    <div style="font-size:13px;font-weight:400;color:var(--mut)">ค่าสินค้า: ${baht(sub)} | ค่าส่ง: ${ship === 0 ? 'ฟรี' : baht(ship)}</div>
    <div>${baht(tot)}</div>
  `;
}

/* ========================================================
   AUTHENTICATION
   ======================================================== */
function auth() {
  $('app').innerHTML = `
    <div class="narrow panel">
      <h2 style="text-align:center">${reg ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}</h2>
      <div class="mut" style="text-align:center;margin-bottom:14px">ONCE — ARCHIVE &amp; VINTAGE APPAREL</div>
      ${reg ? '<input id="n" placeholder="ชื่อ-นามสกุล">' : ''}
      <input id="e" type="email" placeholder="อีเมล">
      <input id="p" type="password" placeholder="รหัสผ่าน">
      <button class="pri" style="width:100%;margin-top:6px" onclick="doAuth()">${reg ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}</button>
      <button style="width:100%" onclick="reg=!reg;auth()">${reg ? 'มีบัญชีแล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชี? สมัครสมาชิก'}</button>
      <p class="mut" style="text-align:center;font-size:12px;margin-top:12px">
        บัญชีทดสอบ: admin@shop.com (admin123) • user@shop.com (1234)
      </p>
    </div>
  `;
}

async function doAuth() {
  const e = $('e').value.trim(), p = $('p').value;
  if (!e || !p) return toast('กรอกข้อมูลให้ครบ');
  
  try {
    if (reg) {
      const n = $('n').value.trim();
      if (!n) return toast('กรอกชื่อ-นามสกุล');
      const res = await window.api.register({ name: n, email: e, password: p });
      me = res.user;
    } else {
      const res = await window.api.login(e, p);
      me = res.user;
    }
    saveLocalSessions();
    toast(`ยินดีต้อนรับคุณ ${me.name}!`);
    go(me.role === 'admin' ? 'admin' : 'shop');
  } catch (err) {
    toast(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
  }
}

/* ========================================================
   PAYMENT OPTIONS & HELPERS
   ======================================================== */
const PAY_METHODS = [
  { id: 'promptpay', name: 'พร้อมเพย์ QR', badge: 'สแกนจ่ายทันที', icon: '📱', desc: 'รองรับแอปธนาคารทุกแห่ง ยอดรวมค่าจัดส่งตรงตามระบบ' },
  { id: 'bank', name: 'โอนผ่านบัญชีธนาคาร', badge: 'ทุกธนาคาร', icon: '🏦', desc: 'KBank, SCB, KTB พร้อมปุ่มคัดลอกเลขบัญชีและแนบสลิป' },
  { id: 'card', name: 'บัตรเครดิต / เดบิต', badge: 'Visa / MC / JCB', icon: '💳', desc: 'ชำระตัดบัตรทันที ปลอดภัยมาตรฐาน SSL 256-bit' },
  { id: 'truemoney', name: 'TrueMoney Wallet', badge: 'e-Wallet', icon: '👛', desc: 'จ่ายผ่านเบอร์ทรูมันนี่ วอลเล็ท สะดวกรวดเร็ว' },
  { id: 'cod', name: 'เก็บเงินปลายทาง (COD)', badge: 'ชำระเมื่อรับของ', icon: '🚚', desc: 'จ่ายเงินสดหรือสแกนจ่ายกับพนักงานจัดส่งเมื่อพัสดุถึงบ้าน' }
];

function getPromptPaySvg(amt, ref) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" class="qr-svg">
    <rect width="240" height="240" fill="#ffffff" rx="10"/>
    <rect x="20" y="20" width="56" height="56" fill="#141414" rx="4"/>
    <rect x="28" y="28" width="40" height="40" fill="#ffffff" rx="2"/>
    <rect x="36" y="36" width="24" height="24" fill="#141414" rx="2"/>
    <rect x="164" y="20" width="56" height="56" fill="#141414" rx="4"/>
    <rect x="172" y="28" width="40" height="40" fill="#ffffff" rx="2"/>
    <rect x="180" y="36" width="24" height="24" fill="#141414" rx="2"/>
    <rect x="20" y="164" width="56" height="56" fill="#141414" rx="4"/>
    <rect x="28" y="172" width="40" height="40" fill="#ffffff" rx="2"/>
    <rect x="36" y="180" width="24" height="24" fill="#141414" rx="2"/>
    <g fill="#141414">
      <rect x="84" y="24" width="8" height="8"/><rect x="100" y="24" width="8" height="8"/><rect x="116" y="24" width="8" height="8"/><rect x="140" y="24" width="8" height="8"/>
      <rect x="92" y="36" width="8" height="8"/><rect x="108" y="36" width="8" height="8"/><rect x="132" y="36" width="8" height="8"/><rect x="148" y="36" width="8" height="8"/>
      <rect x="84" y="48" width="8" height="8"/><rect x="124" y="48" width="8" height="8"/><rect x="140" y="48" width="8" height="8"/>
      <rect x="92" y="60" width="8" height="8"/><rect x="108" y="60" width="8" height="8"/><rect x="132" y="60" width="8" height="8"/>
      <rect x="84" y="80" width="8" height="8"/><rect x="100" y="80" width="8" height="8"/><rect x="116" y="80" width="8" height="8"/><rect x="132" y="80" width="8" height="8"/><rect x="148" y="80" width="8" height="8"/>
      <rect x="24" y="84" width="8" height="8"/><rect x="40" y="84" width="8" height="8"/><rect x="56" y="84" width="8" height="8"/>
      <rect x="24" y="100" width="8" height="8"/><rect x="48" y="100" width="8" height="8"/><rect x="64" y="100" width="8" height="8"/>
      <rect x="84" y="96" width="72" height="48" fill="#ffffff" stroke="#141414" stroke-width="2" rx="4"/>
      <text x="120" y="125" font-family="'Space Grotesk', sans-serif" font-weight="700" font-size="11" text-anchor="middle" fill="#141414">PromptPay</text>
      <rect x="84" y="152" width="8" height="8"/><rect x="108" y="152" width="8" height="8"/><rect x="132" y="152" width="8" height="8"/><rect x="156" y="152" width="8" height="8"/>
      <rect x="96" y="168" width="8" height="8"/><rect x="120" y="168" width="8" height="8"/><rect x="144" y="168" width="8" height="8"/><rect x="168" y="168" width="8" height="8"/>
      <rect x="84" y="184" width="8" height="8"/><rect x="108" y="184" width="8" height="8"/><rect x="132" y="184" width="8" height="8"/><rect x="180" y="184" width="8" height="8"/>
      <rect x="96" y="200" width="8" height="8"/><rect x="120" y="200" width="8" height="8"/><rect x="144" y="200" width="8" height="8"/><rect x="196" y="200" width="8" height="8"/>
      <rect x="168" y="84" width="8" height="8"/><rect x="192" y="84" width="8" height="8"/><rect x="216" y="84" width="8" height="8"/>
      <rect x="180" y="100" width="8" height="8"/><rect x="204" y="100" width="8" height="8"/>
      <rect x="168" y="116" width="8" height="8"/><rect x="192" y="116" width="8" height="8"/><rect x="216" y="116" width="8" height="8"/>
      <rect x="180" y="132" width="8" height="8"/><rect x="204" y="132" width="8" height="8"/>
    </g>
  </svg>`;
}

function generateDemoSlip(amt, ref, bank) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('th-TH') + ' ' + now.toLocaleTimeString('th-TH');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 480" width="360" height="480">
    <rect width="360" height="480" fill="#f8f7f4" rx="16"/>
    <rect width="360" height="60" fill="#141414" rx="16"/>
    <rect y="45" width="360" height="15" fill="#141414"/>
    <circle cx="180" cy="60" r="24" fill="#ffffff" stroke="#141414" stroke-width="3"/>
    <path d="M172 60 L177 65 L189 53" stroke="#141414" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="180" y="38" font-family="'Space Grotesk', sans-serif" font-weight="700" font-size="14" fill="#ffffff" text-anchor="middle" letter-spacing="1">TRANSFER SUCCESS</text>
    <text x="180" y="115" font-family="'Space Grotesk', sans-serif" font-weight="700" font-size="24" fill="#141414" text-anchor="middle">${amt}</text>
    <text x="180" y="135" font-family="sans-serif" font-size="11.5" fill="#737068" text-anchor="middle">${dateStr}</text>
    <line x1="30" y1="155" x2="330" y2="155" stroke="#e3e0d8" stroke-width="1.5" stroke-dasharray="4"/>
    <text x="36" y="185" font-family="sans-serif" font-size="11.5" fill="#737068">จาก (From)</text>
    <text x="36" y="205" font-family="sans-serif" font-weight="700" font-size="13.5" fill="#141414">${esc(me ? me.name : 'ลูกค้า')}</text>
    <text x="36" y="222" font-family="sans-serif" font-size="11.5" fill="#737068">บัญชีออมทรัพย์ xxx-xxx4321</text>
    <text x="36" y="255" font-family="sans-serif" font-size="11.5" fill="#737068">ไปยัง (To)</text>
    <text x="36" y="275" font-family="sans-serif" font-weight="700" font-size="13.5" fill="#141414">ONCE — 1-OF-1 ARCHIVE STORE</text>
    <text x="36" y="292" font-family="sans-serif" font-size="11.5" fill="#141414" font-weight="600">${bank || 'กสิกรไทย 095-2-88194-0'}</text>
    <line x1="30" y1="315" x2="330" y2="315" stroke="#e3e0d8" stroke-width="1.5" stroke-dasharray="4"/>
    <text x="36" y="345" font-family="sans-serif" font-size="11.5" fill="#737068">เลขที่อ้างอิง</text>
    <text x="324" y="345" font-family="'Space Grotesk', monospace" font-size="11.5" font-weight="700" fill="#141414" text-anchor="end">${ref}</text>
    <rect x="36" y="370" width="288" height="65" fill="#ffffff" stroke="#e3e0d8" rx="8"/>
    <text x="180" y="398" font-family="sans-serif" font-size="11" fill="#555" text-anchor="middle">ตรวจสอบข้อมูลสลิปโดยสแกน QR ผ่านแอปธนาคาร</text>
    <text x="180" y="416" font-family="'Space Grotesk', sans-serif" font-size="10" font-weight="700" fill="#141414" text-anchor="middle" letter-spacing="1">VERIFIED ARCHIVE RECEIPT • ONCE</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function copyText(txt, label) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).then(() => toast(`คัดลอก${label}แล้ว!`)).catch(() => toast(`เลข: ${txt}`));
  } else {
    toast(`คัดลอก: ${txt}`);
  }
}

function onSlipPicked(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    uploadedSlip = ev.target.result;
    renderPayDetail();
    toast('แนบสลิปเรียบร้อยแล้ว!');
  };
  reader.readAsDataURL(file);
}

function setPay(m) {
  payMethod = m;
  document.querySelectorAll('.pay-option').forEach(el => el.classList.remove('selected'));
  const found = Array.from(document.querySelectorAll('.pay-option')).find(el => el.innerHTML.includes(PAY_METHODS.find(x => x.id === m).name));
  if (found) found.classList.add('selected');
  renderPayDetail();
}

function renderPayDetail() {
  const tot = grandTotal();
  const ref = 'ONCE-' + String(Date.now()).slice(-6);
  const d = $('payDetail');
  if (!d) return;

  const ppNum = (db.settings && db.settings.promptpayNumber) || '089-987-6543';

  if (payMethod === 'promptpay') {
    d.innerHTML = `
      <div class="pay-detail-box">
        <div class="qr-container">
          <div class="qr-header">
            <span>THAI QR PAYMENT</span>
          </div>
          ${getPromptPaySvg(baht(tot), ref)}
          <div class="qr-amount">${baht(tot)}</div>
          <div class="qr-meta">
            <b>ONCE ARCHIVE &amp; VINTAGE</b><br>
            พร้อมเพย์: <b>${ppNum}</b><br>
            Ref: <code>${ref}</code>
          </div>
        </div>
        <div class="slip-zone" onclick="$('slip_in').click()">
          <input type="file" id="slip_in" accept="image/*" style="display:none" onchange="onSlipPicked(event)">
          <div>📷 <b>แนบหลักฐานการโอน (สลิป)</b> (คลิกเพื่ออัปโหลด)</div>
          <div class="mut">อัปโหลดสลิปเพื่อให้แอดมินตรวจสอบยอดเงิน</div>
          ${uploadedSlip ? `<img src="${uploadedSlip}" class="slip-preview"><br><button type="button" class="btn-sm dng" onclick="event.stopPropagation();uploadedSlip=null;renderPayDetail()">✕ ลบรูปสลิป</button>` : ''}
        </div>
        <div style="text-align:center;margin-top:8px">
          <button type="button" class="quick-fill-btn" onclick="uploadedSlip=generateDemoSlip('${baht(tot)}','${ref}','พร้อมเพย์ ${ppNum}');renderPayDetail();toast('โหลดสลิปจำลองเรียบร้อย!')">⚡ ใช้สลิปจำลองสำหรับทดสอบ</button>
        </div>
      </div>
    `;
  } else if (payMethod === 'bank') {
    d.innerHTML = `
      <div class="pay-detail-box">
        <h4 style="margin:0 0 10px;font-family:var(--font-head)">เลือกบัญชีธนาคารสำหรับโอนเงิน</h4>
        <div class="bank-cards-grid">
          <div class="bank-card">
            <span class="bank-tag kbank">KBANK กสิกรไทย</span>
            <div class="bank-acc-no">095-2-88194-0</div>
            <div class="mut">บจก. วันซ์ อาร์ไคฟ์ แอนด์ วินเทจ (ออมทรัพย์)</div>
            <button type="button" class="copy-btn" onclick="copyText('0952881940','เลขบัญชีกสิกรไทย')">📋 คัดลอกเลขบัญชี</button>
          </div>
          <div class="bank-card">
            <span class="bank-tag scb">SCB ไทยพาณิชย์</span>
            <div class="bank-acc-no">408-3-22910-5</div>
            <div class="mut">บจก. วันซ์ อาร์ไคฟ์ แอนด์ วินเทจ (ออมทรัพย์)</div>
            <button type="button" class="copy-btn" onclick="copyText('4083229105','เลขบัญชีไทยพาณิชย์')">📋 คัดลอกเลขบัญชี</button>
          </div>
          <div class="bank-card">
            <span class="bank-tag ktb">KTB กรุงไทย</span>
            <div class="bank-acc-no">672-0-11945-8</div>
            <div class="mut">บจก. วันซ์ อาร์ไคฟ์ แอนด์ วินเทจ (ออมทรัพย์)</div>
            <button type="button" class="copy-btn" onclick="copyText('6720119458','เลขบัญชีกรุงไทย')">📋 คัดลอกเลขบัญชี</button>
          </div>
        </div>
        <div class="slip-zone" onclick="$('slip_in').click()">
          <input type="file" id="slip_in" accept="image/*" style="display:none" onchange="onSlipPicked(event)">
          <div>📷 <b>แนบสลิปการโอนเงิน</b> (คลิกเพื่ออัปโหลด)</div>
          <div class="mut">อัปโหลดสลิปเพื่อให้แอดมินตรวจสอบและจัดส่งได้รวดเร็วขึ้น</div>
          ${uploadedSlip ? `<img src="${uploadedSlip}" class="slip-preview"><br><button type="button" class="btn-sm dng" onclick="event.stopPropagation();uploadedSlip=null;renderPayDetail()">✕ ลบรูปสลิป</button>` : ''}
        </div>
        <div style="text-align:center;margin-top:8px">
          <button type="button" class="quick-fill-btn" onclick="uploadedSlip=generateDemoSlip('${baht(tot)}','${ref}','กสิกรไทย 095-2-88194-0');renderPayDetail();toast('โหลดสลิปจำลองเรียบร้อย!')">⚡ ใช้สลิปจำลองสำหรับทดสอบ</button>
        </div>
      </div>
    `;
  } else if (payMethod === 'card') {
    d.innerHTML = `
      <div class="pay-detail-box">
        <div class="cc-brands">
          <b>รองรับ:</b>
          <span class="brand-badge">VISA</span>
          <span class="brand-badge">MasterCard</span>
          <span class="brand-badge">JCB</span>
          <span class="mut" style="margin-left:auto">🔐 256-Bit SSL</span>
        </div>
        <div class="cc-form">
          <div class="full">
            <label>หมายเลขบัตร 16 หลัก</label>
            <input id="cc_no" maxlength="19" placeholder="4111 2222 3333 4444" oninput="fmtCard(this)">
          </div>
          <div>
            <label>วันหมดอายุ (MM/YY)</label>
            <input id="cc_exp" maxlength="5" placeholder="12/28" oninput="fmtExp(this)">
          </div>
          <div>
            <label>รหัสความปลอดภัย (CVV)</label>
            <input id="cc_cvv" type="password" maxlength="4" placeholder="123">
          </div>
          <div class="full">
            <label>ชื่อบนบัตร (ภาษาอังกฤษ)</label>
            <input id="cc_name" placeholder="SOMCHAI DEE">
          </div>
        </div>
        <button type="button" class="quick-fill-btn" onclick="fillTestCard()">⚡ กรอกข้อมูลบัตรทดสอบด่วน</button>
      </div>
    `;
  } else if (payMethod === 'truemoney') {
    d.innerHTML = `
      <div class="pay-detail-box">
        <div class="row" style="margin-bottom:10px">
          <b style="color:#ff6000;font-size:15px">👛 TrueMoney Wallet</b>
          <span class="pay-badge" style="background:#ff6000;color:#fff">หักเงินทันที</span>
        </div>
        <label>เบอร์โทรศัพท์ทรูมันนี่ (10 หลัก)</label>
        <input id="tm_phone" maxlength="12" placeholder="08x-xxx-xxxx" value="${esc(me ? me.phone : '081-234-5678')}" style="max-width:300px;font-size:15px;font-weight:700">
        <div class="mut" style="margin-top:8px">
          เมื่อกดยืนยันสั่งซื้อ ระบบจะส่งคำขอหักยอดชำระ <b>${baht(tot)}</b> ไปยังบัญชีทรูมันนี่เบอร์นี้ทันที
        </div>
      </div>
    `;
  } else if (payMethod === 'cod') {
    d.innerHTML = `
      <div class="pay-detail-box">
        <div class="row" style="margin-bottom:10px">
          <b style="font-size:15px">🚚 เก็บเงินปลายทาง (Cash on Delivery)</b>
          <span class="pay-badge">ฟรีค่าธรรมเนียม</span>
        </div>
        <div style="line-height:1.6;font-size:13px">
          • ยอดที่ต้องชำระเมื่อพัสดุจัดส่งถึง: <b class="price">${baht(tot)}</b><br>
          • ชำระได้ทั้ง <b>เงินสด</b> หรือ <b>สแกน QR ผ่านแอปธนาคาร</b> กับพนักงานขนส่งเมื่อรับของ<br>
          • กรุณากรอกเบอร์โทรศัพท์ที่ติดต่อได้จริงด้านบน เพื่อให้เจ้าหน้าที่จัดส่งโทรนัดรับพัสดุ
        </div>
      </div>
    `;
  }
}

function fmtCard(el) {
  let v = el.value.replace(/\D/g, '').slice(0, 16);
  el.value = v.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function fmtExp(el) {
  let v = el.value.replace(/\D/g, '').slice(0, 4);
  if (v.length >= 3) el.value = v.slice(0, 2) + '/' + v.slice(2);
  else el.value = v;
}

function fillTestCard() {
  const no = $('cc_no'), exp = $('cc_exp'), cvv = $('cc_cvv'), nm = $('cc_name');
  if (no) no.value = '4111 2222 3333 4444';
  if (exp) exp.value = '12/28';
  if (cvv) cvv.value = '888';
  if (nm) nm.value = (me && me.name ? me.name.toUpperCase() : 'CUSTOMER TEST');
  toast('กรอกข้อมูลบัตรทดสอบแล้ว!');
}

/* ========================================================
   PHASE 2 & 3: CHECKOUT & SERVER-DECIDED ORDER PLACEMENT
   ======================================================== */
function checkout() {
  if (!me) {
    toast('กรุณาเข้าสู่ระบบก่อนดำเนินการชำระเงิน');
    return go('auth');
  }
  if (!cart.length) {
    $('app').innerHTML = '<div class="panel">กระเป๋าของคุณว่างเปล่า</div>';
    return;
  }

  const sub = subtotal();
  const ship = calcShipping(sub);
  const tot = grandTotal();

  $('app').innerHTML = `
    <h2>ชำระเงิน</h2>
    <div class="panel">
      <h3 style="margin-top:0">สรุปรายการชิ้นงาน 1-of-1 ในกระเป๋า</h3>
      ${cart.map(c => {
        const p = db.products.find(x => x.id === c.id);
        return `<div class="row" style="padding:8px 0;border-bottom:1px solid var(--line)">
          <div>
            <b>${esc(p ? p.title : '')}</b>
            <div class="mut" style="font-size:11.5px">${esc(p ? p.brand : '')} • ไซส์ ${esc(p ? p.size : '')} • 1 of 1 Unique Piece</div>
          </div>
          <b class="price" style="font-size:16px">${baht(p ? p.price : 0)}</b>
        </div>`;
      }).join('')}
      <div class="row" style="margin-top:14px"><span>ยอดรวมค่าสินค้า (Subtotal)</span><span>${baht(sub)}</span></div>
      <div class="row"><span>ค่าบริการจัดส่งพัสดุ (Shipping)</span><b>${ship === 0 ? 'ฟรี (โปรโมชั่น)' : baht(ship)}</b></div>
      <hr style="border:none;border-top:1.5px solid var(--line);margin:10px 0">
      <div class="row" style="font-size:16px"><b>ยอดชำระสุทธิ (Grand Total)</b><span class="price">${baht(tot)}</span></div>
    </div>

    <div class="panel">
      <h3 style="margin-top:0">ข้อมูลการจัดส่ง</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin-bottom:10px">
        <div>
          <label>ชื่อผู้รับ</label>
          <input id="rec_name" value="${esc(me.name)}" disabled style="opacity:.85">
        </div>
        <div>
          <label>เบอร์โทรศัพท์ติดต่อ *</label>
          <input id="ph" placeholder="08x-xxx-xxxx" value="${esc(me.phone || '081-234-5678')}">
        </div>
      </div>
      <div>
        <label>ที่อยู่จัดส่งพัสดุ *</label>
        <textarea id="ad" rows="3" placeholder="บ้านเลขที่, ซอย, ถนน, แขวง/ตำบล, เขต/อำเภอ, จังหวัด, รหัสไปรษณีย์">${esc(me.address || '')}</textarea>
      </div>
    </div>

    <div class="panel">
      <h3 style="margin-top:0">เลือกช่องทางการชำระเงิน</h3>
      <div class="pay-methods">
        ${PAY_METHODS.map(m => `
          <div class="pay-option ${payMethod === m.id ? 'selected' : ''}" onclick="setPay('${m.id}')">
            <div class="pay-opt-header">
              <div class="pay-opt-icon">${m.icon}</div>
              <div class="pay-opt-radio"></div>
            </div>
            <div class="pay-opt-title">${m.name}</div>
            <div class="pay-opt-desc">${m.desc}</div>
            <span class="pay-badge">${m.badge}</span>
          </div>
        `).join('')}
      </div>

      <div id="payDetail"></div>

      <button class="pri" style="width:100%;font-size:15px;padding:14px;margin-top:10px" onclick="placeOrder()">
        ยืนยันการสั่งซื้อและชำระเงิน (${baht(tot)})
      </button>
    </div>
  `;
  renderPayDetail();
}

async function placeOrder() {
  const ad = $('ad').value.trim();
  const ph = $('ph') ? $('ph').value.trim() : (me.phone || '');
  if (!ad) return toast('กรุณากรอกที่อยู่จัดส่ง');
  if (!ph) return toast('กรุณากรอกเบอร์โทรศัพท์ติดต่อ');

  let payLabel = '';
  let cardLast4 = null;

  if (payMethod === 'promptpay') {
    payLabel = 'พร้อมเพย์ QR';
  } else if (payMethod === 'bank') {
    payLabel = 'โอนผ่านบัญชีธนาคาร';
  } else if (payMethod === 'card') {
    const no = $('cc_no') ? $('cc_no').value.replace(/\s/g, '') : '';
    const exp = $('cc_exp') ? $('cc_exp').value.trim() : '';
    const cvv = $('cc_cvv') ? $('cc_cvv').value.trim() : '';
    if (no.length < 12 || !exp || !cvv) return toast('กรุณากรอกข้อมูลบัตรเครดิตให้ครบถ้วน');
    cardLast4 = no.slice(-4);
    payLabel = `บัตรเครดิต/เดบิต (•••• ${cardLast4})`;
  } else if (payMethod === 'truemoney') {
    const tm = $('tm_phone') ? $('tm_phone').value.trim() : '';
    if (!tm) return toast('กรุณากรอกเบอร์ทรูมันนี่');
    payLabel = `TrueMoney Wallet (${tm})`;
  } else if (payMethod === 'cod') {
    payLabel = 'เก็บเงินปลายทาง (COD)';
  }

  const items = cart.map(c => ({ pid: c.id, qty: 1 }));

  try {
    // Send to Server: Server validates 1-of-1 availability & holds
    const res = await window.api.checkout({
      userId: me.id,
      items,
      address: ad,
      phone: ph,
      paymentMethod: payLabel,
      paymentType: payMethod,
      slip: uploadedSlip,
      cardLast4
    });

    const newOrder = res.order;
    me.address = ad;
    me.phone = ph;
    cart = [];
    uploadedSlip = null;
    saveLocalSessions();

    // Refresh products & orders
    const [prods, orders] = await Promise.all([
      window.api.getProducts().catch(() => null),
      window.api.getOrders(me.id, me.role).catch(() => null)
    ]);
    if (prods) db.products = prods;
    if (orders) db.orders = orders;

    toast(newOrder.status === 'Paid' ? 'ชำระเงินสำเร็จ! ชิ้นงานนี้เป็นของคุณแล้ว' : 'สั่งซื้อสำเร็จ! รอแอดมินตรวจสอบยอดโอน');
    go('history');
  } catch (err) {
    toast(err.message || 'ไม่สามารถทำรายการได้ สินค้าอาจถูกซื้อไปแล้ว');
  }
}

/* ========================================================
   PHASE 3: ORDER HISTORY, STATUS BADGE & TIMELINE
   ======================================================== */
async function history() {
  if (me) {
    try {
      const orders = await window.api.getOrders(me.id, me.role);
      if (orders) db.orders = orders;
    } catch (e) {}
  }

  const os = db.orders.filter(o => o.userId === me.id);

  // Update last seen status to clear badge
  os.forEach(o => {
    lastSeenOrderStatus[o.id] = o.status;
  });
  saveLocalSessions();
  nav();

  const getPayTag = (o) => {
    const pm = o.paymentType || 'bank';
    const label = o.paymentMethod || 'โอนผ่านธนาคาร';
    const icons = { promptpay: '📱', bank: '🏦', card: '💳', truemoney: '👛', cod: '🚚' };
    return `<span class="pay-tag ${pm}">${icons[pm] || '💵'} ${esc(label)}</span>`;
  };

  $('app').innerHTML = '<h2>ประวัติการสั่งซื้อ</h2>' + (os.length ? os.map(o => {
    const isPending = o.status === 'Pending';
    const isPaid = o.status === 'Paid';
    const isShipped = o.status === 'Shipped';
    const isCancelled = o.status === 'Cancelled';

    return `
      <div class="panel">
        <div class="row">
          <div>
            <b>ออเดอร์ #${o.id}</b>
            <div class="mut" style="font-size:12px;margin-top:2px">${new Date(o.at).toLocaleString('th-TH')}</div>
          </div>
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
            ${getPayTag(o)}
            <span class="st ${o.status}">${o.status}</span>
          </div>
        </div>

        <!-- Order Timeline: Pending -> Paid -> Shipped -->
        ${!isCancelled ? `
          <div class="timeline-wrap">
            <div class="timeline-step done">
              <div class="timeline-dot">✓</div>
              <div class="timeline-title">1. สั่งซื้อ / รอชำระ</div>
              <div class="timeline-time">${new Date(o.at).toLocaleDateString('th-TH')}</div>
            </div>
            <div class="timeline-step ${isPaid || isShipped ? 'done' : (isPending ? 'current' : '')}">
              <div class="timeline-dot">${isPaid || isShipped ? '✓' : '2'}</div>
              <div class="timeline-title">2. ยืนยันชำระเงิน</div>
              <div class="timeline-time">${isPaid || isShipped ? 'ชำระเรียบร้อย' : 'รอแอดมินยืนยันสลิป'}</div>
            </div>
            <div class="timeline-step ${isShipped ? 'done' : (isPaid ? 'current' : '')}">
              <div class="timeline-dot">${isShipped ? '✓' : '3'}</div>
              <div class="timeline-title">3. จัดส่งพัสดุแล้ว</div>
              <div class="timeline-time">${isShipped ? (o.trackingNo ? `เลขพัสดุ: ${o.trackingNo}` : 'จัดส่งแล้ว') : 'เตรียมจัดส่ง'}</div>
            </div>
          </div>
        ` : `<div style="color:var(--bad);margin:10px 0;font-weight:700">❌ คำสั่งซื้อนี้ถูกยกเลิกแล้ว</div>`}

        <div style="margin-top:14px;border-top:1px solid var(--line);padding-top:10px">
          ${o.items.map(i => `<div class="row" style="padding:4px 0"><span>${esc(i.title)} <span class="mut" style="font-size:11px">[1 of 1 Piece]</span></span><span>${baht(i.price)}</span></div>`).join('')}
          <div class="row" style="font-size:12px;color:var(--mut);margin-top:4px">
            <span>ค่าจัดส่งพัสดุ:</span>
            <span>${o.shipping === 0 ? 'ฟรี' : baht(o.shipping || 0)}</span>
          </div>
        </div>

        <hr style="border:none;border-top:1px solid var(--line);margin:12px 0">
        <div class="row" style="flex-wrap:wrap">
          <div>
            <span class="mut">${esc(o.address)} ${o.phone ? '• โทร. ' + esc(o.phone) : ''}</span>
            <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
              <button type="button" class="btn-sm pri" onclick="viewReceipt(${o.id})">🧾 ใบเสร็จรับเงิน (E-Receipt)</button>
              ${o.slip ? `<button type="button" class="btn-sm" onclick="viewSlip(${o.id})">📄 ดูสลิปโอนเงิน</button>` : ''}
            </div>
          </div>
          <b class="price">${baht(o.total)}</b>
        </div>
      </div>
    `;
  }).join('') : '<p class="mut">ยังไม่มีประวัติการสั่งซื้อ</p>');
}

/* ========================================================
   SLIP MODAL & E-RECEIPT
   ======================================================== */
function viewSlip(orderId) {
  const o = db.orders.find(x => x.id === Number(orderId));
  if (!o || !o.slip) return toast('ไม่มีรูปสลิปสำหรับออเดอร์นี้');
  const modal = $('slipModal');
  const body = $('slipModalBody');
  if (!modal || !body) return;

  body.innerHTML = `
    <div style="margin-bottom:8px">
      <b>ออเดอร์ #${o.id}</b> — ยอดสุทธิ ${baht(o.total)}<br>
      <span class="mut">${new Date(o.at).toLocaleString('th-TH')} • ${esc(o.paymentMethod || '')}</span>
    </div>
    <img src="${o.slip}" style="max-width:100%;border-radius:12px;border:1px solid var(--line);box-shadow:0 4px 12px rgba(0,0,0,0.1)">
    <div style="margin-top:14px">
      <button class="pri" style="width:100%" onclick="closeSlipModal()">ปิดหน้าต่าง</button>
    </div>
  `;
  modal.style.display = 'flex';
}

function closeSlipModal() {
  const modal = $('slipModal');
  if (modal) modal.style.display = 'none';
}

function viewReceipt(orderId) {
  const o = db.orders.find(x => x.id === Number(orderId));
  if (!o) return toast('ไม่พบข้อมูลออเดอร์');
  const u = (db.users && db.users.find(x => x.id === o.userId)) || me;
  const modal = $('receiptModal');
  const body = $('receiptBody');
  if (!modal || !body) return;

  const invNo = 'ONCE-' + new Date(o.at).getFullYear() + String(new Date(o.at).getMonth() + 1).padStart(2, '0') + String(new Date(o.at).getDate()).padStart(2, '0') + '-' + String(o.id).padStart(4, '0');
  const vat = Math.round(o.total * 7 / 107);
  const beforeVat = o.total - vat;
  const isPaid = (o.status === 'Paid' || o.status === 'Shipped');

  body.innerHTML = `
    <div class="receipt-paper">
      <div class="receipt-stamp ${isPaid ? '' : 'pending'}">${isPaid ? 'PAID • ชำระแล้ว' : 'PENDING'}</div>
      <div style="text-align:center;margin-bottom:16px">
        <div style="font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:24px;letter-spacing:0.05em">ONCE</div>
        <div style="font-size:11px;letter-spacing:0.1em;color:#666;margin-top:2px">1-OF-1 VINTAGE &amp; ARCHIVE APPAREL</div>
        <div style="font-size:11px;color:#888;margin-top:4px">บจก. วันซ์ อาร์ไคฟ์ แอนด์ วินเทจ • เลขประจำตัวผู้เสียภาษี: 0105569012345</div>
        <div style="font-family:'Space Grotesk',sans-serif;font-size:13.5px;font-weight:700;margin-top:10px;letter-spacing:0.05em">ใบเสร็จรับเงิน / ใบกำกับภาษีอย่างย่อ</div>
        <div style="font-size:10.5px;color:#777">RECEIPT / TAX INVOICE (ABB)</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;margin-bottom:12px">
        <div>
          <div><b>เลขที่เอกสาร:</b> ${invNo}</div>
          <div><b>ออเดอร์:</b> #${o.id}</div>
          <div><b>วันที่ทำรายการ:</b> ${new Date(o.at).toLocaleString('th-TH')}</div>
        </div>
        <div>
          <div><b>ลูกค้า:</b> ${esc(u ? u.name : 'ลูกค้า')}</div>
          <div><b>โทรศัพท์:</b> ${esc(o.phone || (u && u.phone) || '-')}</div>
          <div><b>ที่อยู่:</b> ${esc(o.address)}</div>
        </div>
      </div>

      <div style="background:#f4f3ef;padding:8px 10px;border-radius:10px;font-size:12px;margin-bottom:10px">
        <b>วิธีชำระเงิน:</b> ${esc(o.paymentMethod || 'โอนผ่านธนาคาร')} 
        <span style="margin-left:8px;font-weight:700;color:${isPaid ? '#237848' : '#b52b2b'}">[${isPaid ? '✓ ชำระแล้ว' : '⏳ รอตรวจสอบสลิป/ปลายทาง'}]</span>
      </div>

      <table class="receipt-table">
        <thead>
          <tr>
            <th>รายการสินค้า (1-of-1 Piece)</th>
            <th class="num">จำนวน</th>
            <th class="num">ราคา</th>
            <th class="num">รวม (บาท)</th>
          </tr>
        </thead>
        <tbody>
          ${o.items.map(item => `
            <tr>
              <td>${esc(item.title)} <span style="font-size:10.5px;color:#888">[1 OF 1]</span></td>
              <td class="num">1</td>
              <td class="num">${baht(item.price)}</td>
              <td class="num">${baht(item.price)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="display:flex;flex-direction:column;gap:4px;font-size:12px;margin-top:10px">
        <div class="row"><span>มูลค่าสินค้าก่อนภาษี (Pre-VAT)</span><span>${baht(beforeVat)}</span></div>
        <div class="row"><span>ภาษีมูลค่าเพิ่ม 7% (VAT 7% included)</span><span>${baht(vat)}</span></div>
        <div class="row"><span>ค่าบริการจัดส่งพัสดุ (Shipping)</span><b>${o.shipping === 0 ? 'ฟรี (FREE)' : baht(o.shipping || 0)}</b></div>
        <hr class="receipt-divider">
        <div class="row" style="font-size:15px;font-weight:800;font-family:'Space Grotesk',sans-serif">
          <span>ยอดรวมสุทธิ (Grand Total)</span>
          <span>${baht(o.total)}</span>
        </div>
      </div>

      <div style="text-align:center;margin-top:20px;font-size:11px;color:#777;border-top:1px dashed #ccc;padding-top:12px;line-height:1.5">
        ขอบคุณที่ร่วมเป็นเจ้าของชิ้นงานประวัติศาสตร์กับ ONCE — ทุกชิ้นคือชิ้นเดียวในโลก<br>
        เอกสารนี้ออกโดยระบบอิเล็กทรอนิกส์สมบูรณ์แบบ
      </div>
    </div>
  `;

  modal.style.display = 'flex';
}

function closeReceiptModal() {
  const modal = $('receiptModal');
  if (modal) modal.style.display = 'none';
}

function printReceipt() {
  window.print();
}

/* ========================================================
   PHASE 2 & 3: ADMIN MANAGEMENT (DASHBOARD, SLIP CHECK, CSV, SETTINGS)
   ======================================================== */
async function admin() {
  if (!me || me.role !== 'admin') {
    $('app').innerHTML = '<div class="panel">เฉพาะผู้ดูแลระบบเท่านั้น</div>';
    return;
  }

  const unreadCount = db.messages.filter(m => m.sender === 'customer' && m.unread).length;
  const t = (k, l, badge = '') => `<button class="chip ${tab === k ? 'on' : ''}" onclick="tab='${k}';edit=null;editPhoto='';editExtraPhotos=[];admin()">${l}${badge ? ` <span class="chat-badge" style="margin-left:4px">${badge}</span>` : ''}</button>`;

  $('app').innerHTML = `
    <div class="row" style="margin-bottom:14px">
      <h2 style="margin:0">ONCE Admin Portal</h2>
      <button class="btn-sm" onclick="window.open(window.api.getExportCsvUrl(), '_blank')">📥 ส่งออกรายงานยอดขาย (CSV)</button>
    </div>
    <div class="bar">
      ${t('dash', 'Dashboard & กราฟ')}
      ${t('inv', 'คลังสินค้า 1-of-1')}
      ${t('ord', 'คำสั่งซื้อ & ตรวจสลิป')}
      ${t('chat', '💬 แชทลูกค้า', unreadCount || '')}
      ${t('set', '⚙️ ตั้งค่าร้าน & ค่าจัดส่ง')}
    </div>
    <div id="at"></div>
  `;

  ({ dash: aDash, inv: aInv, ord: aOrd, chat: aChat, set: aSet }[tab])();
}

async function aDash() {
  $('at').innerHTML = '<div class="mut">กำลังโหลดข้อมูล Dashboard จาก API…</div>';

  try {
    const [stats, dailySales] = await Promise.all([
      window.api.getDashboardStats(),
      window.api.getDailySales()
    ]);

    const overdueAlert = stats.overdue24hCount > 0 ? `
      <div style="background:#fff2f0;border:1.5px solid #ffccc7;color:#cf1322;padding:12px 18px;border-radius:var(--radius-md);margin-bottom:18px;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">⚠️</span>
        <div><b>มีคำสั่งซื้อรอชำระค้างเกิน 24 ชั่วโมง จำนวน ${stats.overdue24hCount} ออเดอร์!</b><br><span style="font-size:12px">กรุณาตรวจสอบสลิปหรือติดต่อลูกค้าในแท็บ "คำสั่งซื้อ"</span></div>
      </div>
    ` : '';

    // Render Daily Sales Chart using Pure SVG
    const maxSale = Math.max(...dailySales.map(d => d.sales), 1000);
    const chartHeight = 160;
    const chartWidth = 700;
    const barWidth = Math.floor(chartWidth / (dailySales.length * 1.5));

    const svgBars = dailySales.map((d, i) => {
      const h = Math.round((d.sales / maxSale) * (chartHeight - 40));
      const x = 30 + i * (barWidth + 16);
      const y = chartHeight - h - 25;
      return `
        <g class="chart-bar">
          <title>${d.label}: ${baht(d.sales)} (${d.orders} ออเดอร์)</title>
          <rect x="${x}" y="${y}" width="${barWidth}" height="${h}" rx="6" fill="#161616"/>
          <text x="${x + barWidth / 2}" y="${y - 6}" font-family="'Space Grotesk',sans-serif" font-size="9.5" font-weight="700" fill="#141414" text-anchor="middle">${d.sales > 0 ? baht(d.sales).replace('฿','') : ''}</text>
          <text x="${x + barWidth / 2}" y="${chartHeight - 8}" font-family="sans-serif" font-size="10" fill="#737068" text-anchor="middle">${d.label.split(' ')[0]}</text>
        </g>
      `;
    }).join('');

    $('at').innerHTML = `
      ${overdueAlert}

      <div class="stats">
        <div class="stat">ยอดขายรวม (Paid/Shipped)<b>${baht(stats.rev)}</b></div>
        <div class="stat">ออเดอร์รอชำระ (Pending)<b>${stats.pendingCount}</b></div>
        <div class="stat">ออเดอร์ค้างเกิน 24 ชม.<b>${stats.overdue24hCount}</b></div>
        <div class="stat">สินค้าพร้อมขาย (1-of-1)<b>${stats.availCount} ชิ้น</b></div>
        <div class="stat">สินค้าขายแล้ว (Sold Out)<b>${stats.soldCount} ชิ้น</b></div>
      </div>

      <!-- Daily Sales SVG Chart -->
      <div class="chart-container">
        <div class="chart-header">
          <div>
            <h3 style="margin:0;font-family:var(--font-head)">📊 กราฟยอดขายรายวัน (14 วันล่าสุด)</h3>
            <div class="mut" style="font-size:12px">คำนวณจากคำสั่งซื้อสถานะ Paid และ Shipped</div>
          </div>
          <button class="btn-sm" onclick="window.open(window.api.getExportCsvUrl(), '_blank')">📥 Export CSV</button>
        </div>
        <div class="chart-svg-wrap">
          <svg viewBox="0 0 ${chartWidth} ${chartHeight}" style="width:100%;min-width:600px;height:160px">
            <line x1="20" y1="${chartHeight - 25}" x2="${chartWidth - 20}" y2="${chartHeight - 25}" stroke="var(--line)" stroke-width="1.5"/>
            ${svgBars}
          </svg>
        </div>
      </div>

      <div class="panel" style="margin-top:18px">
        <h3 style="margin-top:0">💳 ช่องทางการชำระเงินของคำสั่งซื้อ</h3>
        <div class="pay-methods" style="margin:0">
          <div class="bank-card"><div class="row"><span>📱 พร้อมเพย์ QR</span><b>${stats.payCounts.promptpay} ออเดอร์</b></div></div>
          <div class="bank-card"><div class="row"><span>🏦 โอนผ่านธนาคาร</span><b>${stats.payCounts.bank} ออเดอร์</b></div></div>
          <div class="bank-card"><div class="row"><span>💳 บัตรเครดิต/เดบิต</span><b>${stats.payCounts.card} ออเดอร์</b></div></div>
          <div class="bank-card"><div class="row"><span>👛 TrueMoney</span><b>${stats.payCounts.truemoney} ออเดอร์</b></div></div>
          <div class="bank-card"><div class="row"><span>🚚 เก็บเงินปลายทาง</span><b>${stats.payCounts.cod} ออเดอร์</b></div></div>
        </div>
      </div>
    `;
  } catch (err) {
    $('at').innerHTML = `<div class="panel">ไม่สามารถโหลดข้อมูลสถิติได้: ${err.message}</div>`;
  }
}

/* ========================================================
   ADMIN INVENTORY (PHOTO UPLOAD, GALLERY, MEASUREMENTS, DEFECTS)
   ======================================================== */
function onAdminPhotoPicked(e, isExtra = false) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    if (isExtra) {
      editExtraPhotos.push(ev.target.result);
    } else {
      editPhoto = ev.target.result;
    }
    renderAdminPhotoPreview();
    toast('โหลดรูปภาพเรียบร้อย!');
  };
  reader.readAsDataURL(file);
}

function setPresetSamplePhoto(type) {
  const presets = {
    jacket: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=80',
    tee: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80',
    hoodie: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&auto=format&fit=crop&q=80'
  };
  editPhoto = presets[type] || presets.jacket;
  renderAdminPhotoPreview();
  toast('เลือกรูปภาพตัวอย่างแล้ว!');
}

function renderAdminPhotoPreview() {
  const zone = $('photoPreviewWrap');
  if (!zone) return;

  let extraHtml = '';
  if (editExtraPhotos.length) {
    extraHtml = `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        ${editExtraPhotos.map((src, idx) => `
          <div style="position:relative">
            <img src="${src}" style="width:60px;height:60px;border-radius:8px;object-fit:cover;border:1px solid var(--line)">
            <button type="button" class="btn-icon" style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;font-size:10px;background:var(--bad);color:#fff" onclick="editExtraPhotos.splice(${idx},1);renderAdminPhotoPreview()">✕</button>
          </div>
        `).join('')}
      </div>
    `;
  }

  if (editPhoto) {
    zone.innerHTML = `
      <img src="${editPhoto}" class="photo-preview">
      <div style="margin-top:8px">
        <button type="button" class="btn-sm dng" onclick="editPhoto='';renderAdminPhotoPreview()">✕ ลบรูปหลักนี้</button>
      </div>
      ${extraHtml}
    `;
  } else {
    zone.innerHTML = `
      <div style="font-size:32px;margin-bottom:6px">📷</div>
      <b>คลิกเพื่ออัปโหลดรูปภาพหลักของสินค้า</b>
      <div class="mut" style="font-size:12px;margin-top:2px">รองรับไฟล์ JPG, PNG, WEBP (หรือกดเลือกรูปตัวอย่างด่วนด้านล่าง)</div>
      ${extraHtml}
    `;
  }
}

async function aInv() {
  try {
    const list = await window.api.getProducts();
    if (list) db.products = list;
  } catch (e) {}

  const e = edit ? db.products.find(p => p.id === edit) : {
    title: '', brand: '', category: 'เสื้อยืด', size: 'M', cond: '9/10 Vintage', price: '', sold: false, color: '#333333', image: '', images: [],
    measurements: { chest: '', length: '', shoulder: '', sleeve: '' },
    defects: ''
  };

  editPhoto = editPhoto !== undefined && editPhoto !== '' ? editPhoto : (e.image || '');
  editExtraPhotos = editExtraPhotos && editExtraPhotos.length ? editExtraPhotos : (e.images || []);

  const m = e.measurements || {};
  const f = (id, l, v, t = 'text') => `<div><label>${l}</label><input id="f_${id}" type="${t}" value="${esc(v)}"></div>`;

  $('at').innerHTML = `
    <div class="panel">
      <h3 style="margin-top:0">${edit ? 'แก้ไขชิ้นงาน 1-of-1' : 'ลงขายชิ้นงานใหม่ (1-of-1 Piece)'}</h3>
      
      <!-- Photo Upload Box -->
      <label style="font-weight:700;margin-bottom:4px">รูปภาพสินค้าหลัก (Main Photo) *</label>
      <div class="upload-photo-zone" onclick="$('f_photo_file').click()">
        <input type="file" id="f_photo_file" accept="image/*" style="display:none" onchange="onAdminPhotoPicked(event, false)">
        <div id="photoPreviewWrap"></div>
      </div>
      
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px;font-size:12px">
        <span class="mut">ทางเลือกด่วน:</span>
        <button type="button" class="btn-sm" onclick="setPresetSamplePhoto('jacket')">⚡ ภาพตัวอย่างแจ็คเก็ต</button>
        <button type="button" class="btn-sm" onclick="setPresetSamplePhoto('tee')">⚡ ภาพตัวอย่างเสื้อยืด</button>
        <button type="button" class="btn-sm" onclick="setPresetSamplePhoto('hoodie')">⚡ ภาพตัวอย่างฮู้ดดี้</button>
        <button type="button" class="btn-sm" onclick="$('f_photo_extra').click()">+ เพิ่มรูปมุมอื่นๆ (แกลเลอรี)</button>
        <input type="file" id="f_photo_extra" accept="image/*" style="display:none" onchange="onAdminPhotoPicked(event, true)">
      </div>

      <div style="margin-top:10px">
        <label>หรือระบุ URL รูปภาพสินค้า</label>
        <input id="f_image_url" placeholder="https://example.com/item.jpg" value="${esc(editPhoto)}" oninput="editPhoto=this.value.trim();renderAdminPhotoPreview()">
      </div>

      <hr style="border:none;border-top:1px solid var(--line);margin:18px 0">

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;align-items:end">
        ${f('title', 'ชื่อชิ้นงาน', e.title)}
        ${f('brand', 'แบรนด์', e.brand)}
        <div>
          <label>หมวดหมู่</label>
          <select id="f_category">
            ${['เสื้อยืด', 'แจ็คเก็ต', 'ฮู้ดดี้', 'กางเกง', 'อุปกรณ์'].map(c => `<option ${c === e.category ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div>
          <label>ไซส์</label>
          <select id="f_size">
            ${['S', 'M', 'L', 'XL'].map(s => `<option ${s === e.size ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        ${f('cond', 'สภาพสินค้า (Condition)', e.cond)}
        ${f('price', 'ราคาขาย (บาท)', e.price, 'number')}
        <div>
          <label>สถานะสินค้า</label>
          <select id="f_sold">
            <option value="false" ${!e.sold ? 'selected' : ''}>พร้อมขาย (Available)</option>
            <option value="true" ${e.sold ? 'selected' : ''}>ขายแล้ว (Sold Out)</option>
          </select>
        </div>
      </div>

      <!-- Real Measurements & Defects -->
      <h4 style="margin:18px 0 8px">ตารางวัดจริงจากตัวเสื้อ (นิ้ว) &amp; ตำหนิที่ต้องแจ้ง</h4>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px">
        ${f('m_chest', 'รอบอก (นิ้ว)', m.chest || '')}
        ${f('m_length', 'ความยาวหลัง (นิ้ว)', m.length || '')}
        ${f('m_shoulder', 'ไหล่กว้าง (นิ้ว)', m.shoulder || '')}
        ${f('m_sleeve', 'ความยาวแขน (นิ้ว)', m.sleeve || '')}
      </div>
      <div style="margin-top:10px">
        <label>ตำหนิที่ต้องแจ้งให้ลูกค้าทราบ (Defects / Imperfections)</label>
        <textarea id="f_defects" rows="2" placeholder="เช่น มีรอยเฟดบริเวณข้อศอก, ไม่มีรอยขาด, สกรีนสมบูรณ์">${esc(e.defects || '')}</textarea>
      </div>

      <div style="margin-top:18px;display:flex;gap:10px">
        <button class="pri" onclick="saveP()">${edit ? 'บันทึกการแก้ไข' : '+ ลงขายชิ้นงาน'}</button>
        ${edit ? '<button onclick="edit=null;editPhoto=\'\';editExtraPhotos=[];aInv()">ยกเลิก</button>' : ''}
      </div>
    </div>

    <!-- Inventory Table -->
    <div class="panel tw">
      <table>
        <tr>
          <th>รูป</th>
          <th>ชิ้นงาน</th>
          <th>แบรนด์</th>
          <th>ไซส์</th>
          <th>รอบอก</th>
          <th>ราคา</th>
          <th>สถานะ (1-of-1)</th>
          <th>จัดการ</th>
        </tr>
        ${db.products.map(p => `
          <tr style="${p.sold ? 'opacity:.65' : ''}">
            <td>
              <img src="${getProductImg(p)}" style="width:44px;height:44px;border-radius:10px;object-fit:cover;border:1px solid var(--line)">
            </td>
            <td><b>${esc(p.title)}</b></td>
            <td>${esc(p.brand)}</td>
            <td>${esc(p.size)}</td>
            <td>${esc(p.measurements ? p.measurements.chest || '-' : '-')}</td>
            <td><b>${baht(p.price)}</b></td>
            <td>
              <span class="badge-status ${p.sold ? 'sold' : ''}">${p.sold ? 'SOLD' : 'AVAILABLE'}</span>
            </td>
            <td>
              <button class="btn-sm" onclick="editProduct(${p.id})">แก้ไข</button>
              <button class="btn-sm" onclick="toggleSold(${p.id})">${p.sold ? 'ตั้งเป็นพร้อมขาย' : 'ตั้งเป็นขายแล้ว'}</button>
              <button class="btn-sm dng" onclick="delProduct(${p.id})">ลบ</button>
            </td>
          </tr>
        `).join('')}
      </table>
    </div>
  `;

  renderAdminPhotoPreview();
}

function editProduct(id) {
  edit = id;
  const p = db.products.find(x => x.id === id);
  if (p) {
    editPhoto = p.image || '';
    editExtraPhotos = p.images || [];
  }
  aInv();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function toggleSold(id) {
  const p = db.products.find(x => x.id === id);
  if (!p) return;
  const newSold = !p.sold;
  try {
    await window.api.updateProduct(id, { sold: newSold });
    toast(`ตั้งสถานะเป็น ${newSold ? 'ขายแล้ว' : 'พร้อมขาย'} เรียบร้อย`);
    aInv();
  } catch (e) {
    toast('เกิดข้อผิดพลาดในการบันทึกสถานะ');
  }
}

async function saveP() {
  const g = k => $('f_' + k).value.trim();
  const d = {
    title: g('title'),
    brand: g('brand'),
    category: g('category'),
    size: g('size'),
    cond: g('cond'),
    price: Number(g('price')),
    image: editPhoto || '',
    images: editExtraPhotos || [],
    measurements: {
      chest: g('m_chest'),
      length: g('m_length'),
      shoulder: g('m_shoulder'),
      sleeve: g('m_sleeve')
    },
    defects: $('f_defects') ? $('f_defects').value.trim() : '',
    sold: g('sold') === 'true'
  };

  if (!d.title || !d.brand || isNaN(d.price) || d.price < 0) {
    return toast('กรุณากรอกชื่อ แบรนด์ และราคาให้ถูกต้อง');
  }

  try {
    if (edit) {
      await window.api.updateProduct(edit, d);
      toast('บันทึกการแก้ไขสินค้าเรียบร้อย');
    } else {
      await window.api.createProduct(d);
      toast('ลงขายชิ้นงาน 1-of-1 เรียบร้อย');
    }

    edit = null;
    editPhoto = '';
    editExtraPhotos = [];
    aInv();
  } catch (err) {
    toast(err.message || 'บันทึกไม่สำเร็จ');
  }
}

async function delProduct(id) {
  if (!confirm('ยืนยันลบชิ้นงานนี้ออกจากร้าน?')) return;
  try {
    await window.api.deleteProduct(id);
    toast('ลบชิ้นงานเรียบร้อย');
    aInv();
  } catch (e) {
    toast('ลบไม่สำเร็จ');
  }
}

/* ========================================================
   ADMIN ORDERS & SLIP VERIFICATION (APPROVE / REJECT)
   ======================================================== */
async function aOrd() {
  try {
    const orders = await window.api.getOrders(null, 'admin');
    if (orders) db.orders = orders;
  } catch (e) {}

  const getPayTag = (o) => {
    const pm = o.paymentType || 'bank';
    const label = o.paymentMethod || 'โอนผ่านธนาคาร';
    const icons = { promptpay: '📱', bank: '🏦', card: '💳', truemoney: '👛', cod: '🚚' };
    return `<span class="pay-tag ${pm}">${icons[pm] || '💵'} ${esc(label)}</span>`;
  };

  $('at').innerHTML = `
    <div class="panel tw">
      <table>
        <tr>
          <th>#</th>
          <th>ลูกค้า</th>
          <th>ติดต่อ</th>
          <th>รายการ 1-of-1</th>
          <th>ยอดสุทธิ</th>
          <th>ชำระเงิน</th>
          <th>สลิปโอนเงิน</th>
          <th>สถานะ</th>
          <th>การจัดการ / ตรวจสลิป</th>
        </tr>
        ${db.orders.map(o => {
          const u = db.users && db.users.find(x => x.id === o.userId);
          const hasSlip = Boolean(o.slip);
          const isPending = o.status === 'Pending';

          let slipBadge = '<span class="mut">-</span>';
          if (hasSlip) {
            if (o.slipStatus === 'verified') slipBadge = '<span class="slip-badge verified">✓ ยืนยันแล้ว</span>';
            else if (o.slipStatus === 'rejected') slipBadge = '<span class="slip-badge rejected">✕ สลิปถูกปฏิเสธ</span>';
            else slipBadge = '<span class="slip-badge pending">⏳ รอตรวจสลิป</span>';
          }

          return `
            <tr>
              <td><b>#${o.id}</b></td>
              <td>${esc(u ? u.name : 'ลูกค้า')}</td>
              <td>${esc(o.phone || (u && u.phone) || '-')}</td>
              <td>${o.items.map(i => esc(i.title) + ' [1-of-1]').join(', ')}</td>
              <td><b>${baht(o.total)}</b></td>
              <td>${getPayTag(o)}</td>
              <td>
                ${hasSlip ? `<button class="btn-sm" onclick="viewSlip(${o.id})">📄 ดูสลิป</button> ${slipBadge}` : '<span class="mut">ไม่มีสลิป</span>'}
              </td>
              <td><span class="st ${o.status}">${o.status}</span></td>
              <td>
                <div style="display:flex;gap:4px;flex-wrap:wrap">
                  <button class="btn-sm" onclick="viewReceipt(${o.id})">🧾 ใบเสร็จ</button>
                  ${hasSlip && isPending ? `
                    <button class="btn-sm pri" onclick="verifySlipAction(${o.id}, 'approve')" style="background:#237848;border-color:#237848">✅ ยืนยันชำระเงิน</button>
                    <button class="btn-sm dng" onclick="verifySlipAction(${o.id}, 'reject')">❌ ปฏิเสธสลิป</button>
                  ` : ''}
                  ${o.status === 'Paid' ? `
                    <button class="btn-sm pri" onclick="shipOrder(${o.id})">🚚 จัดส่งแล้ว</button>
                  ` : ''}
                  ${o.status === 'Pending' || o.status === 'Paid' ? `
                    <button class="btn-sm dng" onclick="cancelOrder(${o.id})">ยกเลิก</button>
                  ` : ''}
                </div>
              </td>
            </tr>
          `;
        }).join('') || '<tr><td colspan=9 class="mut" style="text-align:center;padding:24px">ยังไม่มีคำสั่งซื้อ</td></tr>'}
      </table>
    </div>
  `;
}

async function verifySlipAction(orderId, action) {
  let reason = '';
  if (action === 'reject') {
    reason = prompt('ระบุเหตุผลที่ปฏิเสธสลิป (เช่น ยอดเงินไม่ตรง หรือสลิปไม่ชัดเจน):', 'ยอดเงินไม่ตรง หรือสลิปไม่ชัดเจน');
    if (reason === null) return;
  }

  try {
    await window.api.verifySlip(orderId, action, reason);
    toast(action === 'approve' ? 'ยืนยันการชำระเงินเรียบร้อย (สถานะ: Paid)' : 'ปฏิเสธสลิปเรียบร้อย');
    aOrd();
  } catch (e) {
    toast('เกิดข้อผิดพลาดในการตรวจสอบสลิป');
  }
}

async function shipOrder(orderId) {
  const tracking = prompt('กรุณาระบุเลขพัสดุจัดส่ง (Tracking No.):', 'TH01' + Math.floor(Math.random() * 90000000 + 10000000));
  if (tracking === null) return;
  try {
    await window.api.updateOrderStatus(orderId, 'Shipped', 'จัดส่งพัสดุเรียบร้อย', tracking);
    toast('อัปเดตสถานะเป็น Shipped เรียบร้อย');
    aOrd();
  } catch (e) {
    toast('อัปเดตไม่สำเร็จ');
  }
}

async function cancelOrder(orderId) {
  if (!confirm('ยืนยันยกเลิกคำสั่งซื้อนี้? สินค้า 1-of-1 จะถูกคืนกลับสู่ร้าน')) return;
  try {
    await window.api.updateOrderStatus(orderId, 'Cancelled', 'ยกเลิกคำสั่งซื้อ');
    toast('ยกเลิกคำสั่งซื้อและคืนสินค้าเข้าคลังแล้ว');
    aOrd();
  } catch (e) {
    toast('ยกเลิกไม่สำเร็จ');
  }
}

/* ========================================================
   ADMIN SETTINGS (SHIPPING FEE & FREE SHIPPING MINIMUM)
   ======================================================== */
async function aSet() {
  try {
    const s = await window.api.getSettings();
    if (s) db.settings = s;
  } catch (e) {}

  const s = db.settings || { shippingFee: 50, freeShippingMin: 1500, promptpayNumber: '089-987-6543' };

  $('at').innerHTML = `
    <div class="narrow panel" style="max-width:540px">
      <h3 style="margin-top:0">⚙️ ตั้งค่าร้านค้า &amp; ค่าจัดส่ง (Shipping Settings)</h3>
      <div class="mut" style="font-size:12.5px;margin-bottom:14px">กำหนดค่าจัดส่งเริ่มต้นและเงื่อนไขส่งฟรี ซึ่งจะถูกนำไปคำนวณในตะกร้า, Checkout, QR พร้อมเพย์ และใบเสร็จ</div>
      
      <div>
        <label>ค่าจัดส่งเริ่มต้น (บาท) *</label>
        <input id="set_fee" type="number" value="${s.shippingFee || 50}">
      </div>

      <div style="margin-top:10px">
        <label>ยอดสั่งซื้อขั้นต่ำเพื่อรับสิทธิ์ส่งฟรี (บาท) *</label>
        <input id="set_free_min" type="number" value="${s.freeShippingMin || 1500}">
      </div>

      <div style="margin-top:10px">
        <label>หมายเลขพร้อมเพย์ร้านค้า (สำหรับสร้าง QR โค้ด)</label>
        <input id="set_pp_no" value="${esc(s.promptpayNumber || '089-987-6543')}">
      </div>

      <div style="margin-top:10px">
        <label>ชื่อบัญชีพร้อมเพย์</label>
        <input id="set_pp_name" value="${esc(s.promptpayName || 'ONCE ARCHIVE & VINTAGE')}">
      </div>

      <button class="pri" style="margin-top:18px;width:100%" onclick="saveSettings()">บันทึกการตั้งค่า</button>
    </div>
  `;
}

async function saveSettings() {
  const fee = Number($('set_fee').value);
  const freeMin = Number($('set_free_min').value);
  const ppNo = $('set_pp_no').value.trim();
  const ppName = $('set_pp_name').value.trim();

  if (isNaN(fee) || fee < 0 || isNaN(freeMin) || freeMin < 0) {
    return toast('กรุณาระบุตัวเลขค่าจัดส่งให้ถูกต้อง');
  }

  try {
    const res = await window.api.updateSettings({
      shippingFee: fee,
      freeShippingMin: freeMin,
      promptpayNumber: ppNo,
      promptpayName: ppName
    });
    db.settings = res.settings;
    toast('บันทึกการตั้งค่าเรียบร้อย!');
    render();
  } catch (e) {
    toast('บันทึกการตั้งค่าไม่สำเร็จ');
  }
}

/* ========================================================
   ADMIN CUSTOMER CHAT & REAL-TIME POLLING
   ======================================================== */
function aChat() {
  $('at').innerHTML = `
    <div class="panel" style="max-width:760px;margin:0 auto">
      <div class="row" style="margin-bottom:14px">
        <div>
          <h3 style="margin:0">💬 บทสนทนากับลูกค้า (Customer Inquiries)</h3>
          <div class="mut" style="font-size:12px">ตอบกลับคำถามเรื่องไซส์ สภาพสินค้า และรูปภาพเพิ่มเติม</div>
        </div>
        <button class="btn-sm" onclick="seedSampleCustomerChat()">+ จำลองข้อความจากลูกค้า</button>
      </div>

      <div id="adminChatList" style="background:var(--bg);border:1.5px solid var(--line);border-radius:var(--radius-md);padding:18px;height:380px;overflow-y:auto;display:flex;flex-direction:column;gap:12px;margin-bottom:14px">
        ${db.messages.map(m => `
          <div style="align-self:${m.sender === 'admin' ? 'flex-end' : 'flex-start'};max-width:80%">
            <div style="font-size:11px;color:var(--mut);margin-bottom:2px;text-align:${m.sender === 'admin' ? 'right' : 'left'}">
              <b>${esc(m.senderName)}</b> • ${new Date(m.time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style="background:${m.sender === 'admin' ? 'var(--fg)' : 'var(--card)'};color:${m.sender === 'admin' ? 'var(--bg)' : 'var(--fg)'};border:1px solid ${m.sender === 'admin' ? 'transparent' : 'var(--line)'};padding:10px 16px;border-radius:18px;font-size:13.5px;box-shadow:0 1px 4px rgba(0,0,0,0.04)">
              ${esc(m.text)}
            </div>
          </div>
        `).join('')}
      </div>

      <div style="display:flex;gap:10px">
        <input id="adminChatIn" placeholder="พิมพ์ข้อความตอบกลับลูกค้าในฐานะแอดมินร้าน ONCE…" onkeydown="if(event.key==='Enter')sendAdminReply()">
        <button class="pri" style="border-radius:var(--radius-full);padding:10px 22px" onclick="sendAdminReply()">ส่งคำตอบ</button>
      </div>
    </div>
  `;

  const box = $('adminChatList');
  if (box) box.scrollTop = box.scrollHeight;
}

async function sendAdminReply() {
  const inp = $('adminChatIn');
  if (!inp) return;
  const txt = inp.value.trim();
  if (!txt) return;

  try {
    const newMsg = await window.api.sendMessage('admin', 'ONCE Admin', txt);
    db.messages.push(newMsg);
    inp.value = '';
    toast('ส่งข้อความตอบกลับแล้ว!');
    aChat();
    renderChatMessages();
  } catch (e) {
    toast('ส่งข้อความไม่สำเร็จ');
  }
}

async function seedSampleCustomerChat() {
  try {
    const newMsg = await window.api.sendMessage('customer', 'ลูกค้า (คุณนัท)', 'สวัสดีครับ สนใจแจ็คเก็ต Carhartt Detroit วัดขนาดอกกับความยาวหลังให้หน่อยได้ไหมครับ?');
    db.messages.push(newMsg);
    toast('จำลองข้อความลูกค้าเรียบร้อย!');
    aChat();
    renderChatMessages();
  } catch (e) {}
}

/* ========================================================
   FLOATING CUSTOMER CHAT & 5-SECOND POLLING
   ======================================================== */
function toggleChat() {
  const box = $('chatBox');
  if (!box) return;
  const isHidden = box.style.display === 'none';
  box.style.display = isHidden ? 'flex' : 'none';
  if (isHidden) {
    renderChatMessages();
    const inp = $('chatInput');
    if (inp) inp.focus();
  }
}

function renderChatMessages() {
  const list = $('chatMsgList');
  if (!list) return;

  list.innerHTML = db.messages.map(m => `
    <div class="chat-bubble ${m.sender}">
      <div>${esc(m.text)}</div>
      <div class="chat-time">${new Date(m.time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
    </div>
  `).join('');

  list.scrollTop = list.scrollHeight;
}

async function sendCustomerMsg() {
  const inp = $('chatInput');
  if (!inp) return;
  const txt = inp.value.trim();
  if (!txt) return;

  const senderName = me ? me.name : 'ลูกค้าทั่วไป';
  inp.value = '';

  try {
    const newMsg = await window.api.sendMessage('customer', senderName, txt);
    db.messages.push(newMsg);
    renderChatMessages();
    updateChatBadge();
  } catch (e) {
    toast('ส่งข้อความไม่สำเร็จ');
  }
}

function updateChatBadge() {
  const badge = $('chatBadge');
  if (!badge) return;
  const unreadCust = db.messages.filter(m => m.sender === 'admin' && m.unread).length;
  if (unreadCust > 0) {
    badge.textContent = unreadCust;
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }
}

// Polling every 5 seconds for Real-Time Cross-Machine Messaging
function startChatPolling() {
  setInterval(async () => {
    try {
      const msgs = await window.api.getMessages();
      if (msgs && msgs.length !== db.messages.length) {
        db.messages = msgs;
        renderChatMessages();
        updateChatBadge();
        if (view === 'admin' && tab === 'chat') {
          aChat();
        }
      }
    } catch (e) {}
  }, 5000);
}

// Start Application
window.addEventListener('DOMContentLoaded', initApp);
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initApp();
}
