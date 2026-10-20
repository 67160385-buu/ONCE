-- ONCE — 1-of-1 Vintage & Archive Apparel Store
-- ฐานข้อมูลสำหรับสินค้ามือสองชิ้นเดียวในโลก (ขายแล้วขายเลย)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,            -- ของจริงต้องเก็บเป็น hash (bcrypt)
  role ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  phone VARCHAR(20),
  address TEXT
);

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  category VARCHAR(100),
  size ENUM('S','M','L','XL') NOT NULL,
  clothing_condition VARCHAR(100),           -- เช่น 9/10 Vintage, 9.5/10 Pristine
  price DECIMAL(10,2) NOT NULL,
  color VARCHAR(20) DEFAULT '#141414',
  is_sold BOOLEAN NOT NULL DEFAULT FALSE,    -- โมเดล 1-of-1: มีตัวเดียว ขายแล้วขายเลย
  stock_quantity INT NOT NULL DEFAULT 1,     -- 1 หรือ 0 ตามสถานะการขาย
  image_url VARCHAR(500)
);

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('Pending','Paid','Shipped','Cancelled') NOT NULL DEFAULT 'Pending',
  payment_method VARCHAR(50) NOT NULL DEFAULT 'PromptPay QR',
  phone VARCHAR(20),
  slip_url TEXT,
  shipping_address TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,           -- 1-of-1: ชิ้นเดียวต่อรายการ
  price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Mock data สำหรับร้าน ONCE
INSERT INTO users (name,email,password,role,phone,address) VALUES
('Admin','admin@shop.com','admin123','admin','080-000-0000',''),
('ลูกค้าตัวอย่าง','user@shop.com','1234','customer','081-234-5678','99 ถ.สุขุมวิท กรุงเทพฯ 10110');

INSERT INTO products (title,brand,category,size,clothing_condition,price,color,is_sold,stock_quantity) VALUES
('Vintage Carhartt Detroit Work Jacket','Carhartt','แจ็คเก็ต','L','9/10 Vintage',1890,'#8a5a2b',FALSE,1),
('Nike Center Mini Swoosh Tee 90s','Nike','เสื้อยืด','M','9.5/10 Pristine',690,'#2b4a8a',FALSE,1),
('Champion Reverse Weave Heavy Hoodie','Champion','ฮู้ดดี้','XL','8.5/10 Archive',1350,'#525252',FALSE,1),
('Stüssy 8-Ball Fade Tee 00s','Stüssy','เสื้อยืด','L','8/10 Vintage Faded',850,'#1a1a1a',FALSE,1),
('Levi''s Type 3 Washed Denim Jacket','Levi''s','แจ็คเก็ต','M','9/10 Washed Indigo',1590,'#3d6fa8',FALSE,1),
('Adidas Trefoil 90s Track Jacket','Adidas','แจ็คเก็ต','S','9/10 Archive Classic',1090,'#962b2b',FALSE,1);
