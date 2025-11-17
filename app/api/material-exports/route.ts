import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// Lấy danh sách phiếu xuất NVL
export async function GET() {
  try {
    const result = await pool.query(
      `SELECT me.*, 
              o.order_code,
              u.full_name as exported_by_name,
              (SELECT COUNT(*) FROM material_export_items WHERE material_export_id = me.id) as item_count
       FROM material_exports me
       LEFT JOIN orders o ON me.order_id = o.id
       LEFT JOIN users u ON me.exported_by = u.id
       ORDER BY me.created_at DESC`
    );

    return NextResponse.json({
      success: true,
      exports: result.rows,
    });
  } catch (error) {
    console.error('Error fetching material exports:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy danh sách phiếu xuất' },
      { status: 500 }
    );
  }
}

// Tạo phiếu xuất NVL
export async function POST(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const body = await request.json();
    const { order_id, export_type, items, exported_by } = body;

    if (!order_id || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ thông tin' },
        { status: 400 }
      );
    }

    // Tạo mã phiếu xuất
    const export_code = `XK${Date.now().toString().slice(-8)}`;

    // Tính tổng tiền
    let total_amount = 0;
    for (const item of items) {
      total_amount += item.quantity * item.unit_price;
    }

    // Tạo phiếu xuất
    const exportResult = await client.query(
      `INSERT INTO material_exports (export_code, order_id, export_type, total_amount, exported_by, export_date, status, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), 'completed', NOW())
       RETURNING *`,
      [export_code, order_id, export_type, total_amount, exported_by]
    );

    const materialExport = exportResult.rows[0];

    // Thêm chi tiết xuất kho và trừ tồn kho
    for (const item of items) {
      // Thêm chi tiết
      await client.query(
        `INSERT INTO material_export_items (material_export_id, material_id, quantity, unit_price, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [materialExport.id, item.material_id, item.quantity, item.unit_price]
      );

      // Trừ tồn kho
      await client.query(
        `UPDATE materials 
         SET current_stock = current_stock - $1
         WHERE id = $2`,
        [item.quantity, item.material_id]
      );
    }

    // Cập nhật trạng thái đơn hàng sang confirmed
    await client.query(
      `UPDATE orders SET status = 'confirmed', updated_at = NOW() WHERE id = $1`,
      [order_id]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      export: materialExport,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error creating material export:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tạo phiếu xuất' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
