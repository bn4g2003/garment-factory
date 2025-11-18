import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy') || 'day'; // day, week, month, year

    let dateFormat = 'YYYY-MM-DD';
    if (groupBy === 'week') dateFormat = 'IYYY-IW';
    if (groupBy === 'month') dateFormat = 'YYYY-MM';
    if (groupBy === 'year') dateFormat = 'YYYY';

    const dateFilter = startDate && endDate
      ? `AND created_at BETWEEN '${startDate}' AND '${endDate}'`
      : '';

    // Doanh thu theo thời gian
    const revenueResult = await pool.query(`
      SELECT 
        TO_CHAR(created_at, '${dateFormat}') as period,
        COUNT(*) as order_count,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(debt_amount), 0) as total_debt,
        COALESCE(SUM(total_amount - debt_amount), 0) as paid_amount
      FROM orders
      WHERE status IN ('completed', 'shipped') ${dateFilter}
      GROUP BY period
      ORDER BY period DESC
      LIMIT 30
    `);

    // Doanh thu theo loại đơn hàng
    const revenueByTypeResult = await pool.query(`
      SELECT 
        order_type,
        COUNT(*) as order_count,
        COALESCE(SUM(total_amount), 0) as total_revenue
      FROM orders
      WHERE status IN ('completed', 'shipped') ${dateFilter}
      GROUP BY order_type
      ORDER BY total_revenue DESC
    `);

    // Top khách hàng
    const topCustomersResult = await pool.query(`
      SELECT 
        c.code,
        c.name,
        COUNT(o.id) as order_count,
        COALESCE(SUM(o.total_amount), 0) as total_revenue
      FROM customers c
      JOIN orders o ON c.id = o.customer_id
      WHERE o.status IN ('completed', 'shipped') ${dateFilter}
      GROUP BY c.id, c.code, c.name
      ORDER BY total_revenue DESC
      LIMIT 10
    `);

    return NextResponse.json({
      success: true,
      data: {
        revenueByPeriod: revenueResult.rows,
        revenueByType: revenueByTypeResult.rows,
        topCustomers: topCustomersResult.rows,
      },
    });
  } catch (error: any) {
    console.error('Error fetching revenue report:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tải báo cáo doanh thu' },
      { status: 500 }
    );
  }
}
