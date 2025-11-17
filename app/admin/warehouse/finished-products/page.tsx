'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Order {
  id: string;
  order_code: string;
  customer_name: string;
  customer_code: string;
  customer_phone: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface OrderItem {
  product_id: string;
  product_code: string;
  product_name: string;
  quantity: number;
  price: number;
}

interface FinishedProduct {
  id: string;
  product_code: string;
  product_name: string;
  quantity: number;
  batch_code: string;
  created_at: string;
}

interface ProductExport {
  id: string;
  export_code: string;
  order_code: string;
  customer_name: string;
  total_amount: number;
  exported_by_name: string;
  export_date: string;
}

export default function FinishedProductsPage() {
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<FinishedProduct[]>([]);
  const [exportHistory, setExportHistory] = useState<ProductExport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'inventory' | 'export' | 'history'>('pending');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'import' | 'export'>('import');
  const [exportData, setExportData] = useState<any>(null);
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
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const [ordersRes, inventoryRes, exportsRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/finished-products'),
        fetch('/api/product-exports'),
      ]);

      const ordersData = await ordersRes.json();
      const inventoryData = await inventoryRes.json();
      const exportsData = await exportsRes.json();

      if (ordersData.success) {
        setPendingOrders(ordersData.orders.filter((o: Order) => o.status === 'in_production'));
        setCompletedOrders(ordersData.orders.filter((o: Order) => o.status === 'completed'));
      }
      if (inventoryData.success) setInventory(inventoryData.products);
      if (exportsData.success) setExportHistory(exportsData.exports);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportOrder = async (order: Order) => {
    try {
      const res = await fetch(`/api/orders/${order.id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedOrder(order);
        setOrderItems(data.items);
        setModalType('import');
        setShowModal(true);
        setExportData(null);
      }
    } catch (error) {
      alert('Có lỗi xảy ra');
    }
  };

  const handleExportOrder = async (order: Order) => {
    try {
      const res = await fetch(`/api/orders/${order.id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedOrder(order);
        setOrderItems(data.items);
        setModalType('export');
        setShowModal(true);
        setExportData(null);
      }
    } catch (error) {
      alert('Có lỗi xảy ra');
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedOrder) return;
    if (!confirm(`Nhập kho thành phẩm cho đơn hàng ${selectedOrder.order_code}?`)) return;

    try {
      const items = orderItems.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }));

      const res = await fetch('/api/finished-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: selectedOrder.id, items }),
      });

      if (!res.ok) {
        alert('Có lỗi xảy ra');
        return;
      }

      alert('✅ Nhập kho thành phẩm thành công!');
      setShowModal(false);
      setSelectedOrder(null);
      await fetchData();
    } catch (error) {
      alert('Có lỗi xảy ra');
    }
  };

  const handleConfirmExport = async () => {
    if (!selectedOrder || !currentUser) return;
    if (!confirm(`Xuất kho thành phẩm cho đơn hàng ${selectedOrder.order_code}?`)) return;

    try {
      const items = orderItems.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.price,
      }));

      const res = await fetch('/api/product-exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: selectedOrder.id,
          store_id: null,
          export_type: 'direct_sale',
          items,
          exported_by: currentUser.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Có lỗi xảy ra');
        return;
      }

      setExportData(data.export);
      alert('✅ Xuất kho thành phẩm thành công!');
      await fetchData();
    } catch (error) {
      alert('Có lỗi xảy ra');
    }
  };

  const printExportPDF = (exportData: any, order: Order, items: OrderItem[]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHTML = items.map((item, index) => `
      <tr>
        <td style="text-align: center; padding: 10px; border: 1px solid #000;">${index + 1}</td>
        <td style="padding: 10px; border: 1px solid #000;">${item.product_code}</td>
        <td style="padding: 10px; border: 1px solid #000;">${item.product_name}</td>
        <td style="text-align: center; padding: 10px; border: 1px solid #000;">${item.quantity}</td>
        <td style="text-align: right; padding: 10px; border: 1px solid #000;">${item.price.toLocaleString()}</td>
        <td style="text-align: right; padding: 10px; border: 1px solid #000; font-weight: bold;">${(item.quantity * item.price).toLocaleString()}</td>
      </tr>
    `).join('');

    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Phiếu xuất thành phẩm ${exportData.export_code}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Times New Roman', Times, serif; font-size: 14px; line-height: 1.5; color: #000; padding: 30px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 3px solid #000; }
            .company-info { flex: 1; }
            .company-name { font-weight: bold; font-size: 16px; margin-bottom: 5px; text-transform: uppercase; }
            .title { text-align: center; margin: 30px 0; }
            .title h1 { font-size: 24px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; }
            .title .code { font-size: 15px; font-style: italic; }
            .info-section { margin: 20px 0; }
            .info-row { display: flex; margin-bottom: 8px; }
            .info-label { font-weight: bold; width: 180px; }
            table { width: 100%; border-collapse: collapse; margin: 25px 0; }
            th { background-color: #e5e7eb; font-weight: bold; text-align: center; padding: 12px; border: 1px solid #000; }
            .total-section { margin: 25px 0; text-align: right; }
            .total-row { display: flex; justify-content: flex-end; margin-bottom: 8px; font-size: 15px; }
            .total-label { font-weight: bold; width: 180px; text-align: right; margin-right: 30px; }
            .total-value { width: 180px; text-align: right; font-weight: bold; }
            .signature-section { margin-top: 50px; display: flex; justify-content: space-between; }
            .signature-box { text-align: center; width: 30%; }
            .signature-title { font-weight: bold; margin-bottom: 70px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <div class="company-name">XƯỞNG MAY [TÊN CÔNG TY]</div>
              <div>Địa chỉ: [Địa chỉ xưởng]</div>
              <div>Điện thoại: [Số điện thoại]</div>
            </div>
            <div style="text-align: right;">
              <div><strong>Ngày:</strong> ${new Date().toLocaleDateString('vi-VN')}</div>
              <div><strong>Số:</strong> ${exportData.export_code}</div>
            </div>
          </div>
          <div class="title">
            <h1>Phiếu Xuất Kho Thành Phẩm</h1>
            <div class="code">Mã phiếu: ${exportData.export_code}</div>
          </div>
          <div class="info-section">
            <div class="info-row"><span class="info-label">Đơn hàng:</span><span><strong>${order.order_code}</strong></span></div>
            <div class="info-row"><span class="info-label">Khách hàng:</span><span>${order.customer_code} - ${order.customer_name}</span></div>
            <div class="info-row"><span class="info-label">Số điện thoại:</span><span>${order.customer_phone || '-'}</span></div>
            <div class="info-row"><span class="info-label">Người xuất:</span><span>${currentUser?.full_name}</span></div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">STT</th>
                <th style="width: 120px;">Mã SP</th>
                <th>Tên sản phẩm</th>
                <th style="width: 100px;">Số lượng</th>
                <th style="width: 120px;">Đơn giá (đ)</th>
                <th style="width: 140px;">Thành tiền (đ)</th>
              </tr>
            </thead>
            <tbody>${itemsHTML}</tbody>
          </table>
          <div class="total-section">
            <div class="total-row">
              <span class="total-label">Tổng cộng:</span>
              <span class="total-value">${totalAmount.toLocaleString()} đ</span>
            </div>
          </div>
          <div class="signature-section">
            <div class="signature-box"><div class="signature-title">Người lập phiếu</div><div>(Ký, ghi rõ họ tên)</div></div>
            <div class="signature-box"><div class="signature-title">Khách hàng</div><div>(Ký, ghi rõ họ tên)</div></div>
            <div class="signature-box"><div class="signature-title">Giám đốc</div><div>(Ký, ghi rõ họ tên)</div></div>
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-lg text-gray-900">Đang tải...</div></div>;
  }

  return (
    <main className="p-6 space-y-6">
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className={`px-6 py-4 ${modalType === 'import' ? 'bg-green-600' : 'bg-blue-600'} flex justify-between items-center`}>
              <h3 className="text-xl font-semibold text-white">
                {modalType === 'import' ? 'Nhập kho thành phẩm' : 'Xuất kho thành phẩm'} - {selectedOrder.order_code}
              </h3>
              <button onClick={() => { setShowModal(false); setSelectedOrder(null); setExportData(null); }} className="text-white hover:text-gray-200 text-2xl font-bold">×</button>
            </div>
            <div className="px-6 py-6">
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3 text-gray-900">Thông tin đơn hàng</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div><span className="text-sm text-gray-600">Khách hàng:</span><div className="font-semibold text-gray-900">{selectedOrder.customer_code} - {selectedOrder.customer_name}</div></div>
                  <div><span className="text-sm text-gray-600">Tổng tiền:</span><div className="font-semibold text-gray-900">{selectedOrder.total_amount.toLocaleString()}đ</div></div>
                </div>
                <h4 className="text-lg font-semibold mb-3 text-gray-900">Danh sách sản phẩm</h4>
                <div className="space-y-2">
                  {orderItems.map((item, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border-2 ${modalType === 'import' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                      <div className="flex justify-between items-center">
                        <div><span className="font-bold text-gray-900">{item.product_code}</span><span className="ml-2 text-gray-700">- {item.product_name}</span></div>
                        <div className="text-right">
                          <div className="text-sm"><span className="text-gray-700">Số lượng: </span><span className="font-semibold text-gray-900">{item.quantity} sản phẩm</span></div>
                          <div className="text-sm"><span className="text-gray-700">Đơn giá: </span><span className="font-semibold text-gray-900">{item.price.toLocaleString()}đ</span></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3">
                {exportData ? (
                  <>
                    <button onClick={() => printExportPDF(exportData, selectedOrder, orderItems)} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium">🖨️ In phiếu xuất</button>
                    <button onClick={() => { setShowModal(false); setSelectedOrder(null); setExportData(null); }} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium">Đóng</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setShowModal(false); setSelectedOrder(null); }} className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-100 text-gray-700 font-medium">Hủy</button>
                    <button onClick={modalType === 'import' ? handleConfirmImport : handleConfirmExport} className={`px-6 py-2 ${modalType === 'import' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md font-medium`}>
                      ✅ Xác nhận {modalType === 'import' ? 'nhập kho' : 'xuất kho'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Chờ nhập kho</div>
          <div className="text-3xl font-bold text-orange-600 mt-2">{pendingOrders.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Tồn kho TP</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">
            {inventory.reduce((sum, item) => sum + item.quantity, 0)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Chờ xuất kho</div>
          <div className="text-3xl font-bold text-green-600 mt-2">{completedOrders.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Đã xuất</div>
          <div className="text-3xl font-bold text-gray-600 mt-2">{exportHistory.length}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button onClick={() => setActiveTab('pending')} className={`px-6 py-3 font-medium ${activeTab === 'pending' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>Chờ nhập kho ({pendingOrders.length})</button>
            <button onClick={() => setActiveTab('inventory')} className={`px-6 py-3 font-medium ${activeTab === 'inventory' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>Tồn kho ({inventory.length})</button>
            <button onClick={() => setActiveTab('export')} className={`px-6 py-3 font-medium ${activeTab === 'export' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>Chờ xuất kho ({completedOrders.length})</button>
            <button onClick={() => setActiveTab('history')} className={`px-6 py-3 font-medium ${activeTab === 'history' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>Lịch sử xuất ({exportHistory.length})</button>
          </div>
        </div>

        {activeTab === 'pending' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Đơn hàng hoàn thành sản xuất - Chờ nhập kho</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã đơn</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.order_code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.customer_code} - {order.customer_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.total_amount.toLocaleString()}đ</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(order.created_at).toLocaleDateString('vi-VN')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button onClick={() => handleImportOrder(order)} className="text-green-600 hover:text-green-900 font-medium">📦 Nhập kho</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pendingOrders.length === 0 && <div className="text-center py-8 text-gray-500">Không có đơn hàng chờ nhập kho</div>}
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tồn kho thành phẩm</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã SP</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên sản phẩm</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số lượng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lô hàng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày nhập</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventory.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.product_code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.product_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{item.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.batch_code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(item.created_at).toLocaleDateString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {inventory.length === 0 && <div className="text-center py-8 text-gray-500">Kho trống</div>}
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Đơn hàng hoàn thành - Chờ xuất kho</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã đơn</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {completedOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.order_code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.customer_code} - {order.customer_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.total_amount.toLocaleString()}đ</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(order.created_at).toLocaleDateString('vi-VN')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button onClick={() => handleExportOrder(order)} className="text-blue-600 hover:text-blue-900 font-medium">📤 Xuất kho</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {completedOrders.length === 0 && <div className="text-center py-8 text-gray-500">Không có đơn hàng chờ xuất kho</div>}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử xuất kho thành phẩm</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã phiếu</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đơn hàng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người xuất</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày xuất</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {exportHistory.map((exp) => (
                    <tr key={exp.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{exp.export_code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exp.order_code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exp.customer_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exp.total_amount.toLocaleString()}đ</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exp.exported_by_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(exp.export_date).toLocaleString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {exportHistory.length === 0 && <div className="text-center py-8 text-gray-500">Chưa có lịch sử xuất kho</div>}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
