'use client';

import { useEffect, useState } from 'react';

interface Finished {
  id: string;
  product_id: string;
  quantity: number;
  store_id: string | null;
  batch_code: string | null;
}

export default function WarehouseFinishedProductsPage() {
  const [items, setItems] = useState<Finished[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [showExportForm, setShowExportForm] = useState(false);
  const [exportProductId, setExportProductId] = useState('');
  const [exportStoreId, setExportStoreId] = useState<string | null>(null);
  const [exportQuantity, setExportQuantity] = useState<number | ''>('');
  const [exportUnitPrice, setExportUnitPrice] = useState<number | ''>('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setCurrentUser(JSON.parse(userStr));

    const fetchData = async () => {
      try {
        const res = await fetch('/api/finished-products');
        const data = await res.json();
        if (data.success) setItems(data.items);
        // fetch stores for export destination
        const storesRes = await fetch('/api/stores');
        const storesData = await storesRes.json();
        if (storesData.success) setStores(storesData.stores);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Kho Thành phẩm</h1>
      {loading ? (
        <div>Đang tải...</div>
      ) : (
        <div className="bg-white rounded shadow p-4">
          <div className="mb-4">
            <button
              onClick={() => setShowExportForm((s) => !s)}
              className="px-3 py-2 bg-blue-600 text-white rounded"
            >
              Xuất Thành phẩm
            </button>
          </div>

          {showExportForm && (
            <div className="mb-4 border p-4 rounded bg-gray-50">
              <h3 className="font-semibold mb-2">Tạo phiếu xuất thành phẩm</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
                <div>
                  <label className="block text-sm text-gray-600">Sản phẩm (từ kho)</label>
                  <select value={exportProductId} onChange={(e) => setExportProductId(e.target.value)} className="w-full px-2 py-1 border rounded">
                    <option value="">-- Chọn sản phẩm --</option>
                    {items.map((it) => (
                      <option key={it.id} value={it.product_id}>
                        {it.product_id} {it.batch_code ? `- ${it.batch_code}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Cửa hàng (nếu xuất cho cửa hàng)</label>
                  <select value={exportStoreId || ''} onChange={(e) => setExportStoreId(e.target.value || null)} className="w-full px-2 py-1 border rounded">
                    <option value="">-- Xuất trực tiếp / Không chọn cửa hàng --</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Số lượng</label>
                  <input type="number" value={exportQuantity as any} onChange={(e) => setExportQuantity(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-2 py-1 border rounded" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Đơn giá</label>
                  <input type="number" value={exportUnitPrice as any} onChange={(e) => setExportUnitPrice(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-2 py-1 border rounded" />
                </div>
                <div>
                  <button
                    onClick={async () => {
                      if (!exportProductId || !exportQuantity || !exportUnitPrice) {
                        alert('Vui lòng nhập đầy đủ thông tin');
                        return;
                      }
                      try {
                        const res = await fetch('/api/product-exports', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            order_id: null,
                            store_id: exportStoreId,
                            export_type: exportStoreId ? 'to_store' : 'direct_sale',
                            items: [{ product_id: exportProductId, quantity: exportQuantity, unit_price: exportUnitPrice }],
                            exported_by: currentUser?.id || null,
                          }),
                        });
                        const data = await res.json();
                        if (!res.ok) {
                          alert(data.error || 'Có lỗi khi tạo phiếu xuất');
                          return;
                        }
                        alert('✅ Tạo phiếu xuất thành công');
                        // refresh finished products
                        const fpRes = await fetch('/api/finished-products');
                        const fpData = await fpRes.json();
                        if (fpData.success) setItems(fpData.items);
                        // reset form
                        setExportProductId('');
                        setExportStoreId(null);
                        setExportQuantity('');
                        setExportUnitPrice('');
                        setShowExportForm(false);
                      } catch (err) {
                        alert('Có lỗi xảy ra');
                      }
                    }}
                    className="px-3 py-2 bg-blue-700 text-white rounded"
                  >
                    Lưu phiếu xuất
                  </button>
                </div>
              </div>
            </div>
          )}

          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it.id} className="p-3 border rounded flex justify-between">
                <div>
                  <div className="font-semibold">Sản phẩm: {it.product_id}</div>
                  <div className="text-sm text-gray-500">Batch: {it.batch_code || '-'}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{it.quantity}</div>
                  <div className="text-xs text-gray-500">{it.store_id ? 'Cửa hàng' : 'Kho xưởng'}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}


