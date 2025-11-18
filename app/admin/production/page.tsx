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
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
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
  }, [router, activeTab]);

  const fetchProduction = async () => {
    try {
      const url = activeTab === 'history' 
        ? '/api/production?history=true' 
        : '/api/production';
      
      const res = await fetch(url);
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

  // Lọc đơn hàng theo search và status
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.order_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.order_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Quy trình Sản xuất</h2>
          </div>
          
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-4">
            <div className="flex">
              <button
                onClick={() => setActiveTab('current')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'current'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Đang sản xuất
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'history'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Lịch sử
              </button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-3 items-center">
            <input
              type="text"
              placeholder="Tìm theo mã đơn, khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="all">Tất cả trạng thái</option>
              {activeTab === 'current' ? (
                <>
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="in_production">Đang sản xuất</option>
                </>
              ) : (
                <>
                  <option value="completed">Hoàn thành</option>
                  <option value="cancelled">Đã hủy</option>
                </>
              )}
            </select>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">
                {activeTab === 'current' 
                  ? 'Không có đơn hàng nào đang sản xuất' 
                  : 'Không có lịch sử sản xuất'
                }
              </p>
              {activeTab === 'current' && (
                <Link href="/admin/orders" className="text-blue-600 hover:text-blue-900">
                  → Đi đến Quản lý Đơn hàng
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order) => (
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
                    {activeTab === 'history' && (
                      <div className="mt-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          order.order_status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {order.order_status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}
                        </span>
                      </div>
                    )}
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
                        {activeTab === 'current' && (
                          <>
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
                          </>
                        )}
                        {activeTab === 'history' && process.status === 'completed' && (
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
      </div>
    </main>
  );
}