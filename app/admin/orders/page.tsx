'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Order {
  id: string;
  order_code: string;
  customer_name: string;
  customer_code: string;
  order_type: string;
  total_amount: number;
  debt_amount: number;
  status: string;
  item_count: number;
  created_at: string;
}

interface Customer {
  id: string;
  code: string;
  name: string;
}

interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  status: string;
}

interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
}

interface MaterialCheck {
  material_code: string;
  material_name: string;
  unit: string;
  required: number;
  available: number;
  shortage: number;
  is_sufficient: boolean;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    order_code: '',
    customer_id: '',
    order_type: 'sỉ',
  });
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [materialCheck, setMaterialCheck] = useState<MaterialCheck[]>([]);
  const [showMaterialCheck, setShowMaterialCheck] = useState(false);
  
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(userStr);
    setCurrentUser(user);
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const [ordersRes, customersRes, productsRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/customers'),
        fetch('/api/products'),
      ]);

      const ordersData = await ordersRes.json();
      const customersData = await customersRes.json();
      const productsData = await productsRes.json();

      if (ordersData.success) setOrders(ordersData.orders);
      if (customersData.success) setCustomers(customersData.customers);
      if (productsData.success) setProducts(productsData.products.filter((p: Product) => p.status === 'active'));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    const newCode = `DH${Date.now().toString().slice(-8)}`;
    setEditingOrderId(null);
    setFormData({
      order_code: newCode,
      customer_id: '',
      order_type: 'sỉ',
    });
    setOrderItems([]);
    setMaterialCheck([]);
    setShowMaterialCheck(false);
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();

      if (data.success) {
        const order = data.order;
        
        if (order.status !== 'pending') {
          alert('Chỉ có thể chỉnh sửa đơn hàng đang chờ xử lý');
          return;
        }

        setEditingOrderId(orderId);
        setFormData({
          order_code: order.order_code,
          customer_id: order.customer_id,
          order_type: order.order_type,
        });

        const items = data.items.map((item: any) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
        }));
        setOrderItems(items);
        setMaterialCheck([]);
        setShowMaterialCheck(false);
        setFormError('');
        setShowForm(true);
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi tải thông tin đơn hàng');
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingOrderId(null);
    setFormError('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const addOrderItem = () => {
    setOrderItems([...orderItems, { product_id: '', quantity: 1, price: 0 }]);
  };

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateOrderItem = (index: number, field: string, value: any) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Tự động điền giá khi chọn sản phẩm
    if (field === 'product_id') {
      const product = products.find((p) => p.id === value);
      if (product) {
        updated[index].price = product.price;
      }
    }
    
    setOrderItems(updated);
  };

  const checkMaterials = async () => {
    if (orderItems.length === 0 || orderItems.some((item) => !item.product_id || item.quantity <= 0)) {
      alert('Vui lòng nhập đầy đủ thông tin sản phẩm');
      return;
    }

    try {
      const res = await fetch('/api/orders/check-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: orderItems }),
      });

      const data = await res.json();

      if (data.success) {
        setMaterialCheck(data.materials);
        setShowMaterialCheck(true);
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi kiểm tra NVL');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    if (orderItems.length === 0) {
      setFormError('Vui lòng thêm ít nhất 1 sản phẩm');
      setSubmitting(false);
      return;
    }

    try {
      const url = editingOrderId ? `/api/orders/${editingOrderId}` : '/api/orders';
      const method = editingOrderId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items: orderItems,
          created_by: currentUser.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Có lỗi xảy ra');
        setSubmitting(false);
        return;
      }

      await fetchData();
      closeForm();
      alert(editingOrderId ? '✅ Cập nhật đơn hàng thành công!' : '✅ Tạo đơn hàng thành công!');
    } catch (error) {
      setFormError(editingOrderId ? 'Có lỗi xảy ra khi cập nhật đơn hàng' : 'Có lỗi xảy ra khi tạo đơn hàng');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendToWarehouse = async (id: string) => {
    if (!confirm('Chuyển đơn hàng này xuống kho NVL để kiểm tra?')) {
      return;
    }

    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'waiting_material' }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Có lỗi xảy ra');
        return;
      }

      await fetchData();
      alert('✅ Đã chuyển đơn hàng xuống kho NVL. Vui lòng kiểm tra tại trang Kho NVL.');
    } catch (error) {
      alert('Có lỗi xảy ra khi chuyển đơn hàng');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Hủy đơn hàng này?')) {
      return;
    }

    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Có lỗi xảy ra');
        return;
      }

      await fetchData();
      alert('✅ Đã hủy đơn hàng');
    } catch (error) {
      alert('Có lỗi xảy ra khi hủy đơn hàng');
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Bạn có chắc muốn xóa đơn hàng "${code}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Có lỗi xảy ra khi xóa');
        return;
      }

      await fetchData();
    } catch (error) {
      alert('Có lỗi xảy ra khi xóa đơn hàng');
    }
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.order_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const badges: any = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_production: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const labels: any = {
      pending: 'Chờ xử lý',
      confirmed: 'Đã xác nhận',
      in_production: 'Đang sản xuất',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
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
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg border-2 border-blue-500">
          <div className="px-6 py-4 bg-blue-600 flex justify-between items-center">
            <h3 className="text-xl font-semibold text-white">
              {editingOrderId ? `Chỉnh sửa đơn hàng: ${formData.order_code}` : 'Tạo đơn hàng sản xuất'}
            </h3>
            <button
              onClick={closeForm}
              className="text-white hover:text-gray-200 text-2xl font-bold"
              disabled={submitting}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã đơn hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="order_code"
                  value={formData.order_code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  disabled={!!editingOrderId}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Khách hàng <span className="text-red-500">*</span>
                </label>
                <select
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  required
                >
                  <option value="">-- Chọn khách hàng --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại đơn hàng <span className="text-red-500">*</span>
                </label>
                <select
                  name="order_type"
                  value={formData.order_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  required
                >
                  <option value="sỉ">Sỉ</option>
                  <option value="lẻ">Lẻ</option>
                  <option value="gia công">Gia công</option>
                </select>
              </div>
            </div>

            {/* Danh sách sản phẩm */}
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
                  <div className="col-span-5">
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
                      value={item.price}
                      onChange={(e) => updateOrderItem(index, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="Giá"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white text-sm"
                      required
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <span className="text-sm text-gray-700 font-semibold">
                      {(item.quantity * item.price).toLocaleString()}đ
                    </span>
                    <button
                      type="button"
                      onClick={() => removeOrderItem(index)}
                      className="text-red-600 hover:text-red-900"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}

              {orderItems.length > 0 && (
                <div className="mt-4 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={checkMaterials}
                    className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                  >
                    🔍 Kiểm tra NVL
                  </button>
                  <div className="text-lg font-bold text-gray-900">
                    Tổng: {orderItems.reduce((sum, item) => sum + item.quantity * item.price, 0).toLocaleString()}đ
                  </div>
                </div>
              )}
            </div>

            {/* Kết quả kiểm tra NVL */}
            {showMaterialCheck && materialCheck.length > 0 && (
              <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <h4 className="text-lg font-semibold mb-3 text-gray-900">Kết quả kiểm tra NVL</h4>
                <div className="space-y-2">
                  {materialCheck.map((m, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded ${m.is_sufficient ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-semibold text-gray-900">{m.material_code}</span> - {m.material_name}
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-700">Cần: {m.required.toLocaleString()} {m.unit}</span>
                          <span className="mx-2">|</span>
                          <span className="text-gray-700">Tồn: {m.available.toLocaleString()} {m.unit}</span>
                          {!m.is_sufficient && (
                            <>
                              <span className="mx-2">|</span>
                              <span className="text-red-600 font-semibold">Thiếu: {m.shortage.toLocaleString()} {m.unit}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{formError}</p>
              </div>
            )}

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
                {submitting 
                  ? (editingOrderId ? 'Đang cập nhật...' : 'Đang tạo...') 
                  : (editingOrderId ? 'Cập nhật đơn hàng' : 'Tạo đơn hàng')
                }
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">Danh sách đơn hàng</h2>
            <input
              type="text"
              placeholder="Tìm theo mã đơn, khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>
          <button
            onClick={openAddForm}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + Tạo đơn hàng
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã đơn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SP</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Công nợ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.order_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.customer_code} - {order.customer_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.order_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.item_count}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.total_amount.toLocaleString()}đ
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={order.debt_amount > 0 ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                      {order.debt_amount.toLocaleString()}đ
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusBadge(order.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Chi tiết
                    </Link>
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => openEditForm(order.id)}
                          className="text-orange-600 hover:text-orange-900"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleSendToWarehouse(order.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          📦 Chuyển kho NVL
                        </button>
                        <button
                          onClick={() => handleCancel(order.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Hủy
                        </button>
                      </>
                    )}
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleDelete(order.id, order.order_code)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Xóa
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-8 text-gray-500">Chưa có đơn hàng nào</div>
        )}
      </div>
    </main>
  );
}
