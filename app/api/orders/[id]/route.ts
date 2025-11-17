import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Lấy thông tin đơn hàng
    const orderResult = await pool.query(
      `SELECT o.*, 
              c.name as customer_name, c.code as customer_code, c.phone as customer_phone,
              u.full_name as created_by_name
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       LEFT JOIN users u ON o.created_by = u.id
       WHERE o.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    // Lấy chi tiết sản phẩm
    const itemsResult = await pool.query(
      `SELECT oi.*, p.code as product_code, p.name as product_name
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [id]
    );

    // Lấy tiến độ sản xuất
    const processResult = await pool.query(
      `SELECT * FROM production_process 
       WHERE order_id = $1 
       ORDER BY created_at`,
      [id]
    );

    return NextResponse.json({
      success: true,
      order: orderResult.rows[0],
      items: itemsResult.rows,
      processes: processResult.rows,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy thông tin đơn hàng' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect();
  
  try {
    const { id } = await params;
    const body = await request.json();
    const { customer_id, order_type, items } = body;

    if (!customer_id || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ thông tin đơn hàng' },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    // Tính tổng tiền
    let total_amount = 0;
    for (const item of items) {
      total_amount += item.quantity * item.price;
    }

    // Cập nhật đơn hàng
    const orderResult = await client.query(
      `UPDATE orders 
       SET customer_id = $1, order_type = $2, total_amount = $3, debt_amount = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [customer_id, order_type, total_amount, id]
    );

    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    // Xóa order_items cũ
    await client.query('DELETE FROM order_items WHERE order_id = $1', [id]);

    // Thêm order_items mới
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [id, item.product_id, item.quantity, item.price]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      order: orderResult.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi cập nhật đơn hàng' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect();
  
  try {
    const { id } = await params;

    await client.query('BEGIN');

    // Xóa production_process trước
    await client.query('DELETE FROM production_process WHERE order_id = $1', [id]);

    // Xóa order_items
    await client.query('DELETE FROM order_items WHERE order_id = $1', [id]);

    // Xóa order
    const result = await client.query('DELETE FROM orders WHERE id = $1 RETURNING order_code', [id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Xóa đơn hàng thành công',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi xóa đơn hàng' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
