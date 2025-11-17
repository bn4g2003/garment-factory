'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Order {
  id: string;
  order_code: string;
  customer_name: string;
  status: string;
  total_amount: number;
  created_at: string;
}

interface MaterialCheck {
  material_id: string;
  material_code: string;
  material_name: string;
  unit: string;
  required: number;
  available: number;
  shortage: number;
  is_sufficient: boolean;
  unit_price: number;
}

interface Material {
  id: string;
  code: string;
  name: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  price: number;
}

export default function WarehouseMaterialsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [materialCheck, setMaterialCheck] = useState<MaterialCheck[]>([]);
  const [showMaterialCheck, setShowMaterialCheck] = useState(false);
  const [exportData, setExportData] = useState<any>(null);
  const [editableQuantities, setEditableQuantities] = useState<{ [key: string]: number }>({});
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory'>('orders');
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(userStr);
    setCurrentUser(user);
    fetchOrders();
  }, [router]);

  const fetchOrders = async () => {
    try {
      const [ordersRes, materialsRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/materials'),
      ]);

      const ordersData = await ordersRes.json();
      const materialsData = await materialsRes.json();

      if (ordersData.success) {
        // Chỉ lấy đơn hàng đang chờ xử lý NVL
        const waitingOrders = ordersData.orders.filter(
          (o: Order) => o.status === 'pending' || o.status === 'waiting_material'
        );
        setOrders(waitingOrders);
      }

      if (materialsData.success) {
        setMaterials(materialsData.materials);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckMaterials = async (order: Order) => {
    try {
      const res = await fetch(`/api/orders/${order.id}/material-check`);
      const data = await res.json();

      if (data.success) {
        setSelectedOrder(order);
        setMaterialCheck(data.materials);
        // Khởi tạo số lượng có thể chỉnh sửa
        const quantities: { [key: string]: number } = {};
        data.materials.forEach((m: MaterialCheck) => {
          quantities[m.material_id] = m.required;
        });
        setEditableQuantities(quantities);
        setShowMaterialCheck(true);
        setExportData(null);
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi kiểm tra NVL');
    }
  };

  const handleConfirmExport = async () => {
    if (!selectedOrder || !currentUser) return;

    // Kiểm tra số lượng thực tế xuất có vượt quá tồn kho không
    const invalidMaterials = materialCheck.filter((m) => {
      const actualQuantity = editableQuantities[m.material_id] || m.required;
      return actualQuantity > m.available;
    });

    if (invalidMaterials.length > 0) {
      alert('Số lượng xuất vượt quá tồn kho! Vui lòng kiểm tra lại.');
      return;
    }

    if (!confirm(`Xác nhận xuất NVL cho đơn hàng ${selectedOrder.order_code}?\nNVL sẽ tự động trừ khỏi kho.`)) {
      return;
    }

    try {
      const items = materialCheck.map((m) => ({
        material_id: m.material_id,
        quantity: editableQuantities[m.material_id] || m.required,
        unit_price: m.unit_price,
      }));

      const res = await fetch('/api/material-exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: selectedOrder.id,
          export_type: 'production',
          items,
          exported_by: currentUser.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Có lỗi xảy ra');
        return;
      }

      // Lưu thông tin phiếu xuất để in
      setExportData(data.export);
      alert('✅ Xác nhận xuất NVL thành công! NVL đã được trừ khỏi kho.\nĐơn hàng đã sẵn sàng sản xuất.');
    } catch (error) {
      alert('Có lỗi xảy ra khi xuất NVL');
    }
  };

  const handleRejectOrder = async () => {
    if (!selectedOrder) return;

    if (!confirm(`Từ chối đơn hàng ${selectedOrder.order_code}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (!res.ok) {
        alert('Có lỗi xảy ra');
        return;
      }

      alert('✅ Đã từ chối đơn hàng');
      setShowMaterialCheck(false);
      setSelectedOrder(null);
      setExportData(null);
      await fetchOrders();
    } catch (error) {
      alert('Có lỗi xảy ra');
    }
  };

  const handleRequestPurchase = async () => {
    if (!selectedOrder) return;

    const insufficientMaterials = materialCheck.filter((m) => !m.is_sufficient);
    if (insufficientMaterials.length === 0) {
      alert('NVL đã đủ, không cần đề xuất mua');
      return;
    }

    // Cập nhật trạng thái đơn hàng sang waiting_material
    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'waiting_material' }),
      });

      if (!res.ok) {
        alert('Có lỗi xảy ra');
        return;
      }

      alert('✅ Đã chuyển đơn hàng sang trạng thái chờ NVL. Vui lòng nhập thêm NVL.');
      setShowMaterialCheck(false);
      setSelectedOrder(null);
      setExportData(null);
      await fetchOrders();
    } catch (error) {
      alert('Có lỗi xảy ra');
    }
  };

  const handlePrintExport = () => {
    if (!exportData) return;
    printExportPDF(exportData, materialCheck);
  };

  const handleCloseExport = async () => {
    setShowMaterialCheck(false);
    setSelectedOrder(null);
    setExportData(null);
    await fetchOrders();
  };

  const printExportPDF = (exportData: any, materials: MaterialCheck[]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHTML = materials.map((item, index) => `
      <tr>
        <td style="text-align: center; padding: 10px; border: 1px solid #000;">${index + 1}</td>
        <td style="padding: 10px; border: 1px solid #000;">${item.material_code}</td>
        <td style="padding: 10px; border: 1px solid #000;">${item.material_name}</td>
        <td style="text-align: center; padding: 10px; border: 1px solid #000;">${item.unit}</td>
        <td style="text-align: right; padding: 10px; border: 1px solid #000;">${item.required.toLocaleString()}</td>
        <td style="text-align: right; padding: 10px; border: 1px solid #000;">${item.unit_price.toLocaleString()}</td>
        <td style="text-align: right; padding: 10px; border: 1px solid #000; font-weight: bold;">${(item.required * item.unit_price).toLocaleString()}</td>
      </tr>
    `).join('');

    const totalAmount = materials.reduce((sum, m) => sum + m.required * m.unit_price, 0);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Phiếu xuất NVL ${exportData.export_code}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Times New Roman', Times, serif; 
              font-size: 14px;
              line-height: 1.5;
              color: #000;
              padding: 30px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 3px solid #000;
            }
            .company-info { flex: 1; }
            .company-name { font-weight: bold; font-size: 16px; margin-bottom: 5px; text-transform: uppercase; }
            .title {
              text-align: center;
              margin: 30px 0;
            }
            .title h1 {
              font-size: 24px;
              font-weight: bold;
              text-transform: uppercase;
              margin-bottom: 10px;
            }
            .title .code {
              font-size: 15px;
              font-style: italic;
            }
            .info-section {
              margin: 20px 0;
            }
            .info-row {
              display: flex;
              margin-bottom: 8px;
            }
            .info-label {
              font-weight: bold;
              width: 180px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 25px 0;
            }
            th {
              background-color: #e5e7eb;
              font-weight: bold;
              text-align: center;
              padding: 12px;
              border: 1px solid #000;
            }
            .total-section {
              margin: 25px 0;
              text-align: right;
            }
            .total-row {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 8px;
              font-size: 15px;
            }
            .total-label {
              font-weight: bold;
              width: 180px;
              text-align: right;
              margin-right: 30px;
            }
            .total-value {
              width: 180px;
              text-align: right;
              font-weight: bold;
            }
            .signature-section {
              margin-top: 50px;
              display: flex;
              justify-content: space-between;
            }
            .signature-box {
              text-align: center;
              width: 30%;
            }
            .signature-title {
              font-weight: bold;
              margin-bottom: 70px;
            }
            .signature-name {
              font-size: 12px;
              font-style: italic;
            }
            @media print {
              body { padding: 0; }
            }
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
            <h1>Phiếu Xuất Kho Nguyên Vật Liệu</h1>
            <div class="code">Mã phiếu: ${exportData.export_code}</div>
          </div>

          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Đơn hàng:</span>
              <span><strong>${selectedOrder?.order_code}</strong></span>
            </div>
            <div class="info-row">
              <span class="info-label">Khách hàng:</span>
              <span>${selectedOrder?.customer_name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Loại xuất:</span>
              <span>Xuất sản xuất</span>
            </div>
            <div class="info-row">
              <span class="info-label">Người xuất:</span>
              <span>${currentUser?.full_name}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 50px;">STT</th>
                <th style="width: 120px;">Mã NVL</th>
                <th>Tên NVL</th>
                <th style="width: 80px;">ĐVT</th>
                <th style="width: 100px;">Số lượng</th>
                <th style="width: 120px;">Đơn giá (đ)</th>
                <th style="width: 140px;">Thành tiền (đ)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <span class="total-label">Tổng cộng:</span>
              <span class="total-value">${totalAmount.toLocaleString()} đ</span>
            </div>
          </div>

          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-title">Người lập phiếu</div>
              <div class="signature-name">(Ký, ghi rõ họ tên)</div>
            </div>
            <div class="signature-box">
              <div class="signature-title">Thủ kho</div>
              <div class="signature-name">(Ký, ghi rõ họ tên)</div>
            </div>
            <div class="signature-box">
              <div class="signature-title">Giám đốc</div>
              <div class="signature-name">(Ký, ghi rõ họ tên)</div>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      pending: 'bg-yellow-100 text-yellow-800',
      waiting_material: 'bg-orange-100 text-orange-800',
    };
    const labels: any = {
      pending: 'Chờ xử lý',
      waiting_material: 'Chờ NVL',
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
      {showMaterialCheck && selectedOrder && (
        <div className="bg-white rounded-lg shadow-lg border-2 border-blue-500">
          <div className="px-6 py-4 bg-blue-600 flex justify-between items-center">
            <h3 className="text-xl font-semibold text-white">
              Kiểm tra NVL - Đơn hàng: {selectedOrder.order_code}
            </h3>
            <button
              onClick={() => {
                setShowMaterialCheck(false);
                setSelectedOrder(null);
                setExportData(null);
              }}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="px-6 py-6">
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-3 text-gray-900">Danh sách NVL cần thiết</h4>
              <div className="space-y-2">
                {materialCheck.map((m, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-2 ${
                      m.is_sufficient
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex justify-between items-center gap-4">
                      <div className="flex-1">
                        <span className="font-bold text-gray-900">{m.material_code}</span>
                        <span className="ml-2 text-gray-700">- {m.material_name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm">
                            <span className="text-gray-700">Định mức: </span>
                            <span className="font-semibold text-gray-900">
                              {m.required.toLocaleString()} {m.unit}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-700">Tồn kho: </span>
                            <span className="font-semibold text-gray-900">
                              {m.available.toLocaleString()} {m.unit}
                            </span>
                          </div>
                          {!m.is_sufficient && (
                            <div className="text-sm">
                              <span className="text-red-600 font-bold">
                                Thiếu: {m.shortage.toLocaleString()} {m.unit}
                              </span>
                            </div>
                          )}
                        </div>
                        {!exportData && (
                          <div className="flex flex-col items-end">
                            <label className="text-xs text-gray-600 mb-1">Xuất thực tế:</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={editableQuantities[m.material_id] || m.required}
                                onChange={(e) => {
                                  const newValue = parseFloat(e.target.value) || 0;
                                  setEditableQuantities({
                                    ...editableQuantities,
                                    [m.material_id]: newValue,
                                  });
                                }}
                                step="0.01"
                                min="0"
                                max={m.available}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                              />
                              <span className="text-sm text-gray-700">{m.unit}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              {exportData ? (
                <>
                  <button
                    onClick={handlePrintExport}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                  >
                    🖨️ In phiếu xuất NVL
                  </button>
                  <button
                    onClick={handleCloseExport}
                    className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
                  >
                    Đóng
                  </button>
                </>
              ) : (
                <>
                  {materialCheck.every((m) => m.is_sufficient) ? (
                    <>
                      <button
                        onClick={handleRejectOrder}
                        className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
                      >
                        ❌ Từ chối
                      </button>
                      <button
                        onClick={handleConfirmExport}
                        className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                      >
                        ✅ Xác nhận xuất NVL
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleRejectOrder}
                        className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
                      >
                        ❌ Từ chối
                      </button>
                      <button
                        onClick={handleRequestPurchase}
                        className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 font-medium"
                      >
                        📋 Đề xuất mua NVL
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Tổng số NVL</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{materials.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">NVL sắp hết</div>
          <div className="text-3xl font-bold text-red-600 mt-2">
            {materials.filter((m) => m.current_stock <= m.min_stock).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Đơn chờ xử lý</div>
          <div className="text-3xl font-bold text-orange-600 mt-2">{orders.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Giá trị tồn kho</div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            {materials.reduce((sum, m) => sum + m.current_stock * m.price, 0).toLocaleString()}đ
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'orders'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Đơn hàng chờ xử lý ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'inventory'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tồn kho NVL ({materials.length})
            </button>
          </div>
        </div>

        {activeTab === 'orders' && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã đơn</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.order_code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.customer_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.total_amount.toLocaleString()}đ</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusBadge(order.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(order.created_at).toLocaleDateString('vi-VN')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button onClick={() => handleCheckMaterials(order)} className="text-blue-600 hover:text-blue-900 font-medium">
                          🔍 Kiểm tra NVL
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {orders.length === 0 && <div className="text-center py-8 text-gray-500">Không có đơn hàng chờ xử lý</div>}
          </>
        )}

        {activeTab === 'inventory' && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã NVL</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên NVL</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ĐVT</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tồn kho</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tồn tối thiểu</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đơn giá</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá trị</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {materials.map((material) => {
                    const isLow = material.current_stock <= material.min_stock;
                    return (
                      <tr key={material.id} className={isLow ? 'bg-red-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{material.code}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{material.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{material.unit}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{material.current_stock.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{material.min_stock.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{material.price.toLocaleString()}đ</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {(material.current_stock * material.price).toLocaleString()}đ
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {isLow ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">⚠️ Sắp hết</span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">✓ Đủ</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {materials.length === 0 && <div className="text-center py-8 text-gray-500">Chưa có NVL nào</div>}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/warehouse/material-imports"
          className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <div className="text-3xl mb-2">📦</div>
          <h3 className="text-lg font-semibold text-gray-900">Nhập kho NVL</h3>
          <p className="text-sm text-gray-600">Quản lý phiếu nhập NVL</p>
        </Link>

        <Link
          href="/admin/warehouse/material-exports"
          className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <div className="text-3xl mb-2">📤</div>
          <h3 className="text-lg font-semibold text-gray-900">Xuất kho NVL</h3>
          <p className="text-sm text-gray-600">Xem lịch sử xuất NVL</p>
        </Link>

        <Link
          href="/admin/materials"
          className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <div className="text-3xl mb-2">📋</div>
          <h3 className="text-lg font-semibold text-gray-900">Danh mục NVL</h3>
          <p className="text-sm text-gray-600">Quản lý tồn kho NVL</p>
        </Link>
      </div>
    </main>
  );
}
