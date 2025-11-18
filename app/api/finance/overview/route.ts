import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter = startDate && endDate
      ? `AND transaction_date BETWEEN '${startDate}' AND '${endDate}'`
      : '';

    // Tổng thu chi
    const transactionSummaryResult = await pool.query(`
      SELECT 
        COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'thu'), 0) as total_income,
        COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'chi'), 0) as total_expense,
        COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'thu'), 0) - 
        COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'chi'), 0) as net_profit,
        COUNT(*) FILTER (WHERE transaction_type = 'thu') as income_count,
        COUNT(*) FILTER (WHERE transaction_type = 'chi') as expense_count
      FROM transactions
      WHERE status = 'completed' ${dateFilter}
    `);

    // Thu chi theo cửa hàng
    const storeTransactionsResult = await pool.query(`
      SELECT 
        s.code as store_code,
        s.name as store_name,
        COALESCE(SUM(t.amount) FILTER (WHERE t.transaction_type = 'thu'), 0) as income,
        COALESCE(SUM(t.amount) FILTER (WHERE t.transaction_type = 'chi'), 0) as expense,
        COALESCE(SUM(t.amount) FILTER (WHERE t.transaction_type = 'thu'), 0) - 
        COALESCE(SUM(t.amount) FILTER (WHERE t.transaction_type = 'chi'), 0) as profit
      FROM stores s
      LEFT JOIN transactions t ON s.id = t.store_id AND t.status = 'completed' ${dateFilter.replace('transaction_date', 't.transaction_date')}
      GROUP BY s.id, s.code, s.name
      ORDER BY profit DESC
    `);

    // Thu chi xưởng (store_id IS NULL)
    const factoryTransactionsResult = await pool.query(`
      SELECT 
        COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'thu'), 0) as income,
        COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'chi'), 0) as expense,
        COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'thu'), 0) - 
        COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'chi'), 0) as profit
      FROM transactions
      WHERE status = 'completed' AND store_id IS NULL ${dateFilter}
    `);

    // Thu chi theo phương thức thanh toán
    const paymentMethodResult = await pool.query(`
      SELECT 
        payment_method,
        transaction_type,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM transactions
      WHERE status = 'completed' ${dateFilter}
      GROUP BY payment_method, transaction_type
      ORDER BY total_amount DESC
    `);

    // Thu chi theo thời gian (30 ngày gần nhất)
    const dailyTransactionsResult = await pool.query(`
      SELECT 
        TO_CHAR(transaction_date, 'YYYY-MM-DD') as date,
        COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'thu'), 0) as income,
        COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'chi'), 0) as expense,
        COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'thu'), 0) - 
        COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'chi'), 0) as profit
      FROM transactions
      WHERE status = 'completed' 
        AND transaction_date >= NOW() - INTERVAL '30 days'
      GROUP BY date
      ORDER BY date DESC
    `);

    // Công nợ khách hàng
    const customerDebtResult = await pool.query(`
      SELECT 
        c.code,
        c.name,
        c.phone,
        c.debt,
        COUNT(o.id) as order_count,
        COALESCE(SUM(o.debt_amount), 0) as order_debt
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      WHERE c.debt > 0 OR o.debt_amount > 0
      GROUP BY c.id, c.code, c.name, c.phone, c.debt
      HAVING c.debt > 0 OR COALESCE(SUM(o.debt_amount), 0) > 0
      ORDER BY c.debt DESC
      LIMIT 20
    `);

    // Công nợ nhà cung cấp
    const supplierDebtResult = await pool.query(`
      SELECT 
        s.code,
        s.name,
        s.phone,
        s.debt
      FROM suppliers s
      WHERE s.debt > 0
      ORDER BY s.debt DESC
      LIMIT 20
    `);

    return NextResponse.json({
      success: true,
      data: {
        summary: transactionSummaryResult.rows[0],
        storeTransactions: storeTransactionsResult.rows,
        factoryTransactions: factoryTransactionsResult.rows[0],
        paymentMethods: paymentMethodResult.rows,
        dailyTransactions: dailyTransactionsResult.rows,
        customerDebt: customerDebtResult.rows,
        supplierDebt: supplierDebtResult.rows,
      },
    });
  } catch (error: any) {
    console.error('Error fetching finance overview:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tải tổng quan tài chính' },
      { status: 500 }
    );
  }
}
