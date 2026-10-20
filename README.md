# ONCE — 1-of-1 Curated Thrift & Archive Apparel

> **Worn by me, found by you.**  
> ของในตู้ที่อยากให้ได้ไปอยู่กับคนใหม่  
> `FROM MY CLOSET · SECOND ROUND · NO TWO STORIES ALIKE`

เว็บร้านเสื้อผ้ามือสองคัดเกรด Archive & Streetwear สินค้าทุกชิ้นเป็นโมเดล **1-of-1 (มีตัวเดียว ขายแล้วขายเลย)** พร้อมระบบตะกร้ากันของชั่วคราว 15 นาที, ระบบชำระเงิน 5 ช่องทาง, แอดมินตรวจสลิป, แชทสดบนเว็บ, หน้ารายละเอียดวัดไซส์จริง และส่งออกรายงานยอดขาย CSV

---

## 🚀 วิธี Deploy ขึ้น Render.com (รองรับ 100%)

โปรเจกต์นี้ถูกออกแบบให้รันบน **Render Web Service** ได้ทันที โดยใช้ Node.js แท้ (Zero Third-Party Dependencies) บิลด์เสร็จไวใน 5 วินาที

### วิธีที่ 1: Deploy ผ่าน Render Blueprint (แนะนำ - ง่ายสุดในคลิกเดียว)
1. อัปโหลดโปรเจกต์นี้ขึ้น GitHub หรือ GitLab ของคุณ
2. เข้าสู่ระบบที่ [dashboard.render.com](https://dashboard.render.com)
3. คลิกปุ่ม **"New +"** มุมขวาบน แล้วเลือก **"Blueprint"**
4. เลือก Repository ที่คุณอัปโหลดไว้
5. Render จะอ่านไฟล์ `render.yaml` ให้อัตโนมัติ จากนั้นคลิก **"Apply"** เพื่อ Deploy ทันที!

### วิธีที่ 2: Deploy แบบ Manual Web Service
1. เข้า [dashboard.render.com](https://dashboard.render.com) -> คลิก **"New +"** -> **"Web Service"**
2. เชื่อมต่อกับ Repository ของคุณ
3. ตั้งค่าดังนี้:
   - **Name**: `once-archive-store` (หรือชื่อตามต้องการ)
   - **Region**: `Singapore` (ใกล้ไทย ตอบสนองเร็วที่สุด)
   - **Runtime**: `Node`
   - **Build Command**: ปล่อยว่าง หรือใส่ `echo "Ready"`
   - **Start Command**: `node server.js` (หรือ `npm start`)
   - **Instance Type**: `Free`
4. คลิก **"Deploy Web Service"**
5. รอระบบ Deploy ประมาณ 30-60 วินาที จะได้รับ URL สำหรับเข้าใช้งาน เช่น `https://once-archive-store.onrender.com`

---

## 💻 วิธีเปิดรันเครื่องตนเอง (Local Development)

```bash
# 1. เริ่มเซิร์ฟเวอร์
npm start
# หรือ
node server.js

# 2. เปิดใช้งานในเบราว์เซอร์
# เข้าไปที่: http://localhost:3000
```

---

## 🔑 บัญชีทดลองใช้งาน
- **ผู้ดูแลระบบ (Admin)**: `admin@shop.com` / รหัสผ่าน: `admin123`
- **ลูกค้าทั่วไป (Customer)**: `user@shop.com` / รหัสผ่าน: `1234`

---

## 📂 โครงสร้างโปรเจกต์
- `server.js` — Backend HTTP Server & REST API (`/api/products`, `/api/orders`, `/api/cart`, `/api/messages`, `/api/dashboard`)
- `render.yaml` — ไฟล์ Blueprint สำหรับ Deploy ขึ้น Render อัตโนมัติ
- `index.html` — หน้าเว็บหลัก ONCE Single Page Application
- `css/style.css` — สไตล์มินิมอลโมโนโครม ขอบโค้งมน พร้อม Dark Mode
- `js/api.js` — ชั้น API Client เชื่อมต่อหน้าเว็บกับ REST API
- `js/app.js` — ลอจิกฝั่งหน้าบ้าน แคตตาล็อก, แชท, ตรวจสลิป, ตะกร้า Hold 15 นาที
- `database/schema.sql` — โครงสร้างฐานข้อมูล SQL
- `database/db.json` — ฐานข้อมูล JSON ที่เซิร์ฟเวอร์อ่าน/เขียนอัตโนมัติ
