'use client';

import Link from 'next/link';

export default function FactoryDashboardPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard - Quản lý Xưởng</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Đơn hàng đang xử lý</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">0</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">NVL thiếu</div>
          <div className="text-3xl font-bold text-red-600 mt-2">0</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Tiến độ trung bình</div>
          <div className="text-3xl font-bold text-green-600 mt-2">0%</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Thao tác nhanh</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/factory/orders" className="border p-4 rounded hover:border-blue-500 text-center">
            📝<div className="font-semibold mt-2">Đơn hàng</div>
          </Link>
          <Link href="/factory/materials" className="border p-4 rounded hover:border-blue-500 text-center">
            📦<div className="font-semibold mt-2">Kho NVL</div>
          </Link>
          <Link href="/factory/production" className="border p-4 rounded hover:border-blue-500 text-center">
            ⚙️<div className="font-semibold mt-2">Sản xuất</div>
          </Link>
          <Link href="/factory/warehouse" className="border p-4 rounded hover:border-blue-500 text-center">
            📤<div className="font-semibold mt-2">Kho TP</div>
          </Link>
        </div>
      </div>
    </main>
  );
}


