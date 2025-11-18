import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type'); // thu, chi
    const storeId = searchParams.get('storeId');

    let filters = ['status = $1'];
    const params: any[] = ['completed'];
    let paramIndex = 2;

    if (startDate && endDate) {
      filters.push(`transaction_date BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
      params.push(startDate, endDate);
      paramIndex += 2;
    }

    if (type) {
      filters.push(`transaction_type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    if (storeId) {
      filters.push(`store_id = $${paramIndex}`);
      params.push(storeId);
      paramIndex++;
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT 
        t.*,
        s.name as store_name,
        u.full_name as created_by_name
       FROM transactions t
       LEFT JOIN stores s ON t.store_id = s.id
       LEFT JOIN users u ON t.created_by = u.id
       ${whereClause}
       ORDER BY t.transaction_date DESC
       LIMIT 100`,
      params
    );

    return NextResponse.json({
      success: true,
      transactions: result.rows,
    });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tải danh sách giao dịch' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      transaction_type,
      amount,
      payment_method,
      description,
      store_id,
      created_by,
    } = body;

    if (!transaction_type || !amount || !created_by) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ thông tin' },
        { status: 400 }
      );
    }

    const transaction_code = `${transaction_type === 'thu' ? 'THU' : 'CHI'}-${Date.now().toString().slice(-8)}`;

    const result = await pool.query(
      `INSERT INTO transactions 
       (transaction_code, transaction_type, amount, payment_method, description, store_id, created_by, transaction_date, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), 'completed', NOW())
       RETURNING *`,
      [
        transaction_code,
        transaction_type,
        amount,
        payment_method,
        description,
        store_id || null,
        created_by,
      ]
    );

    return NextResponse.json({
      success: true,
      transaction: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tạo giao dịch' },
      { status: 500 }
    );
  }
}
