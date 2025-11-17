'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface MaterialExport {
  id: string;
  export_code: string;
  order_code: string;
  export_type: string;
  total_amount: number;
  exported_by_name: string;
  export_date: string;
  item_count: number;
}

export default function MaterialExportsPage() {
  const [exports, setExports] = useState<MaterialExport[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/material-exports');
      const data = await res.json();

      if (data.success) setExports(data.exports);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-900">Đang tải...</div>
      </div>
    );
  }

  return (
    <main className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Lịch sử xuất kho NVL</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã phiếu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đơn hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số NVL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người xuất</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày xuất</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {exports.map((exp) => (
                <tr key={exp.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {exp.export_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {exp.order_code || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {exp.export_type === 'production' ? 'Xuất sản xuất' : exp.export_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exp.item_count}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {exp.total_amount.toLocaleString()}đ
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {exp.exported_by_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(exp.export_date).toLocaleString('vi-VN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {exports.length === 0 && (
          <div className="text-center py-8 text-gray-500">Chưa có phiếu xuất nào</div>
        )}
      </div>

      <div className="text-center">
        <Link href="/admin/warehouse/materials" className="text-blue-600 hover:text-blue-900">
          ← Quay lại kho NVL
        </Link>
      </div>
    </main>
  );
}
