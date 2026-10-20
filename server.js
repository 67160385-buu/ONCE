/**
 * ONCE — 1-of-1 Vintage & Archive Apparel Store
 * Lightweight Built-in Node.js HTTP Server & REST API
 * Zero third-party dependencies required.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database', 'db.json');

// Ensure database directory exists
const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initial Seed Data
const defaultSeed = () => ({
  settings: {
    shippingFee: 50,
    freeShippingMin: 1500,
    promptpayNumber: '089-987-6543',
    promptpayName: 'ONCE ARCHIVE & VINTAGE'
  },
  users: [
    { id: 1, name: 'Admin', email: 'admin@shop.com', password: 'admin123', role: 'admin', address: '', phone: '080-000-0000' },
    { id: 2, name: 'ลูกค้าตัวอย่าง', email: 'user@shop.com', password: '1234', role: 'customer', address: '99 ถ.สุขุมวิท กรุงเทพฯ 10110', phone: '081-234-5678' }
  ],
  products: [
    {
      id: 1,
      title: 'Vintage Carhartt Detroit Work Jacket',
      brand: 'Carhartt',
      category: 'แจ็คเก็ต',
      size: 'L',
      cond: '9/10 Vintage',
      price: 1890,
      sold: false,
      stock: 1,
      color: '#8a5a2b',
      image: '',
      images: [],
      measurements: { chest: '48"', length: '26.5"', shoulder: '20"', sleeve: '25"' },
      defects: 'รอยเฟดธรรมชาติบริเวณคอปกและข้อศอก ไม่มีรอยขาด ซิปรูดลื่นปกติ',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
    },
    {
      id: 2,
      title: 'Nike Center Mini Swoosh Tee 90s',
      brand: 'Nike',
      category: 'เสื้อยืด',
      size: 'M',
      cond: '9.5/10 Pristine',
      price: 690,
      sold: false,
      stock: 1,
      color: '#2b4a8a',
      image: '',
      images: [],
      measurements: { chest: '40"', length: '28"', shoulder: '18"', sleeve: '8"' },
      defects: 'สภาพสมบูรณ์มาก สกรีนมินิสวูชแน่น ไม่มีตำหนิ ตะเข็บเดี่ยว',
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
    },
    {
      id: 3,
      title: 'Champion Reverse Weave Heavy Hoodie',
      brand: 'Champion',
      category: 'ฮู้ดดี้',
      size: 'XL',
      cond: '8.5/10 Archive',
      price: 1350,
      sold: false,
      stock: 1,
      color: '#525252',
      image: '',
      images: [],
      measurements: { chest: '50"', length: '29"', shoulder: '21"', sleeve: '26"' },
      defects: 'เฟดคลาสสิก ผ้าหนาไม่มีย้วย เชือกฮู้ดเดิมครบ',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: 4,
      title: 'Stüssy 8-Ball Fade Tee 00s',
      brand: 'Stüssy',
      category: 'เสื้อยืด',
      size: 'L',
      cond: '8/10 Vintage Faded',
      price: 850,
      sold: false,
      stock: 1,
      color: '#1a1a1a',
      image: '',
      images: [],
      measurements: { chest: '44"', length: '28.5"', shoulder: '19.5"', sleeve: '8.5"' },
      defects: 'ลายสกรีนแครกตามกาลเวลา ผ้าเฟดดำเทาแบบวินเทจแท้',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: 5,
      title: "Levi's Type 3 Washed Denim Jacket",
      brand: "Levi's",
      category: 'แจ็คเก็ต',
      size: 'M',
      cond: '9/10 Washed Indigo',
      price: 1590,
      sold: false,
      stock: 1,
      color: '#3d6fa8',
      image: '',
      images: [],
      measurements: { chest: '42"', length: '24.5"', shoulder: '18"', sleeve: '24"' },
      defects: 'สีบลูยีนส์ฟอกสวย ป้ายส้มครบ ไม่มีรอยเปื้อนหนัก',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 6,
      title: 'Adidas Trefoil 90s Track Jacket',
      brand: 'Adidas',
      category: 'แจ็คเก็ต',
      size: 'S',
      cond: '9/10 Archive Classic',
      price: 1090,
      sold: false,
      stock: 1,
      color: '#962b2b',
      image: '',
      images: [],
      measurements: { chest: '38"', length: '25"', shoulder: '17"', sleeve: '23.5"' },
      defects: 'แถบสามเส้นขาวสะอาด โลโก้ปักคมชัด ซิปเดิมสภาพดี',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 7,
      title: 'Harley Davidson 3D Emblem Eagle Tee',
      brand: 'Harley Davidson',
      category: 'เสื้อยืด',
      size: 'L',
      cond: '8.5/10 Single Stitch',
      price: 2200,
      sold: false,
      stock: 1,
      color: '#262626',
      image: '',
      images: [],
      measurements: { chest: '44"', length: '29"', shoulder: '20"', sleeve: '8.5"' },
      defects: 'สกรีนหน้า-หลัง 3D Emblem แท้ปี 1992 ชายเสื้อและแขนตะเข็บเดี่ยว',
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: 8,
      title: 'Ralph Lauren Chaps Harrington Jacket',
      brand: 'Ralph Lauren',
      category: 'แจ็คเก็ต',
      size: 'XL',
      cond: '9/10 Tartan Lined',
      price: 1490,
      sold: false,
      stock: 1,
      color: '#4a5b44',
      image: '',
      images: [],
      measurements: { chest: '52"', length: '27"', shoulder: '22"', sleeve: '25.5"' },
      defects: 'ซับในลายสก็อตต์สมบูรณ์ กระดุมคออยู่ครบ สภาพดีมาก',
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
    }
  ],
  orders: [
    {
      id: 101,
      userId: 2,
      items: [
        { pid: 5, title: "Levi's Type 3 Washed Denim Jacket", qty: 1, price: 1590 }
      ],
      subtotal: 1590,
      shipping: 0,
      total: 1590,
      status: 'Shipped',
      paymentMethod: 'พร้อมเพย์ QR',
      paymentType: 'promptpay',
      slip: null,
      address: '99 ถ.สุขุมวิท กรุงเทพฯ 10110',
      phone: '081-234-5678',
      trackingNo: 'TH0149284102',
      at: new Date(Date.now() - 48 * 3600000).toISOString(),
      timeline: [
        { status: 'Pending', time: new Date(Date.now() - 48 * 3600000).toISOString(), note: 'ทำรายการสั่งซื้อ' },
        { status: 'Paid', time: new Date(Date.now() - 47 * 3600000).toISOString(), note: 'ตรวจสอบยอดชำระเรียบร้อย' },
        { status: 'Shipped', time: new Date(Date.now() - 24 * 3600000).toISOString(), note: 'จัดส่งพัสดุแล้ว เลขพัสดุ: TH0149284102' }
      ]
    }
  ],
  messages: [
    {
      id: 1,
      sender: 'admin',
      senderName: 'ONCE Concierge',
      text: 'สวัสดีครับ ยินดีต้อนรับสู่ ONCE — เนื่องจากสินค้าทุกชิ้นมีเพียง 1 ตัวในโลก หากต้องการสอบถามขนาด สัดส่วน อก/ความยาว หรือขอดูภาพมุมอื่นเพิ่มเติม สามารถส่งข้อความไว้ได้เลยครับ ทีมงานพร้อมให้บริการครับ ✨',
      time: new Date(Date.now() - 3600000).toISOString(),
      unread: false
    }
  ],
  cartHolds: {}, // { [productId]: { heldBy, heldUntil } }
  nid: { p: 9, o: 102, u: 3, m: 2 }
});

// Load or initialize DB
let db;
try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    db = JSON.parse(raw);
    if (!db.products || !db.settings) {
      db = Object.assign(defaultSeed(), db);
    }
  } else {
    db = defaultSeed();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  }
} catch (e) {
  console.error('Error loading DB, initializing seed:', e);
  db = defaultSeed();
}

// Helper to save DB to file
function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save db.json:', e);
  }
}

// Clean up expired cart holds every 30 seconds
setInterval(() => {
  const now = Date.now();
  let changed = false;
  if (db.cartHolds) {
    for (const pid in db.cartHolds) {
      if (db.cartHolds[pid] && db.cartHolds[pid].heldUntil < now) {
        delete db.cartHolds[pid];
        changed = true;
      }
    }
  }
  if (changed) saveDb();
}, 30000);

// Helper for parsing JSON body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 15 * 1024 * 1024) { // 15MB limit for photos/slips
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

// Helper for sending JSON responses
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Id'
  });
  res.end(JSON.stringify(data));
}

// Helper for serving static files
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

function serveStatic(req, res, pathname) {
  let safePath = pathname === '/' ? '/index.html' : pathname;
  safePath = path.normalize(safePath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(__dirname, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

// Request Handler
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Id'
    });
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const query = Object.fromEntries(parsedUrl.searchParams);
  const method = req.method;

  // API Routes under /api/
  if (pathname.startsWith('/api/')) {
    try {
      // 1. Health
      if (pathname === '/api/health') {
        return sendJson(res, 200, { ok: true, version: '2.0.0', serverTime: Date.now() });
      }

      // 2. Settings (Shipping fees, etc.)
      if (pathname === '/api/settings') {
        if (method === 'GET') {
          return sendJson(res, 200, db.settings || defaultSeed().settings);
        }
        if (method === 'PUT') {
          const body = await parseJsonBody(req);
          db.settings = {
            ...db.settings,
            shippingFee: Number(body.shippingFee !== undefined ? body.shippingFee : db.settings.shippingFee),
            freeShippingMin: Number(body.freeShippingMin !== undefined ? body.freeShippingMin : db.settings.freeShippingMin),
            promptpayNumber: body.promptpayNumber || db.settings.promptpayNumber,
            promptpayName: body.promptpayName || db.settings.promptpayName
          };
          saveDb();
          return sendJson(res, 200, { ok: true, settings: db.settings });
        }
      }

      // 3. Products
      if (pathname === '/api/products') {
        if (method === 'GET') {
          const now = Date.now();
          const clientId = req.headers['x-client-id'] || query.clientId || '';
          
          let list = db.products.map(p => {
            const hold = db.cartHolds && db.cartHolds[p.id];
            const isHeld = hold && hold.heldUntil > now;
            const heldByMe = isHeld && hold.heldBy === clientId;
            return {
              ...p,
              isHeld: isHeld && !heldByMe,
              heldUntil: isHeld ? hold.heldUntil : null
            };
          });

          // Filter by search query
          if (query.q) {
            const qLower = String(query.q).toLowerCase();
            list = list.filter(p => (p.title + ' ' + p.brand + ' ' + (p.category || '')).toLowerCase().includes(qLower));
          }
          // Filter by category
          if (query.category && query.category !== 'ทั้งหมด') {
            list = list.filter(p => p.category === query.category);
          }
          // Filter by size
          if (query.size && query.size !== 'ทั้งหมด') {
            list = list.filter(p => p.size === query.size);
          }
          // Filter by brand
          if (query.brand && query.brand !== 'ทั้งหมด') {
            list = list.filter(p => p.brand === query.brand);
          }
          // Filter by price range
          if (query.minPrice) {
            list = list.filter(p => p.price >= Number(query.minPrice));
          }
          if (query.maxPrice) {
            list = list.filter(p => p.price <= Number(query.maxPrice));
          }
          // Filter by availability
          if (query.onlyAvail === 'true') {
            list = list.filter(p => !p.sold);
          }

          // Sorting
          if (query.sort === 'price_asc') {
            list.sort((a, b) => a.price - b.price);
          } else if (query.sort === 'price_desc') {
            list.sort((a, b) => b.price - a.price);
          } else {
            // Newest first by default
            list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          }

          return sendJson(res, 200, list);
        }

        if (method === 'POST') {
          const body = await parseJsonBody(req);
          if (!body.title || !body.brand || body.price === undefined) {
            return sendJson(res, 400, { error: 'กรุณากรอกข้อมูลชิ้นงานให้ครบถ้วน' });
          }

          const newP = {
            id: db.nid.p++,
            title: body.title.trim(),
            brand: body.brand.trim(),
            category: body.category || 'เสื้อยืด',
            size: body.size || 'M',
            cond: body.cond || '9/10 Vintage',
            price: Number(body.price),
            color: body.color || '#222222',
            image: body.image || '',
            images: Array.isArray(body.images) ? body.images : [],
            measurements: body.measurements || { chest: '', length: '', shoulder: '', sleeve: '' },
            defects: body.defects || 'สภาพสมบูรณ์ ไม่มีตำหนิ',
            sold: Boolean(body.sold),
            stock: body.sold ? 0 : 1,
            createdAt: new Date().toISOString()
          };

          db.products.push(newP);
          saveDb();
          return sendJson(res, 201, newP);
        }
      }

      // 4. Single Product by ID: /api/products/:id
      const prodMatch = pathname.match(/^\/api\/products\/(\d+)$/);
      if (prodMatch) {
        const id = Number(prodMatch[1]);
        const p = db.products.find(x => x.id === id);
        if (!p) return sendJson(res, 404, { error: 'ไม่พบสินค้า' });

        if (method === 'GET') {
          const hold = db.cartHolds && db.cartHolds[p.id];
          const now = Date.now();
          const isHeld = hold && hold.heldUntil > now;
          return sendJson(res, 200, {
            ...p,
            isHeld,
            heldUntil: isHeld ? hold.heldUntil : null
          });
        }

        if (method === 'PUT') {
          const body = await parseJsonBody(req);
          Object.assign(p, {
            title: body.title !== undefined ? body.title.trim() : p.title,
            brand: body.brand !== undefined ? body.brand.trim() : p.brand,
            category: body.category !== undefined ? body.category : p.category,
            size: body.size !== undefined ? body.size : p.size,
            cond: body.cond !== undefined ? body.cond : p.cond,
            price: body.price !== undefined ? Number(body.price) : p.price,
            color: body.color !== undefined ? body.color : p.color,
            image: body.image !== undefined ? body.image : p.image,
            images: body.images !== undefined ? body.images : (p.images || []),
            measurements: body.measurements !== undefined ? body.measurements : (p.measurements || {}),
            defects: body.defects !== undefined ? body.defects : (p.defects || ''),
            sold: body.sold !== undefined ? Boolean(body.sold) : p.sold,
            stock: body.sold ? 0 : 1
          });
          saveDb();
          return sendJson(res, 200, p);
        }

        if (method === 'DELETE') {
          db.products = db.products.filter(x => x.id !== id);
          if (db.cartHolds) delete db.cartHolds[id];
          saveDb();
          return sendJson(res, 200, { ok: true, id });
        }
      }

      // 5. Cart Hold & Release (15 min temporary reserve)
      if (pathname === '/api/cart/hold' && method === 'POST') {
        const body = await parseJsonBody(req);
        const pid = Number(body.productId);
        const clientId = body.clientId || req.headers['x-client-id'];
        if (!pid || !clientId) {
          return sendJson(res, 400, { error: 'Missing productId or clientId' });
        }

        const p = db.products.find(x => x.id === pid);
        if (!p) return sendJson(res, 404, { error: 'ไม่พบสินค้าชิ้นนี้' });
        if (p.sold) return sendJson(res, 400, { error: `ชิ้นงาน "${p.title}" ถูกจำหน่ายไปแล้ว` });

        const now = Date.now();
        if (!db.cartHolds) db.cartHolds = {};
        const currentHold = db.cartHolds[pid];

        if (currentHold && currentHold.heldUntil > now && currentHold.heldBy !== clientId) {
          const remainMins = Math.ceil((currentHold.heldUntil - now) / 60000);
          return sendJson(res, 409, {
            error: `ชิ้นงานนี้กำลังถูกจองชั่วคราวในตะกร้าของลูกค้าท่านอื่น (เหลือเวลาประมาณ ${remainMins} นาที)`,
            heldUntil: currentHold.heldUntil
          });
        }

        // Grant 15 min hold
        const heldUntil = now + 15 * 60 * 1000;
        db.cartHolds[pid] = { heldBy: clientId, heldUntil };
        saveDb();
        return sendJson(res, 200, { ok: true, productId: pid, heldUntil });
      }

      if (pathname === '/api/cart/release' && method === 'POST') {
        const body = await parseJsonBody(req);
        const pid = Number(body.productId);
        const clientId = body.clientId || req.headers['x-client-id'];
        if (pid && db.cartHolds && db.cartHolds[pid]) {
          if (!clientId || db.cartHolds[pid].heldBy === clientId) {
            delete db.cartHolds[pid];
            saveDb();
          }
        }
        return sendJson(res, 200, { ok: true });
      }

      // 6. Auth
      if (pathname === '/api/auth/login' && method === 'POST') {
        const body = await parseJsonBody(req);
        const u = db.users.find(x => x.email === body.email && x.password === body.password);
        if (!u) return sendJson(res, 401, { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        return sendJson(res, 200, {
          ok: true,
          user: { id: u.id, name: u.name, email: u.email, role: u.role, phone: u.phone, address: u.address }
        });
      }

      if (pathname === '/api/auth/register' && method === 'POST') {
        const body = await parseJsonBody(req);
        if (!body.name || !body.email || !body.password) {
          return sendJson(res, 400, { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }
        if (db.users.some(x => x.email === body.email)) {
          return sendJson(res, 400, { error: 'อีเมลนี้ถูกใช้งานแล้ว' });
        }
        const newUser = {
          id: db.nid.u++,
          name: body.name.trim(),
          email: body.email.trim(),
          password: body.password,
          role: 'customer',
          address: body.address || '',
          phone: body.phone || '081-234-5678'
        };
        db.users.push(newUser);
        saveDb();
        return sendJson(res, 201, {
          ok: true,
          user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, phone: newUser.phone, address: newUser.address }
        });
      }

      // 7. Orders & Checkout (Server Authority for Availability & Pricing)
      if (pathname === '/api/orders') {
        if (method === 'GET') {
          const userId = query.userId ? Number(query.userId) : null;
          let list = db.orders.slice();
          if (userId && query.role !== 'admin') {
            list = list.filter(o => o.userId === userId);
          }
          list.sort((a, b) => new Date(b.at) - new Date(a.at));
          return sendJson(res, 200, list);
        }
      }

      if (pathname === '/api/orders/checkout' && method === 'POST') {
        const body = await parseJsonBody(req);
        const clientId = body.clientId || req.headers['x-client-id'] || '';
        const items = Array.isArray(body.items) ? body.items : [];
        if (!items.length) {
          return sendJson(res, 400, { error: 'กระเป๋าของคุณว่างเปล่า' });
        }

        // Server Check: Is every 1-of-1 product still available and not held by someone else?
        const now = Date.now();
        for (const item of items) {
          const p = db.products.find(x => x.id === item.pid);
          if (!p) return sendJson(res, 404, { error: `ไม่พบสินค้า ID ${item.pid}` });
          if (p.sold) return sendJson(res, 400, { error: `ขออภัย ชิ้นงาน "${p.title}" มีผู้สั่งซื้อไปแล้ว (1-of-1 Piece)` });
          
          const hold = db.cartHolds && db.cartHolds[p.id];
          if (hold && hold.heldUntil > now && hold.heldBy !== clientId) {
            return sendJson(res, 409, { error: `ขออภัย ชิ้นงาน "${p.title}" กำลังถูกจองในตะกร้าของลูกค้าท่านอื่น` });
          }
        }

        // Calculate Subtotal & Shipping with Server Rules
        const subtotal = items.reduce((sum, item) => {
          const p = db.products.find(x => x.id === item.pid);
          return sum + (p ? p.price : 0);
        }, 0);

        const settings = db.settings || defaultSeed().settings;
        const shipping = subtotal >= settings.freeShippingMin ? 0 : settings.shippingFee;
        const total = subtotal + shipping;

        // Determine Status based on payment type
        let status = 'Pending';
        if (body.paymentType === 'card' || body.paymentType === 'truemoney') {
          status = 'Paid';
        } else {
          // PromptPay, Bank transfer, COD -> status is 'Pending'
          // Even with slip uploaded, it stays Pending until Admin verifies!
          status = 'Pending';
        }

        // Mark items as sold and clear holds
        items.forEach(item => {
          const p = db.products.find(x => x.id === item.pid);
          if (p) {
            p.sold = true;
            p.stock = 0;
          }
          if (db.cartHolds) delete db.cartHolds[item.pid];
        });

        const newOrder = {
          id: db.nid.o++,
          userId: Number(body.userId),
          items: items.map(i => {
            const p = db.products.find(x => x.id === i.pid);
            return { pid: p.id, title: p.title, qty: 1, price: p.price };
          }),
          subtotal,
          shipping,
          total,
          status,
          paymentMethod: body.paymentMethod || 'โอนผ่านธนาคาร',
          paymentType: body.paymentType || 'bank',
          slip: body.slip || null,
          slipStatus: body.slip ? 'uploaded' : 'none', // uploaded | verified | rejected | none
          cardLast4: body.cardLast4 || null,
          address: body.address || '',
          phone: body.phone || '',
          trackingNo: '',
          at: new Date().toISOString(),
          timeline: [
            {
              status: 'Pending',
              time: new Date().toISOString(),
              note: body.slip ? 'สั่งซื้อเรียบร้อยและแนบสลิป รอแอดมินตรวจสอบ' : 'สั่งซื้อเรียบร้อย รอการชำระเงิน'
            }
          ]
        };

        if (status === 'Paid') {
          newOrder.timeline.push({
            status: 'Paid',
            time: new Date().toISOString(),
            note: 'ชำระเงินสำเร็จ (ตัดบัตร/ทรูมันนี่)'
          });
        }

        db.orders.push(newOrder);
        saveDb();
        return sendJson(res, 201, { ok: true, order: newOrder });
      }

      // Order Details & Status updates: /api/orders/:id
      const orderMatch = pathname.match(/^\/api\/orders\/(\d+)$/);
      if (orderMatch) {
        const id = Number(orderMatch[1]);
        const o = db.orders.find(x => x.id === id);
        if (!o) return sendJson(res, 404, { error: 'ไม่พบออเดอร์' });

        if (method === 'GET') {
          return sendJson(res, 200, o);
        }
      }

      // Order Status change: /api/orders/:id/status
      const orderStatusMatch = pathname.match(/^\/api\/orders\/(\d+)\/status$/);
      if (orderStatusMatch && method === 'PUT') {
        const id = Number(orderStatusMatch[1]);
        const o = db.orders.find(x => x.id === id);
        if (!o) return sendJson(res, 404, { error: 'ไม่พบออเดอร์' });

        const body = await parseJsonBody(req);
        const newStatus = body.status;
        const note = body.note || `เปลี่ยนสถานะเป็น ${newStatus}`;
        const trackingNo = body.trackingNo || o.trackingNo;

        // If cancelled, return 1-of-1 items to available
        if (newStatus === 'Cancelled' && o.status !== 'Cancelled') {
          o.items.forEach(item => {
            const p = db.products.find(x => x.id === item.pid);
            if (p) {
              p.sold = false;
              p.stock = 1;
            }
          });
        }

        o.status = newStatus;
        if (trackingNo) o.trackingNo = trackingNo;
        if (!o.timeline) o.timeline = [];
        o.timeline.push({
          status: newStatus,
          time: new Date().toISOString(),
          note
        });

        saveDb();
        return sendJson(res, 200, { ok: true, order: o });
      }

      // Admin Slip Verification: /api/orders/:id/verify-slip
      const verifySlipMatch = pathname.match(/^\/api\/orders\/(\d+)\/verify-slip$/);
      if (verifySlipMatch && method === 'POST') {
        const id = Number(verifySlipMatch[1]);
        const o = db.orders.find(x => x.id === id);
        if (!o) return sendJson(res, 404, { error: 'ไม่พบออเดอร์' });

        const body = await parseJsonBody(req);
        const action = body.action; // 'approve' | 'reject'
        const reason = body.reason || '';

        if (!o.timeline) o.timeline = [];

        if (action === 'approve') {
          o.status = 'Paid';
          o.slipStatus = 'verified';
          o.timeline.push({
            status: 'Paid',
            time: new Date().toISOString(),
            note: 'แอดมินยืนยันยอดสลิปโอนเงินเรียบร้อยแล้ว'
          });
        } else if (action === 'reject') {
          o.slipStatus = 'rejected';
          o.slipRejectReason = reason || 'สลิปไม่ถูกต้อง หรือยอดเงินไม่ตรง';
          o.timeline.push({
            status: 'Pending',
            time: new Date().toISOString(),
            note: `แอดมินปฏิเสธสลิป: ${o.slipRejectReason}`
          });
        }

        saveDb();
        return sendJson(res, 200, { ok: true, order: o });
      }

      // 8. Messages & Live Polling
      if (pathname === '/api/messages') {
        if (method === 'GET') {
          return sendJson(res, 200, db.messages || []);
        }
        if (method === 'POST') {
          const body = await parseJsonBody(req);
          if (!body.text || !body.text.trim()) {
            return sendJson(res, 400, { error: 'กรุณากรอกข้อความ' });
          }

          const newMsg = {
            id: db.nid.m++,
            sender: body.sender || 'customer',
            senderName: body.senderName || 'ลูกค้า',
            text: body.text.trim(),
            time: new Date().toISOString(),
            unread: body.sender === 'customer'
          };

          if (!db.messages) db.messages = [];
          db.messages.push(newMsg);
          saveDb();
          return sendJson(res, 201, newMsg);
        }
      }

      // 9. Dashboard Statistics (Revenue for Paid/Shipped, Pending, Overdue 24h)
      if (pathname === '/api/dashboard/stats' && method === 'GET') {
        const now = Date.now();
        const paidOrders = db.orders.filter(o => o.status === 'Paid' || o.status === 'Shipped');
        const rev = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);

        const pendingOrders = db.orders.filter(o => o.status === 'Pending');
        const overdue24h = pendingOrders.filter(o => {
          const orderTime = new Date(o.at).getTime();
          return (now - orderTime) > 24 * 3600 * 1000;
        });

        const payCounts = { promptpay: 0, bank: 0, card: 0, truemoney: 0, cod: 0 };
        db.orders.forEach(o => {
          const t = o.paymentType || 'bank';
          if (payCounts[t] !== undefined) payCounts[t]++;
          else payCounts.bank++;
        });

        const availCount = db.products.filter(p => !p.sold).length;
        const soldCount = db.products.filter(p => p.sold).length;

        return sendJson(res, 200, {
          rev,
          totalOrders: db.orders.length,
          paidOrdersCount: paidOrders.length,
          pendingCount: pendingOrders.length,
          overdue24hCount: overdue24h.length,
          totalProducts: db.products.length,
          availCount,
          soldCount,
          payCounts,
          settings: db.settings
        });
      }

      // 10. Dashboard Daily Sales (Past 14 Days)
      if (pathname === '/api/dashboard/daily-sales' && method === 'GET') {
        const days = [];
        const now = new Date();
        for (let i = 13; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const key = `${y}-${m}-${day}`;
          const label = `${d.getDate()} ${['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'][d.getMonth()]}`;
          days.push({ key, label, sales: 0, orders: 0 });
        }

        db.orders.forEach(o => {
          if (o.status === 'Paid' || o.status === 'Shipped') {
            const od = new Date(o.at);
            const y = od.getFullYear();
            const m = String(od.getMonth() + 1).padStart(2, '0');
            const day = String(od.getDate()).padStart(2, '0');
            const key = `${y}-${m}-${day}`;
            const target = days.find(d => d.key === key);
            if (target) {
              target.sales += o.total;
              target.orders++;
            }
          }
        });

        return sendJson(res, 200, days);
      }

      // 11. Export Sales CSV
      if (pathname === '/api/dashboard/export-csv' && method === 'GET') {
        let csv = '\uFEFF'; // UTF-8 BOM for Microsoft Excel Thai support
        csv += 'Order ID,Date,Customer,Phone,Items (1-of-1),Subtotal,Shipping,Grand Total,Payment Method,Status,Tracking No\n';

        db.orders.forEach(o => {
          const u = db.users.find(x => x.id === o.userId);
          const custName = u ? u.name : 'ลูกค้าทั่วไป';
          const itemsStr = o.items.map(i => `${i.title} (฿${i.price})`).join('; ');
          const dateStr = new Date(o.at).toLocaleString('th-TH');

          const sanitize = val => `"${String(val || '').replace(/"/g, '""')}"`;

          csv += [
            o.id,
            sanitize(dateStr),
            sanitize(custName),
            sanitize(o.phone || (u && u.phone) || ''),
            sanitize(itemsStr),
            o.subtotal || o.total,
            o.shipping || 0,
            o.total,
            sanitize(o.paymentMethod || o.paymentType),
            sanitize(o.status),
            sanitize(o.trackingNo || '')
          ].join(',') + '\n';
        });

        res.writeHead(200, {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="once-sales-report.csv"',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(csv);
        return;
      }

      // Unmatched API route
      return sendJson(res, 404, { error: 'API route not found' });
    } catch (apiErr) {
      console.error('API Error:', apiErr);
      return sendJson(res, 500, { error: 'Internal Server Error', message: apiErr.message });
    }
  }

  // Static File Serving
  serveStatic(req, res, pathname);
});

// Start Server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`  ONCE 1-of-1 Archive Store Server`);
  console.log(`  Running on: http://0.0.0.0:${PORT}`);
  console.log(`  REST API available at: /api/`);
  console.log(`=======================================================`);
});
