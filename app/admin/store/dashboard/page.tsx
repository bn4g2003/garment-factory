'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Store {
  id: number;
  name: string;
  address: string;
}

interface Stats {
  orders: {
    total: number;
    pending: number;
    completed: number;
  };
  customers: {
    total: number;
  };
  inventory: {
    total_products: number;
    total_quantity: number;
  };
  pending_exports: {
    total: number;
  }
}

const COLORS = ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE'];

export default function StoreDashboardPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(userStr);
    setCurrentUser(user);
    fetchStores();
  }, [router]);

  const fetchStores = async () => {
    try {
      const res = await fetch('/api/stores');
      const data = await res.json();
      if (data.success) {
        setStores(data.stores);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (storeId: string) => {
    if (!storeId) return;
    setLoadingStats(true);
    try {
      const [ordersRes, customersRes, inventoryRes, pendingExportsRes] = await Promise.all([
        fetch(`/api/stores/${storeId}/customer-orders`),
        fetch(`/api/stores/${storeId}/customers`),
        fetch(`/api/stores/${storeId}/inventory`),
        fetch(`/api/stores/${storeId}/pending-exports`),
      ]);

      const ordersData = await ordersRes.json();
      const customersData = await customersRes.json();
      const inventoryData = await inventoryRes.json();
      const pendingExportsData = await pendingExportsRes.json();
      
      setStats({
        orders: {
          total: ordersData.orders?.length || 0,
          pending: ordersData.orders?.filter((o: any) => o.status === 'pending').length || 0,
          completed: ordersData.orders?.filter((o: any) => o.status === 'completed').length || 0,
        },
        customers: {
          total: customersData.customers?.length || 0,
        },
        inventory: {
          total_products: inventoryData.inventory?.length || 0,
          total_quantity: inventoryData.inventory?.reduce((sum: number, p: any) => sum + p.quantity, 0) || 0,
        },
        pending_exports: {
            total: pendingExportsData.exports?.length || 0,
        }
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleStoreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const storeId = e.target.value;
    setSelectedStore(storeId);
    fetchStats(storeId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-900">Đang tải danh sách cửa hàng...</div>
      </div>
    );
  }

  const orderStatusData = stats ? [
    { name: 'Chờ xử lý', value: stats.orders.pending },
    { name: 'Hoàn thành', value: stats.orders.completed },
  ].filter(item => item.value > 0) : [];

  return (
    <main className="p-6 space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Dashboard Cửa Hàng</h1>
        <p className="text-blue-100">Chào mừng, {currentUser?.full_name}</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <label htmlFor="store-select" className="block text-sm font-medium text-gray-700 mb-2">
          Chọn cửa hàng:
        </label>
        <select
          id="store-select"
          value={selectedStore}
          onChange={handleStoreChange}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="">-- Chọn một cửa hàng --</option>
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>
      </div>

      {loadingStats && (
        <div className="flex items-center justify-center p-6">
          <div className="text-lg text-gray-900">Đang tải dữ liệu thống kê...</div>
        </div>
      )}

      {selectedStore && !loadingStats && !stats && (
         <div className="flex items-center justify-center p-6">
            <div className="text-lg text-red-600">Không thể tải dữ liệu cho cửa hàng này.</div>
         </div>
      )}

      {selectedStore && !loadingStats && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-600 mb-1">Tổng đơn hàng</div>
                <div className="text-3xl font-bold text-gray-900">{stats.orders.total}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-600 mb-1">Khách hàng</div>
                <div className="text-3xl font-bold text-gray-900">{stats.customers.total}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-600 mb-1">Tồn kho</div>
                <div className="text-3xl font-bold text-gray-900">{stats.inventory.total_quantity}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-600 mb-1">Chờ xuất kho</div>
                <div className="text-3xl font-bold text-gray-900">{stats.pending_exports.total}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Trạng thái đơn hàng</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => `${entry.name}: ${((entry.percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Thống kê kho</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[{ name: 'Tồn kho', 'Số lượng sản phẩm': stats.inventory.total_quantity, 'Số loại sản phẩm': stats.inventory.total_products }]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Số lượng sản phẩm" fill="#3B82F6" />
                        <Bar dataKey="Số loại sản phẩm" fill="#60A5FA" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href={`/admin/store/customer-orders?storeId=${selectedStore}`} className="bg-white border-2 border-gray-300 rounded-lg shadow p-6 hover:border-blue-500 hover:shadow-lg transition-all text-center">
                <div className="text-4xl mb-2">📝</div>
                <div className="font-semibold text-gray-900">Đơn hàng</div>
              </Link>
              <Link href={`/admin/store/customers?storeId=${selectedStore}`} className="bg-white border-2 border-gray-300 rounded-lg shadow p-6 hover:border-blue-500 hover:shadow-lg transition-all text-center">
                <div className="text-4xl mb-2">👥</div>
                <div className="font-semibold text-gray-900">Khách hàng</div>
              </Link>
              <Link href={`/admin/store/warehouse?storeId=${selectedStore}`} className="bg-white border-2 border-gray-300 rounded-lg shadow p-6 hover:border-blue-500 hover:shadow-lg transition-all text-center">
                <div className="text-4xl mb-2">📦</div>
                <div className="font-semibold text-gray-900">Kho</div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
