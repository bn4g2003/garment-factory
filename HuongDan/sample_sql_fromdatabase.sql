-- Bảng Nhà cung cấp
CREATE TABLE suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    tax_code VARCHAR(50),
    debt DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Nguyên vật liệu
CREATE TABLE materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    supplier_id UUID REFERENCES suppliers(id),
    current_stock DECIMAL(10,2) DEFAULT 0,
    min_stock DECIMAL(10,2) DEFAULT 0,
    price DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Khách hàng
CREATE TABLE customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    tax_code VARCHAR(50),
    debt DECIMAL(15,2) DEFAULT 0,
    store_id UUID, -- NULL nếu là KH trực tiếp của công ty
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Cửa hàng
CREATE TABLE stores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    manager_name VARCHAR(255),
    revenue DECIMAL(15,2) DEFAULT 0,
    is_franchise BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Nhân viên/User
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Lưu trực tiếp, không mã hóa
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL, -- admin, factory_manager, store_manager, staff, etc.
    store_id UUID REFERENCES stores(id), -- NULL nếu là nhân viên xưởng
    department VARCHAR(100), -- Cắt, May, Hoàn thiện, etc.
    salary DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Mã hàng/Sản phẩm
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(15,2) DEFAULT 0,
    cost DECIMAL(15,2) DEFAULT 0,
    product_type VARCHAR(50), -- sỉ, lẻ, gia công
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Định mức nguyên vật liệu
CREATE TABLE material_standards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id) NOT NULL,
    material_id UUID REFERENCES materials(id) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(product_id, material_id)
);

-- Bảng Đơn hàng
CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_code VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    store_id UUID REFERENCES stores(id),
    order_type VARCHAR(50) NOT NULL, -- sỉ, lẻ, gia công
    total_amount DECIMAL(15,2) DEFAULT 0,
    debt_amount DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, in_production, completed, cancelled
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Chi tiết đơn hàng
CREATE TABLE order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) NOT NULL,
    product_id UUID REFERENCES products(id) NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) GENERATED ALWAYS AS (quantity * price) STORED,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Quy trình sản xuất
CREATE TABLE production_process (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) NOT NULL,
    process_code VARCHAR(50) NOT NULL, -- CUT, SEW, FINISH, QC
    process_name VARCHAR(100) NOT NULL, -- Cắt, May, Hoàn thiện, Kiểm tra
    assigned_to UUID REFERENCES users(id),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed
    qr_code TEXT, -- Mã QR để quét
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Xuất kho NVL
CREATE TABLE material_exports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    export_code VARCHAR(50) UNIQUE NOT NULL,
    order_id UUID REFERENCES orders(id),
    export_type VARCHAR(50) NOT NULL, -- production, return, etc.
    total_amount DECIMAL(15,2) DEFAULT 0,
    exported_by UUID REFERENCES users(id),
    export_date TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Chi tiết xuất kho NVL
CREATE TABLE material_export_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    material_export_id UUID REFERENCES material_exports(id) NOT NULL,
    material_id UUID REFERENCES materials(id) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Nhập kho NVL
CREATE TABLE material_imports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    import_code VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id),
    import_type VARCHAR(50) NOT NULL, -- purchase, return, etc.
    total_amount DECIMAL(15,2) DEFAULT 0,
    imported_by UUID REFERENCES users(id),
    import_date TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Chi tiết nhập kho NVL
CREATE TABLE material_import_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    material_import_id UUID REFERENCES material_imports(id) NOT NULL,
    material_id UUID REFERENCES materials(id) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Kho thành phẩm
CREATE TABLE finished_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id) NOT NULL,
    quantity INTEGER NOT NULL,
    store_id UUID REFERENCES stores(id), -- NULL nếu ở kho xưởng
    location VARCHAR(100),
    batch_code VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Xuất thành phẩm
CREATE TABLE product_exports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    export_code VARCHAR(50) UNIQUE NOT NULL,
    order_id UUID REFERENCES orders(id),
    store_id UUID REFERENCES stores(id), -- Xuất cho cửa hàng nào
    export_type VARCHAR(50) NOT NULL, -- to_store, direct_sale
    total_amount DECIMAL(15,2) DEFAULT 0,
    exported_by UUID REFERENCES users(id),
    export_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Chi tiết xuất thành phẩm
CREATE TABLE product_export_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_export_id UUID REFERENCES product_exports(id) NOT NULL,
    product_id UUID REFERENCES products(id) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Chấm công
CREATE TABLE timekeeping (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    work_date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    total_hours DECIMAL(4,2),
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES users(id), -- Người chấm công
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Thu chi
CREATE TABLE transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_code VARCHAR(50) UNIQUE NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- thu, chi
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50), -- cash, bank, card
    description TEXT,
    store_id UUID REFERENCES stores(id), -- NULL nếu là thu chi xưởng
    created_by UUID REFERENCES users(id),
    transaction_date TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Đề xuất thu chi
CREATE TABLE payment_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_code VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    request_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    request_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);