import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const history = searchParams.get('history') === 'true';

    // Lấy lịch sử (đã hoàn thành) hoặc đang sản xuất
    const whereClause = history 
      ? "WHERE o.status IN ('completed', 'cancelled')"
      : "WHERE o.status IN ('confirmed', 'in_production')";

    const result = await pool.query(
      `SELECT 
        o.id as order_id,
        o.order_code,
        o.customer_id,
        c.name as customer_name,
        c.code as customer_code,
        o.total_amount,
        o.status as order_status,
        o.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pp.id,
              'process_code', pp.process_code,
              'process_name', pp.process_name,
              'status', pp.status,
              'start_time', pp.start_time,
              'end_time', pp.end_time,
              'assigned_to', pp.assigned_to
            ) ORDER BY pp.created_at
          ) FILTER (WHERE pp.id IS NOT NULL),
          '[]'
        ) as processes
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       LEFT JOIN production_process pp ON o.id = pp.order_id
       ${whereClause}
       GROUP BY o.id, c.name, c.code
       ORDER BY o.created_at DESC`
    );

    return NextResponse.json({
      success: true,
      orders: result.rows,
    });
  } catch (error) {
    console.error('Error fetching production:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy danh sách sản xuất' },
      { status: 500 }
    );
  }
}
