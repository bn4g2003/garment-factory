import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body; // 'waiting_material' | 'confirmed' | 'cancelled' | 'in_production' | 'completed'

    const validStatuses = ['waiting_material', 'confirmed', 'cancelled', 'in_production', 'completed'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Trạng thái không hợp lệ' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE orders 
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi cập nhật trạng thái' },
      { status: 500 }
    );
  }
}
