'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Stats {
  orders: {
    total: number;
    pending: number;
    waiting_material: number;
    confirmed: number;
    in_production: number;
    completed: number;
  };
  materials: {
    total: number;
    low_stock: number;
    total_value: number;
  };
  products: {
    total_inventory: number;
    pending_import: number;
    pending_export: number;
  };
  production: {
    active_orders: number;
    completed_processes: number;
    pending_processes: number;
  };
}

const COLORS = ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE'];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
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
    fetchStats();
  }, [router]);

  const fetchStats = async () => {
    try {
      const [ordersRes, materialsRes, productsRes, productionRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/materials'),
        fetch('/api/finished-products'),
        fetch('/api/production'),
      ]);

      const ordersData = await ordersRes.json();
      const materialsData = await materialsRes.json();
      const productsData = await productsRes.json();
      const productionData = await productionRes.json();

      if (ordersData.success && materialsData.success && productsData.success && productionData.success) {
        const orders = ordersData.orders;
        const materials = materialsData.materials;
        const products = productsData.products;
        const production = productionData.orders;

        setStats({
          orders: {
            total: orders.length,
            pending: orders.filter((o: any) => o.status === 'pending').length,
            waiting_material: orders.filter((o: any) => o.status === 'waiting_material').length,
            confirmed: orders.filter((o: any) => o.status === 'confirmed').length,
            in_production: orders.filter((o: any) => o.status === 'in_production').length,
            completed: orders.filter((o: any) => o.status === 'completed').length,
          },
          materials: {
            total: materials.length,
            low_stock: materials.filter((m: any) => m.current_stock <= m.min_stock).length,
            total_value: materials.reduce((sum: number, m: any) => sum + m.current_stock * m.price, 0),
          },
          products: {
            total_inventory: products.reduce((sum: number, p: any) => sum + p.quantity, 0),
            pending_import: orders.filter((o: any) => o.status === 'in_production').length,
            pending_export: orders.filter((o: any) => o.status === 'completed').length,
          },
          production: {
            active_orders: production.length,
            completed_processes: production.reduce((sum: number, o: any) => 
              sum + o.processes.filter((p: any) => p.status === 'completed').length, 0),
            pending_processes: production.reduce((sum: number, o: any) => 
              sum + o.processes.filter((p: any) => p.status === 'pending').length, 0),
          },
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
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

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-900">Không thể tải dữ liệu</div>
      </div>
    );
  }

  // Dữ liệu cho biểu đồ tròn
  const orderStatusData = [
    { name: 'Chờ xử lý', value: stats.orders.pending },
    { name: 'Chờ NVL', value: stats.orders.waiting_material },
    { name: 'Đã xác nhận', value: stats.orders.confirmed },
    { name: 'Đang SX', value: stats.orders.in_production },
    { name: 'Hoàn thành', value: stats.orders.completed },
  ].filter(item => item.value > 0);

  // Dữ liệu cho biểu đồ cột
  const productionData = [
    { name: 'Đơn đang SX', value: stats.production.active_orders },
    { name: 'Công đoạn xong', value: stats.production.completed_processes },
    { name: 'Công đoạn chờ', value: stats.production.pending_processes },
  ];

  const warehouseData = [
    { name: 'Tồn kho NVL', value: stats.materials.total },
    { name: 'NVL sắp hết', value: stats.materials.low_stock },
    { name: 'Tồn kho TP', value: stats.products.total_inventory },
  ];

  return (
    <main className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-blue-100">Chào mừng, {currentUser?.full_name}</p>
      </div>

      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Tổng đơn hàng</div>
              <div className="text-3xl font-bold text-gray-900">{stats.orders.total}</div>
            </div>
            <div className="text-4xl">📋</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Tổng NVL</div>
              <div className="text-3xl font-bold text-gray-900">{stats.materials.total}</div>
            </div>
            <div className="text-4xl">📦</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Tồn kho TP</div>
              <div className="text-3xl font-bold text-gray-900">{stats.products.total_inventory}</div>
            </div>
            <div className="text-4xl">📤</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Giá trị kho</div>
              <div className="text-2xl font-bold text-gray-900">{(stats.materials.total_value / 1000000).toFixed(1)}M</div>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>
      </div>

      {/* Biểu đồ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biểu đồ tròn - Trạng thái đơn hàng */}
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

        {/* Biểu đồ cột - Sản xuất */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tiến độ sản xuất</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Biểu đồ cột - Kho */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Thống kê kho</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={warehouseData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#60A5FA" name="Số lượng" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/admin/orders" className="bg-white border-2 border-gray-300 rounded-lg shadow p-6 hover:border-blue-500 hover:shadow-lg transition-all text-center">
            <div className="text-4xl mb-2">📝</div>
            <div className="font-semibold text-gray-900">Đơn hàng</div>
          </Link>
          <Link href="/admin/warehouse/materials" className="bg-white border-2 border-gray-300 rounded-lg shadow p-6 hover:border-blue-500 hover:shadow-lg transition-all text-center">
            <div className="text-4xl mb-2">📦</div>
            <div className="font-semibold text-gray-900">Kho NVL</div>
          </Link>
          <Link href="/admin/production" className="bg-white border-2 border-gray-300 rounded-lg shadow p-6 hover:border-blue-500 hover:shadow-lg transition-all text-center">
            <div className="text-4xl mb-2">⚙️</div>
            <div className="font-semibold text-gray-900">Sản xuất</div>
          </Link>
          <Link href="/admin/warehouse/finished-products" className="bg-white border-2 border-gray-300 rounded-lg shadow p-6 hover:border-blue-500 hover:shadow-lg transition-all text-center">
            <div className="text-4xl mb-2">📤</div>
            <div className="font-semibold text-gray-900">Kho TP</div>
          </Link>
        </div>
      </div>

      {/* Cảnh báo */}
      {(stats.materials.low_stock > 0 || stats.orders.waiting_material > 0) && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-start">
            <div className="text-2xl mr-3">⚠️</div>
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">Cảnh báo</h3>
              <ul className="space-y-1 text-red-700">
                {stats.materials.low_stock > 0 && (
                  <li>• Có {stats.materials.low_stock} NVL sắp hết hàng</li>
                )}
                {stats.orders.waiting_material > 0 && (
                  <li>• Có {stats.orders.waiting_material} đơn hàng đang chờ NVL</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
