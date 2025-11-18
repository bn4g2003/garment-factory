'use client';

export default function ProductionDashboardPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard - Sản xuất</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Công đoạn chờ</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">0</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Công đoạn đang làm</div>
          <div className="text-3xl font-bold text-yellow-600 mt-2">0</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Hoàn thành hôm nay</div>
          <div className="text-3xl font-bold text-green-600 mt-2">0</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Công việc của tôi</h2>
        <p className="text-sm text-gray-500">Danh sách các công đoạn được gán sẽ hiển thị tại đây.</p>
      </div>
    </main>
  );
}


