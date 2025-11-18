import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter = startDate && endDate
      ? `AND created_at BETWEEN '${startDate}' AND '${endDate}'`
      : '';

    // Tổng quan từng cửa hàng
    const storesOverviewResult = await pool.query(`
      SELECT 
        s.id,
        s.code,
        s.name,
        s.address,
        s.manager_name,
        s.revenue,
        
        -- Đơn hàng từ khách
        (SELECT COUNT(*) FROM store_customer_orders WHERE store_id = s.id ${dateFilter}) as customer_orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM store_customer_orders WHERE store_id = s.id ${dateFilter}) as customer_orders_value,
        
        -- Đơn hàng sản xuất
        (SELECT COUNT(*) FROM orders WHERE store_id = s.id ${dateFilter}) as production_orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE store_id = s.id ${dateFilter}) as production_orders_value,
        
        -- Bán hàng
        (SELECT COUNT(*) FROM store_sales WHERE store_id = s.id ${dateFilter}) as sales_count,
        (SELECT COALESCE(SUM(final_amount), 0) FROM store_sales WHERE store_id = s.id ${dateFilter}) as sales_revenue,
        
        -- Tồn kho
        (SELECT COUNT(DISTINCT product_id) FROM finished_products WHERE store_id = s.id) as inventory_products,
        (SELECT COALESCE(SUM(fp.quantity), 0) FROM finished_products fp WHERE fp.store_id = s.id) as inventory_quantity,
        (SELECT COALESCE(SUM(fp.quantity * p.price), 0) 
         FROM finished_products fp 
         JOIN products p ON fp.product_id = p.id 
         WHERE fp.store_id = s.id) as inventory_value,
        
        -- Thu chi
        (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE store_id = s.id AND transaction_type = 'thu' ${dateFilter.replace('created_at', 'transaction_date')}) as income,
        (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE store_id = s.id AND transaction_type = 'chi' ${dateFilter.replace('created_at', 'transaction_date')}) as expense
        
      FROM stores s
      ORDER BY s.code
    `);

    // Top sản phẩm bán chạy theo cửa hàng
    const topProductsByStoreResult = await pool.query(`
      SELECT 
        s.code as store_code,
        s.name as store_name,
        p.code as product_code,
        p.name as product_name,
        COALESCE(SUM(ssi.quantity), 0) as total_sold,
        COALESCE(SUM(ssi.total_amount), 0) as total_revenue
      FROM stores s
      JOIN store_sales ss ON s.id = ss.store_id
      JOIN store_sale_items ssi ON ss.id = ssi.store_sale_id
      JOIN products p ON ssi.product_id = p.id
      WHERE 1=1 ${dateFilter.replace('created_at', 'ss.created_at')}
      GROUP BY s.id, s.code, s.name, p.id, p.code, p.name
      ORDER BY s.code, total_revenue DESC
    `);

    // Khách hàng theo cửa hàng
    const customersByStoreResult = await pool.query(`
      SELECT 
        s.code as store_code,
        s.name as store_name,
        COUNT(DISTINCT c.id) as customer_count,
        COALESCE(SUM(c.debt), 0) as total_debt
      FROM stores s
      LEFT JOIN customers c ON s.id = c.store_id
      GROUP BY s.id, s.code, s.name
      ORDER BY s.code
    `);

    return NextResponse.json({
      success: true,
      data: {
        storesOverview: storesOverviewResult.rows,
        topProductsByStore: topProductsByStoreResult.rows,
        customersByStore: customersByStoreResult.rows,
      },
    });
  } catch (error: any) {
    console.error('Error fetching stores report:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tải báo cáo cửa hàng' },
      { status: 500 }
    );
  }
}
