import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// Lấy danh sách kho thành phẩm (CHỈ KHO XƯỞNG - store_id IS NULL)
export async function GET() {
  try {
    const result = await pool.query(
      `SELECT fp.*, 
              p.code as product_code,
              p.name as product_name,
              p.price as product_price
       FROM finished_products fp
       JOIN products p ON fp.product_id = p.id
       WHERE fp.store_id IS NULL
       ORDER BY fp.created_at DESC`
    );

    return NextResponse.json({
      success: true,
      products: result.rows,
    });
  } catch (error) {
    console.error('Error fetching finished products:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy danh sách thành phẩm' },
      { status: 500 }
    );
  }
}

// Nhập kho thành phẩm (từ sản xuất hoàn thành)
export async function POST(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const body = await request.json();
    const { order_id, items } = body;

    if (!order_id || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ thông tin' },
        { status: 400 }
      );
    }

    // Lấy thông tin đơn hàng
    const orderResult = await client.query(
      `SELECT order_code FROM orders WHERE id = $1`,
      [order_id]
    );

    if (orderResult.rows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    const batch_code = orderResult.rows[0].order_code;

    // Nhập kho từng sản phẩm (gộp theo product_id, không theo batch_code)
    for (const item of items) {
      // Kiểm tra xem sản phẩm đã có trong kho chưa (chỉ theo product_id)
      const existingResult = await client.query(
        `SELECT id, quantity FROM finished_products 
         WHERE product_id = $1 AND store_id IS NULL`,
        [item.product_id]
      );

      if (existingResult.rows.length > 0) {
        // Cộng dồn số lượng vào sản phẩm đã có
        await client.query(
          `UPDATE finished_products 
           SET quantity = quantity + $1, updated_at = NOW()
           WHERE id = $2`,
          [item.quantity, existingResult.rows[0].id]
        );
      } else {
        // Tạo mới nếu chưa có sản phẩm này trong kho
        await client.query(
          `INSERT INTO finished_products (product_id, quantity, store_id, location, batch_code, created_at, updated_at)
           VALUES ($1, $2, NULL, 'Kho xưởng', $3, NOW(), NOW())`,
          [item.product_id, item.quantity, batch_code]
        );
      }
    }

    // Cập nhật trạng thái đơn hàng sang completed
    await client.query(
      `UPDATE orders SET status = 'completed', updated_at = NOW() WHERE id = $1`,
      [order_id]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Nhập kho thành phẩm thành công',
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error importing finished products:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi nhập kho thành phẩm' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
