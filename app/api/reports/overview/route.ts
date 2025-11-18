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

    // Tổng quan đơn hàng
    const ordersResult = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
        COUNT(*) FILTER (WHERE status = 'in_production') as in_production_orders,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(debt_amount), 0) as total_debt
      FROM orders
      WHERE 1=1 ${dateFilter}
    `);

    // Tồn kho NVL
    const materialsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_materials,
        COALESCE(SUM(current_stock * price), 0) as materials_value,
        COUNT(*) FILTER (WHERE current_stock <= min_stock) as low_stock_materials
      FROM materials
      WHERE status = 'active'
    `);

    // Tồn kho thành phẩm
    const finishedProductsResult = await pool.query(`
      SELECT 
        COALESCE(SUM(fp.quantity), 0) as total_quantity,
        COALESCE(SUM(fp.quantity * p.price), 0) as total_value
      FROM finished_products fp
      JOIN products p ON fp.product_id = p.id
      WHERE fp.store_id IS NULL
    `);

    // Tồn kho cửa hàng
    const storeInventoryResult = await pool.query(`
      SELECT 
        COALESCE(SUM(fp.quantity), 0) as total_quantity,
        COALESCE(SUM(fp.quantity * p.price), 0) as total_value
      FROM finished_products fp
      JOIN products p ON fp.product_id = p.id
      WHERE fp.store_id IS NOT NULL
    `);

    // Thu chi
    const transactionsResult = await pool.query(`
      SELECT 
        COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'thu'), 0) as total_income,
        COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'chi'), 0) as total_expense
      FROM transactions
      WHERE status = 'completed' ${dateFilter.replace('created_at', 'transaction_date')}
    `);

    return NextResponse.json({
      success: true,
      data: {
        orders: ordersResult.rows[0],
        materials: materialsResult.rows[0],
        finishedProducts: finishedProductsResult.rows[0],
        storeInventory: storeInventoryResult.rows[0],
        transactions: transactionsResult.rows[0],
      },
    });
  } catch (error: any) {
    console.error('Error fetching overview report:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tải báo cáo tổng quan' },
      { status: 500 }
    );
  }
}
