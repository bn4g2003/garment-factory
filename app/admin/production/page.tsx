'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Process {
  id: string;
  process_code: string;
  process_name: string;
  status: string;
  start_time: string;
  end_time: string;
  assigned_to: string;
}

interface ProductionOrder {
  order_id: string;
  order_code: string;
  customer_name: string;
  customer_code: string;
  total_amount: number;
  order_status: string;
  created_at: string;
  processes: Process[];
}

export default function ProductionPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(userStr);
    setCurrentUser(user);
    fetchProduction();
  }, [router]);

  const fetchProduction = async () => {
    try {
      const res = await fetch('/api/production');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching production:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartProcess = async (processId: string) => {
    if (!confirm('Bắt đầu công đoạn này?')) return;

    setUpdating(processId);
    try {
      const res = await fetch(`/api/production/${processId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          user_id: currentUser.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Có lỗi xảy ra');
        return;
      }

      await fetchProduction();
    } catch (error) {
      alert('Có lỗi xảy ra khi cập nhật');
    } finally {
      setUpdating(null);
    }
  };

  const handleCompleteProcess = async (processId: string) => {
    if (!confirm('Hoàn thành công đoạn này?')) return;

    setUpdating(processId);
    try {
      const res = await fetch(`/api/production/${processId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Có lỗi xảy ra');
        return;
      }

      if (data.order_completed) {
        alert('🎉 Đơn hàng đã hoàn thành tất cả công đoạn!');
      }

      await fetchProduction();
    } catch (error) {
      alert('Có lỗi xảy ra khi cập nhật');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      pending: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
    };
    const labels: any = {
      pending: 'Chờ xử lý',
      in_progress: 'Đang thực hiện',
      completed: 'Hoàn thành',
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getProgressPercentage = (processes: Process[]) => {
    const completed = processes.filter((p) => p.status === 'completed').length;
    return Math.round((completed / processes.length) * 100);
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
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quy trình Sản xuất</h2>
        
        {orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">Không có đơn hàng nào đang sản xuất</p>
            <Link href="/admin/orders" className="text-blue-600 hover:text-blue-900">
              → Đi đến Quản lý Đơn hàng
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.order_id} className="border border-gray-200 rounded-lg p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      <Link
                        href={`/admin/orders/${order.order_id}`}
                        className="hover:text-blue-600"
                      >
                        {order.order_code}
                      </Link>
                    </h3>
                    <p className="text-sm text-gray-600">
                      {order.customer_code} - {order.customer_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Tổng tiền: <span className="font-semibold">{order.total_amount.toLocaleString()}đ</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {getProgressPercentage(order.processes)}%
                    </div>
                    <div className="text-xs text-gray-500">Tiến độ</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage(order.processes)}%` }}
                    />
                  </div>
                </div>

                {/* Processes */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {order.processes.map((process, index) => (
                    <div
                      key={process.id}
                      className={`border-2 rounded-lg p-4 ${
                        process.status === 'completed'
                          ? 'border-green-500 bg-green-50'
                          : process.status === 'in_progress'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center font-bold mr-2">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{process.process_name}</div>
                            <div className="text-xs text-gray-500">{process.process_code}</div>
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        {getStatusBadge(process.status)}
                      </div>

                      {process.start_time && (
                        <div className="text-xs text-gray-600 mb-2">
                          <div>Bắt đầu: {new Date(process.start_time).toLocaleString('vi-VN')}</div>
                          {process.end_time && (
                            <div>Kết thúc: {new Date(process.end_time).toLocaleString('vi-VN')}</div>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-3">
                        {process.status === 'pending' && (
                          <>
                            {index > 0 && order.processes[index - 1].status !== 'completed' ? (
                              <div className="text-xs text-gray-500 italic">
                                ⏳ Chờ công đoạn trước hoàn thành
                              </div>
                            ) : (
                              <button
                                onClick={() => handleStartProcess(process.id)}
                                disabled={updating === process.id}
                                className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 text-sm"
                              >
                                {updating === process.id ? 'Đang xử lý...' : '▶ Bắt đầu'}
                              </button>
                            )}
                          </>
                        )}
                        {process.status === 'in_progress' && (
                          <button
                            onClick={() => handleCompleteProcess(process.id)}
                            disabled={updating === process.id}
                            className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 text-sm"
                          >
                            {updating === process.id ? 'Đang xử lý...' : '✓ Hoàn thành'}
                          </button>
                        )}
                        {process.status === 'completed' && (
                          <div className="text-center text-green-600 font-semibold text-sm">
                            ✓ Đã xong
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
