import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// Lấy danh sách phiếu xuất thành phẩm
export async function GET() {
  try {
    const result = await pool.query(
      `SELECT pe.*, 
              o.order_code,
              s.name as store_name,
              u.full_name as exported_by_name,
              (SELECT COUNT(*) FROM product_export_items WHERE product_export_id = pe.id) as item_count
       FROM product_exports pe
       LEFT JOIN orders o ON pe.order_id = o.id
       LEFT JOIN stores s ON pe.store_id = s.id
       LEFT JOIN users u ON pe.exported_by = u.id
       ORDER BY pe.created_at DESC`
    );

    return NextResponse.json({
      success: true,
      exports: result.rows,
    });
  } catch (error) {
    console.error('Error fetching product exports:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy danh sách phiếu xuất' },
      { status: 500 }
    );
  }
}

// Tạo phiếu xuất thành phẩm
export async function POST(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const body = await request.json();
    const { order_id, store_id, export_type, items, exported_by } = body;

    if (!order_id || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ thông tin' },
        { status: 400 }
      );
    }

    // Tạo mã phiếu xuất
    const export_code = `XTP${Date.now().toString().slice(-8)}`;

    // Tính tổng tiền
    let total_amount = 0;
    for (const item of items) {
      total_amount += item.quantity * item.unit_price;
    }

    // Tạo phiếu xuất
    const exportResult = await client.query(
      `INSERT INTO product_exports (export_code, order_id, store_id, export_type, total_amount, exported_by, export_date, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [export_code, order_id, store_id || null, export_type, total_amount, exported_by]
    );

    const productExport = exportResult.rows[0];

    // Thêm chi tiết xuất kho và trừ tồn kho
    for (const item of items) {
      // Thêm chi tiết
      await client.query(
        `INSERT INTO product_export_items (product_export_id, product_id, quantity, unit_price, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [productExport.id, item.product_id, item.quantity, item.unit_price]
      );

      // Trừ tồn kho thành phẩm (gộp theo product_id)
      await client.query(
        `UPDATE finished_products 
         SET quantity = quantity - $1, updated_at = NOW()
         WHERE product_id = $2 AND store_id IS NULL`,
        [item.quantity, item.product_id]
      );
    }

    // Cập nhật trạng thái đơn hàng sang shipped (đã xuất kho)
    await client.query(
      `UPDATE orders SET status = 'shipped', updated_at = NOW() WHERE id = $1`,
      [order_id]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      export: productExport,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error creating product export:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tạo phiếu xuất' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
