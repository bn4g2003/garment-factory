import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// Lấy danh sách phiếu nhập NVL
export async function GET() {
  try {
    const result = await pool.query(
      `SELECT mi.*, 
              s.name as supplier_name,
              u.full_name as imported_by_name,
              (SELECT COUNT(*) FROM material_import_items WHERE material_import_id = mi.id) as item_count
       FROM material_imports mi
       LEFT JOIN suppliers s ON mi.supplier_id = s.id
       LEFT JOIN users u ON mi.imported_by = u.id
       ORDER BY mi.created_at DESC`
    );

    return NextResponse.json({
      success: true,
      imports: result.rows,
    });
  } catch (error) {
    console.error('Error fetching material imports:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy danh sách phiếu nhập' },
      { status: 500 }
    );
  }
}

// Tạo phiếu nhập NVL
export async function POST(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const body = await request.json();
    const { supplier_id, import_type, items, imported_by } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ thông tin' },
        { status: 400 }
      );
    }

    // Tạo mã phiếu nhập
    const import_code = `NK${Date.now().toString().slice(-8)}`;

    // Tính tổng tiền
    let total_amount = 0;
    for (const item of items) {
      total_amount += item.quantity * item.unit_price;
    }

    // Tạo phiếu nhập
    const importResult = await client.query(
      `INSERT INTO material_imports (import_code, supplier_id, import_type, total_amount, imported_by, import_date, status, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), 'completed', NOW())
       RETURNING *`,
      [import_code, supplier_id || null, import_type, total_amount, imported_by]
    );

    const materialImport = importResult.rows[0];

    // Thêm chi tiết nhập kho và cộng tồn kho
    for (const item of items) {
      // Thêm chi tiết
      await client.query(
        `INSERT INTO material_import_items (material_import_id, material_id, quantity, unit_price, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [materialImport.id, item.material_id, item.quantity, item.unit_price]
      );

      // Cộng tồn kho
      await client.query(
        `UPDATE materials 
         SET current_stock = current_stock + $1
         WHERE id = $2`,
        [item.quantity, item.material_id]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      import: materialImport,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error creating material import:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tạo phiếu nhập' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
