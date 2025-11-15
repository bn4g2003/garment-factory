import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// Cập nhật người dùng
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { username, password, full_name, email, phone, role, department, status } = body;

    if (!full_name || !role) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ thông tin bắt buộc' },
        { status: 400 }
      );
    }

    // Nếu có password mới thì cập nhật, không thì giữ nguyên
    let query;
    let values;

    if (password) {
      query = `
        UPDATE users 
        SET password = $1, full_name = $2, email = $3, phone = $4, 
            role = $5, department = $6, status = $7, updated_at = NOW()
        WHERE id = $8
        RETURNING id, username, full_name, email, phone, role, department, status
      `;
      values = [password, full_name, email, phone, role, department, status, id];
    } else {
      query = `
        UPDATE users 
        SET full_name = $1, email = $2, phone = $3, 
            role = $4, department = $5, status = $6, updated_at = NOW()
        WHERE id = $7
        RETURNING id, username, full_name, email, phone, role, department, status
      `;
      values = [full_name, email, phone, role, department, status, id];
    }

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Không tìm thấy người dùng' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Tên đăng nhập đã tồn tại' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi cập nhật người dùng' },
      { status: 500 }
    );
  }
}

// Xóa người dùng
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING username',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Không tìm thấy người dùng' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Xóa người dùng thành công',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi xóa người dùng' },
      { status: 500 }
    );
  }
}
