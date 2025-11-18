import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter = startDate && endDate
      ? `AND o.created_at BETWEEN '${startDate}' AND '${endDate}'`
      : '';

    // Tổng quan sản xuất
    const productionOverviewResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'in_production') as in_production,
        COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'completed') as completed,
        COALESCE(SUM(oi.quantity), 0) as total_products_ordered,
        COALESCE(SUM(oi.quantity) FILTER (WHERE o.status = 'completed'), 0) as total_products_completed
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE 1=1 ${dateFilter}
    `);

    // Tiến độ theo công đoạn
    const processStatusResult = await pool.query(`
      SELECT 
        pp.process_name,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE pp.status = 'pending') as pending,
        COUNT(*) FILTER (WHERE pp.status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE pp.status = 'completed') as completed
      FROM production_process pp
      JOIN orders o ON pp.order_id = o.id
      WHERE 1=1 ${dateFilter}
      GROUP BY pp.process_name, pp.process_code
      ORDER BY pp.process_code
    `);

    // Top sản phẩm sản xuất
    const topProductsResult = await pool.query(`
      SELECT 
        p.code,
        p.name,
        COALESCE(SUM(oi.quantity), 0) as total_quantity,
        COUNT(DISTINCT o.id) as order_count
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('in_production', 'completed') ${dateFilter}
      GROUP BY p.id, p.code, p.name
      ORDER BY total_quantity DESC
      LIMIT 10
    `);

    // Hiệu suất theo ngày
    const dailyProductionResult = await pool.query(`
      SELECT 
        TO_CHAR(o.created_at, 'YYYY-MM-DD') as date,
        COUNT(DISTINCT o.id) as orders_created,
        COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'completed') as orders_completed,
        COALESCE(SUM(oi.quantity), 0) as products_ordered
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE 1=1 ${dateFilter}
      GROUP BY date
      ORDER BY date DESC
      LIMIT 30
    `);

    return NextResponse.json({
      success: true,
      data: {
        overview: productionOverviewResult.rows[0],
        processByStatus: processStatusResult.rows,
        topProducts: topProductsResult.rows,
        dailyProduction: dailyProductionResult.rows,
      },
    });
  } catch (error: any) {
    console.error('Error fetching production report:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tải báo cáo sản xuất' },
      { status: 500 }
    );
  }
}
