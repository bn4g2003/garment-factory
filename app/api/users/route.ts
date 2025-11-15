import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// Lấy danh sách người dùng
export async function GET() {
  try {
    const result = await pool.query(
      'SELECT id, username, full_name, email, phone, role, department, status, created_at FROM users ORDER BY created_at DESC'
    );

    return NextResponse.json({
      success: true,
      users: result.rows,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy danh sách người dùng' },
      { status: 500 }
    );
  }
}

// Thêm người dùng mới
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, full_name, email, phone, role, department, status } = body;

    if (!username || !password || !full_name || !role) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ thông tin bắt buộc' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO users (username, password, full_name, email, phone, role, department, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id, username, full_name, email, phone, role, department, status`,
      [username, password, full_name, email, phone, role, department, status || 'active']
    );

    return NextResponse.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Tên đăng nhập đã tồn tại' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tạo người dùng' },
      { status: 500 }
    );
  }
}
