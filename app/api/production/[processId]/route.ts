import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ processId: string }> }
) {
  try {
    const { processId } = await params;
    const body = await request.json();
    const { action, user_id } = body; // action: 'start' | 'complete'

    if (action === 'start') {
      // Bắt đầu công đoạn
      const result = await pool.query(
        `UPDATE production_process 
         SET status = 'in_progress', start_time = NOW(), assigned_to = $1
         WHERE id = $2
         RETURNING *`,
        [user_id, processId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Không tìm thấy công đoạn' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        process: result.rows[0],
      });
    } else if (action === 'complete') {
      // Hoàn thành công đoạn
      const result = await pool.query(
        `UPDATE production_process 
         SET status = 'completed', end_time = NOW()
         WHERE id = $1
         RETURNING *`,
        [processId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Không tìm thấy công đoạn' }, { status: 404 });
      }

      const process = result.rows[0];

      // Kiểm tra xem tất cả công đoạn đã hoàn thành chưa
      const allProcesses = await pool.query(
        `SELECT status FROM production_process WHERE order_id = $1`,
        [process.order_id]
      );

      const allCompleted = allProcesses.rows.every((p) => p.status === 'completed');

      if (allCompleted) {
        // Hoàn thành TẤT CẢ công đoạn → Chuyển sang in_production (chờ nhập kho TP)
        await pool.query(
          `UPDATE orders SET status = 'in_production', updated_at = NOW() WHERE id = $1`,
          [process.order_id]
        );
      }
      // Nếu chưa hoàn thành hết → Giữ nguyên trạng thái confirmed (đang sản xuất)

      return NextResponse.json({
        success: true,
        process: result.rows[0],
        order_completed: allCompleted,
      });
    }

    return NextResponse.json({ error: 'Action không hợp lệ' }, { status: 400 });
  } catch (error) {
    console.error('Error updating process:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi cập nhật công đoạn' },
      { status: 500 }
    );
  }
}
