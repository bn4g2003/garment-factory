import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT o.*, 
              c.name as customer_name, c.code as customer_code,
              u.full_name as created_by_name,
              (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       LEFT JOIN users u ON o.created_by = u.id
       ORDER BY o.created_at DESC`
    );

    return NextResponse.json({
      success: true,
      orders: result.rows,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy danh sách đơn hàng' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const body = await request.json();
    const { order_code, customer_id, order_type, items, created_by } = body;

    if (!order_code || !customer_id || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ thông tin đơn hàng' },
        { status: 400 }
      );
    }

    // Tính tổng tiền
    let total_amount = 0;
    for (const item of items) {
      total_amount += item.quantity * item.price;
    }

    // Tạo đơn hàng với status 'pending' - chờ xác nhận
    const orderResult = await client.query(
      `INSERT INTO orders (order_code, customer_id, order_type, total_amount, debt_amount, status, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $4, 'pending', $5, NOW(), NOW())
       RETURNING *`,
      [order_code, customer_id, order_type, total_amount, created_by]
    );

    const order = orderResult.rows[0];

    // Thêm chi tiết đơn hàng
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [order.id, item.product_id, item.quantity, item.price]
      );
    }

    // Tạo 4 công đoạn sản xuất
    const processes = [
      { code: 'CUT', name: 'Cắt' },
      { code: 'SEW', name: 'May' },
      { code: 'FINISH', name: 'Hoàn thiện' },
      { code: 'QC', name: 'Kiểm tra' },
    ];

    for (const process of processes) {
      await client.query(
        `INSERT INTO production_process (order_id, process_code, process_name, status, created_at)
         VALUES ($1, $2, $3, 'pending', NOW())`,
        [order.id, process.code, process.name]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      order: order,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);

    if (error.code === '23505') {
      return NextResponse.json({ error: 'Mã đơn hàng đã tồn tại' }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tạo đơn hàng' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
