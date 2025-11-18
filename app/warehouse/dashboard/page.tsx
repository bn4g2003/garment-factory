'use client';

export default function WarehouseDashboardPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard - Kho</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Đơn chờ xuất NVL</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">0</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Mã NVL tồn thấp</div>
          <div className="text-3xl font-bold text-red-600 mt-2">0</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Yêu cầu nhập kho</div>
          <div className="text-3xl font-bold text-yellow-600 mt-2">0</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Thao tác nhanh</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border p-4 rounded text-center">📦<div className="font-semibold mt-2">Xuất NVL</div></div>
          <div className="border p-4 rounded text-center">📥<div className="font-semibold mt-2">Nhập NVL</div></div>
          <div className="border p-4 rounded text-center">📋<div className="font-semibold mt-2">Kiểm kê</div></div>
          <div className="border p-4 rounded text-center">📤<div className="font-semibold mt-2">Xuất TP</div></div>
        </div>
      </div>
    </main>
  );
}


