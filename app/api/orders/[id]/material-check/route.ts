import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// Kiểm tra NVL cho đơn hàng cụ thể
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Lấy danh sách sản phẩm trong đơn hàng
    const orderItemsResult = await pool.query(
      `SELECT oi.product_id, oi.quantity, p.name as product_name
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [id]
    );

    if (orderItemsResult.rows.length === 0) {
      return NextResponse.json({ error: 'Đơn hàng không có sản phẩm' }, { status: 404 });
    }

    const materials: any = {};

    // Tính tổng NVL cần cho từng sản phẩm
    for (const item of orderItemsResult.rows) {
      const standardsResult = await pool.query(
        `SELECT ms.material_id, ms.quantity as standard_quantity, ms.unit,
                m.code as material_code, m.name as material_name, m.current_stock, m.price
         FROM material_standards ms
         JOIN materials m ON ms.material_id = m.id
         WHERE ms.product_id = $1`,
        [item.product_id]
      );

      for (const standard of standardsResult.rows) {
        const required = standard.standard_quantity * item.quantity;

        if (!materials[standard.material_id]) {
          materials[standard.material_id] = {
            material_id: standard.material_id,
            material_code: standard.material_code,
            material_name: standard.material_name,
            unit: standard.unit,
            required: 0,
            available: standard.current_stock,
            unit_price: standard.price,
          };
        }

        materials[standard.material_id].required += required;
      }
    }

    // Chuyển thành mảng và tính thiếu hụt
    const materialList = Object.values(materials).map((m: any) => ({
      ...m,
      shortage: Math.max(0, m.required - m.available),
      is_sufficient: m.available >= m.required,
    }));

    const allSufficient = materialList.every((m: any) => m.is_sufficient);

    return NextResponse.json({
      success: true,
      materials: materialList,
      all_sufficient: allSufficient,
    });
  } catch (error) {
    console.error('Error checking materials:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi kiểm tra NVL' },
      { status: 500 }
    );
  }
}
