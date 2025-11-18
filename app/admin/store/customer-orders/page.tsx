'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Store {
  id: string;
  code: string;
  name: string;
}

interface Customer {
  id: string;
  code: string;
  name: string;
  phone: string;
  store_id: string | null;
}

interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  status: string;
}

interface CustomerOrder {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  order_date: string;
  required_date: string;
  status: string;
  total_amount: number;
  item_count: number;
}

export default function StoreCustomerOrdersPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    customer_id: '',
    required_date: '',
    notes: '',
  });
  const [orderItems, setOrderItems] = useState<{ product_id: string; quantity: number; unit_price: number }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    setCurrentUser(JSON.parse(userStr));
    fetchData();
  }, [router]);

  useEffect(() => {
    if (selectedStoreId) {
      fetchOrders();
    }
  }, [selectedStoreId]);

  const fetchData = async () => {
    try {
      const [storesRes, customersRes, productsRes] = await Promise.all([
        fetch('/api/stores'),
        fetch('/api/customers'),
        fetch('/api/products'),
      ]);

      const storesData = await storesRes.json();
      const customersData = await customersRes.json();
      const productsData = await productsRes.json();

      if (storesData.success) {
        setStores(storesData.stores);
        if (storesData.stores.length > 0) {
          setSelectedStoreId(storesData.stores[0].id);
        }
      }
      if (customersData.success) {
        setCustomers(customersData.customers);
      }
      if (productsData.success) {
        setProducts(productsData.products.filter((p: Product) => p.status === 'active'));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    if (!selectedStoreId) return;

    try {
      const res = await fetch(`/api/stores/${selectedStoreId}/customer-orders`);
      const data = await res.json();

      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const openAddForm = () => {
    const orderCode = `SCO-${Date.now().toString().slice(-8)}`;
    setFormData({
      customer_id: '',
      required_date: '',
      notes: '',
    });
    setOrderItems([{ product_id: '', quantity: 1, unit_price: 0 }]);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
  };

  const addOrderItem = () => {
    setOrderItems([...orderItems, { product_id: '', quantity: 1, unit_price: 0 }]);
  };

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateOrderItem = (index: number, field: string, value: any) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'product_id') {
      const product = products.find((p) => p.id === value);
      if (product) {
        updated[index].unit_price = product.price;
      }
    }
    
    setOrderItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_id || orderItems.length === 0) {
      alert('Vui lòng chọn khách hàng và thêm sản phẩm');
      return;
    }

    if (orderItems.some((item) => !item.product_id || item.quantity <= 0)) {
      alert('Vui lòng nhập đầy đủ thông tin sản phẩm');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/store-customer-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: selectedStoreId,
          customer_id: formData.customer_id,
          required_date: formData.required_date || null,
          notes: formData.notes,
          items: orderItems,
          created_by: currentUser.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Có lỗi xảy ra');
        return;
      }

      alert('✅ Tạo đơn hàng thành công!');
      closeForm();
      await fetchOrders();
    } catch (error) {
      alert('Có lỗi xảy ra khi tạo đơn hàng');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      pending: 'bg-yellow-100 text-yellow-800',
      checking_stock: 'bg-blue-100 text-blue-800',
      waiting_production: 'bg-orange-100 text-orange-800',
      ready: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const labels: any = {
      pending: 'Chờ xử lý',
      checking_stock: 'Đang kiểm tra',
      waiting_production: 'Chờ sản xuất',
      ready: 'Sẵn sàng',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const selectedStore = stores.find((s) => s.id === selectedStoreId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-900">Đang tải...</div>
      </div>
    );
  }

  return (
    <main className="p-6 space-y-6">
      {/* Form tạo đơn - Hiện ở trên cùng */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg border-2 border-blue-500">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 flex justify-between items-center">
            <h3 className="text-xl font-semibold text-white">Tạo đơn hàng từ khách</h3>
            <button
              onClick={closeForm}
              className="text-white hover:text-gray-200 text-2xl font-bold"
              disabled={submitting}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Khách hàng <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                    required
                  >
                    <option value="">-- Chọn khách hàng --</option>
                    {customers.filter((c) => c.store_id === selectedStoreId).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.name} - {c.phone}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày cần hàng
                  </label>
                  <input
                    type="date"
                    value={formData.required_date}
                    onChange={(e) => setFormData({ ...formData, required_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  rows={2}
                />
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-lg font-semibold text-gray-900">Sản phẩm</h4>
                  <button
                    type="button"
                    onClick={addOrderItem}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    + Thêm sản phẩm
                  </button>
                </div>

                {orderItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                    <div className="col-span-6">
                      <select
                        value={item.product_id}
                        onChange={(e) => updateOrderItem(index, 'product_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white text-sm"
                        required
                      >
                        <option value="">-- Chọn sản phẩm --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.code} - {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        placeholder="SL"
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white text-sm"
                        required
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateOrderItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        placeholder="Giá"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white text-sm"
                        required
                      />
                    </div>
                    <div className="col-span-1 flex items-center">
                      <button
                        type="button"
                        onClick={() => removeOrderItem(index)}
                        className="text-red-600 hover:text-red-900 text-xl"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}

                {orderItems.length > 0 && (
                  <div className="mt-4 text-right">
                    <div className="text-lg font-bold text-gray-900">
                      Tổng: {orderItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0).toLocaleString()}đ
                    </div>
                  </div>
                )}
              </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeForm}
                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-100 text-gray-700 font-medium"
                disabled={submitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                disabled={submitting}
              >
                {submitting ? 'Đang tạo...' : 'Tạo đơn hàng'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">Đơn hàng từ khách</h2>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
            >
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.code} - {store.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={openAddForm}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + Tạo đơn hàng
          </button>
        </div>
      </div>

      {/* Danh sách đơn hàng */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã đơn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SĐT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SP</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày đặt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.order_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.customer_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.customer_phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.item_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.total_amount.toLocaleString()}đ
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(order.order_date).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link href={`/admin/store/customer-orders/${order.id}`} className="text-blue-600 hover:text-blue-900">Chi tiết</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {orders.length === 0 && (
            <div className="text-center py-8 text-gray-500">Chưa có đơn hàng nào</div>
          )}
        </div>
      </div>
    </main>
  );
}
