import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(request: NextRequest) {
  try {
    // Tồn kho NVL
    const materialsResult = await pool.query(`
      SELECT 
        m.code,
        m.name,
        m.unit,
        m.current_stock,
        m.min_stock,
        m.price,
        m.current_stock * m.price as stock_value,
        CASE 
          WHEN m.current_stock <= m.min_stock THEN 'low'
          WHEN m.current_stock <= m.min_stock * 1.5 THEN 'medium'
          ELSE 'good'
        END as stock_status,
        s.name as supplier_name
      FROM materials m
      LEFT JOIN suppliers s ON m.supplier_id = s.id
      WHERE m.status = 'active'
      ORDER BY 
        CASE 
          WHEN m.current_stock <= m.min_stock THEN 1
          WHEN m.current_stock <= m.min_stock * 1.5 THEN 2
          ELSE 3
        END,
        m.code
    `);

    // Tồn kho thành phẩm xưởng
    const factoryInventoryResult = await pool.query(`
      SELECT 
        p.code,
        p.name,
        COALESCE(SUM(fp.quantity), 0) as quantity,
        p.price,
        COALESCE(SUM(fp.quantity), 0) * p.price as stock_value
      FROM products p
      LEFT JOIN finished_products fp ON p.id = fp.product_id AND fp.store_id IS NULL
      WHERE p.status = 'active'
      GROUP BY p.id, p.code, p.name, p.price
      HAVING COALESCE(SUM(fp.quantity), 0) > 0
      ORDER BY stock_value DESC
    `);

    // Tồn kho theo cửa hàng
    const storeInventoryResult = await pool.query(`
      SELECT 
        s.code as store_code,
        s.name as store_name,
        COUNT(DISTINCT fp.product_id) as product_count,
        COALESCE(SUM(fp.quantity), 0) as total_quantity,
        COALESCE(SUM(fp.quantity * p.price), 0) as total_value
      FROM stores s
      LEFT JOIN finished_products fp ON s.id = fp.store_id
      LEFT JOIN products p ON fp.product_id = p.id
      GROUP BY s.id, s.code, s.name
      ORDER BY total_value DESC
    `);

    // Lịch sử xuất nhập NVL (30 ngày gần nhất)
    const materialMovementResult = await pool.query(`
      SELECT 
        TO_CHAR(import_date, 'YYYY-MM-DD') as date,
        'import' as type,
        COUNT(*) as transaction_count,
        COALESCE(SUM(total_amount), 0) as total_amount
      FROM material_imports
      WHERE import_date >= NOW() - INTERVAL '30 days'
      GROUP BY date
      
      UNION ALL
      
      SELECT 
        TO_CHAR(export_date, 'YYYY-MM-DD') as date,
        'export' as type,
        COUNT(*) as transaction_count,
        COALESCE(SUM(total_amount), 0) as total_amount
      FROM material_exports
      WHERE export_date >= NOW() - INTERVAL '30 days'
      GROUP BY date
      
      ORDER BY date DESC
    `);

    // Tổng giá trị tồn kho
    const totalMaterialsValue = materialsResult.rows.reduce(
      (sum, item) => sum + parseFloat(item.stock_value || 0),
      0
    );
    const totalFactoryValue = factoryInventoryResult.rows.reduce(
      (sum, item) => sum + parseFloat(item.stock_value || 0),
      0
    );
    const totalStoreValue = storeInventoryResult.rows.reduce(
      (sum, item) => sum + parseFloat(item.total_value || 0),
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        materials: materialsResult.rows,
        factoryInventory: factoryInventoryResult.rows,
        storeInventory: storeInventoryResult.rows,
        materialMovement: materialMovementResult.rows,
        summary: {
          totalMaterialsValue,
          totalFactoryValue,
          totalStoreValue,
          totalInventoryValue: totalMaterialsValue + totalFactoryValue + totalStoreValue,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching inventory report:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tải báo cáo tồn kho' },
      { status: 500 }
    );
  }
}
