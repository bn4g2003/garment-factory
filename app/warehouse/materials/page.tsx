'use client';

import { useEffect, useState } from 'react';

interface Material {
  id: string;
  code: string;
  name: string;
  current_stock: number;
  min_stock: number;
}

export default function WarehouseMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showImportForm, setShowImportForm] = useState(false);
  const [showExportForm, setShowExportForm] = useState(false);
  // import/export multi-line support
  const [importItems, setImportItems] = useState<
    { material_id: string; quantity: number | ''; unit_price: number | '' }[]
  >([{ material_id: '', quantity: '', unit_price: '' }]);

  const [exportOrderId, setExportOrderId] = useState('');
  const [exportItems, setExportItems] = useState<
    { material_id: string; quantity: number | ''; unit_price: number | '' }[]
  >([{ material_id: '', quantity: '', unit_price: '' }]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setCurrentUser(JSON.parse(userStr));

    const fetchData = async () => {
      try {
        const res = await fetch('/api/materials');
        const data = await res.json();
        if (data.success) setMaterials(data.materials);
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
      <h1 className="text-2xl font-bold mb-4">Kho NVL</h1>
      {loading ? (
        <div>Đang tải...</div>
      ) : (
        <div className="bg-white rounded shadow p-4">
          <div className="mb-4 flex items-center space-x-2">
            <button
              onClick={() => setShowImportForm((s) => !s)}
              className="px-3 py-2 bg-green-600 text-white rounded"
            >
              Nhập NVL
            </button>
            <button
              onClick={() => setShowExportForm((s) => !s)}
              className="px-3 py-2 bg-blue-600 text-white rounded"
            >
              Xuất NVL
            </button>
          </div>

          {showImportForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="fixed inset-0 bg-black/40" onClick={() => setShowImportForm(false)} />
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Tạo phiếu nhập NVL</h3>
                  <button onClick={() => setShowImportForm(false)} className="text-gray-600">✕</button>
                </div>

                <div className="space-y-3">
                  {importItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <label className="block text-sm text-gray-600">Vật tư</label>
                        <select
                          value={item.material_id}
                          onChange={(e) => {
                            const v = e.target.value;
                            setImportItems((prev) => prev.map((p, i) => (i === idx ? { ...p, material_id: v } : p)));
                          }}
                          className="w-full px-2 py-1 border rounded"
                        >
                          <option value="">-- Chọn NVL --</option>
                          {materials.map((m) => (
                            <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <label className="block text-sm text-gray-600">Số lượng</label>
                        <input
                          type="number"
                          value={item.quantity as any}
                          onChange={(e) => {
                            const v = e.target.value === '' ? '' : Number(e.target.value);
                            setImportItems((prev) => prev.map((p, i) => (i === idx ? { ...p, quantity: v } : p)));
                          }}
                          className="w-full px-2 py-1 border rounded"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-sm text-gray-600">Đơn giá</label>
                        <input
                          type="number"
                          value={item.unit_price as any}
                          onChange={(e) => {
                            const v = e.target.value === '' ? '' : Number(e.target.value);
                            setImportItems((prev) => prev.map((p, i) => (i === idx ? { ...p, unit_price: v } : p)));
                          }}
                          className="w-full px-2 py-1 border rounded"
                        />
                      </div>
                      <div className="col-span-1">
                        <button
                          onClick={() => setImportItems((prev) => prev.filter((_, i) => i !== idx))}
                          className="px-2 py-1 bg-red-600 text-white rounded"
                        >
                          −
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setImportItems((prev) => [...prev, { material_id: '', quantity: '', unit_price: '' }])}
                      className="px-3 py-2 bg-gray-200 rounded"
                    >
                      + Thêm dòng
                    </button>
                    <div className="flex-1" />
                    <button
                      onClick={async () => {
                        // validation
                        if (importItems.length === 0 || importItems.some(it => !it.material_id || !it.quantity || !it.unit_price)) {
                          alert('Vui lòng điền đầy đủ thông tin cho tất cả dòng');
                          return;
                        }
                        try {
                          const res = await fetch('/api/material-imports', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              supplier_id: null,
                              import_type: 'purchase',
                              items: importItems.map(it => ({ material_id: it.material_id, quantity: it.quantity, unit_price: it.unit_price })),
                              imported_by: currentUser?.id || null,
                            }),
                          });
                          const data = await res.json();
                          if (!res.ok) {
                            alert(data.error || 'Có lỗi khi tạo phiếu nhập');
                            return;
                          }
                          alert('✅ Tạo phiếu nhập thành công');
                          const matRes = await fetch('/api/materials');
                          const matData = await matRes.json();
                          if (matData.success) setMaterials(matData.materials);
                          setImportItems([{ material_id: '', quantity: '', unit_price: '' }]);
                          setShowImportForm(false);
                        } catch (err) {
                          alert('Có lỗi xảy ra');
                        }
                      }}
                      className="px-3 py-2 bg-green-700 text-white rounded"
                    >
                      Lưu phiếu nhập
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showExportForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="fixed inset-0 bg-black/40" onClick={() => setShowExportForm(false)} />
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Tạo phiếu xuất NVL</h3>
                  <button onClick={() => setShowExportForm(false)} className="text-gray-600">✕</button>
                </div>

                <div className="mb-3">
                  <label className="block text-sm text-gray-600">Order ID (nếu có)</label>
                  <input value={exportOrderId} onChange={(e) => setExportOrderId(e.target.value)} className="w-full px-2 py-1 border rounded" />
                </div>

                <div className="space-y-3">
                  {exportItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-6">
                        <label className="block text-sm text-gray-600">Vật tư</label>
                        <select
                          value={item.material_id}
                          onChange={(e) => setExportItems(prev => prev.map((p,i) => i===idx ? {...p, material_id: e.target.value} : p))}
                          className="w-full px-2 py-1 border rounded"
                        >
                          <option value="">-- Chọn NVL --</option>
                          {materials.map((m) => (
                            <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <label className="block text-sm text-gray-600">Số lượng</label>
                        <input type="number" value={item.quantity as any} onChange={(e) => setExportItems(prev => prev.map((p,i) => i===idx ? {...p, quantity: e.target.value==='' ? '' : Number(e.target.value)} : p))} className="w-full px-2 py-1 border rounded" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-600">Đơn giá</label>
                        <input type="number" value={item.unit_price as any} onChange={(e) => setExportItems(prev => prev.map((p,i) => i===idx ? {...p, unit_price: e.target.value==='' ? '' : Number(e.target.value)} : p))} className="w-full px-2 py-1 border rounded" />
                      </div>
                      <div className="col-span-1">
                        <button onClick={() => setExportItems(prev => prev.filter((_,i)=>i!==idx))} className="px-2 py-1 bg-red-600 text-white rounded">−</button>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center space-x-2">
                    <button onClick={() => setExportItems(prev => [...prev, { material_id: '', quantity: '', unit_price: '' }])} className="px-3 py-2 bg-gray-200 rounded">+ Thêm dòng</button>
                    <div className="flex-1" />
                    <button onClick={async () => {
                      if (exportItems.length === 0 || exportItems.some(it => !it.material_id || !it.quantity || !it.unit_price)) {
                        alert('Vui lòng điền đầy đủ thông tin cho tất cả dòng');
                        return;
                      }
                      try {
                        const res = await fetch('/api/material-exports', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            order_id: exportOrderId || null,
                            export_type: 'production',
                            items: exportItems.map(it => ({ material_id: it.material_id, quantity: it.quantity, unit_price: it.unit_price })),
                            exported_by: currentUser?.id || null,
                          }),
                        });
                        const data = await res.json();
                        if (!res.ok) {
                          alert(data.error || 'Có lỗi khi tạo phiếu xuất');
                          return;
                        }
                        alert('✅ Tạo phiếu xuất thành công');
                        const matRes = await fetch('/api/materials');
                        const matData = await matRes.json();
                        if (matData.success) setMaterials(matData.materials);
                        setExportItems([{ material_id: '', quantity: '', unit_price: '' }]);
                        setExportOrderId('');
                        setShowExportForm(false);
                      } catch (err) {
                        alert('Có lỗi xảy ra');
                      }
                    }} className="px-3 py-2 bg-blue-700 text-white rounded">Lưu phiếu xuất</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Mã</th>
                <th className="p-3 text-left">Tên NVL</th>
                <th className="p-3 text-right">Tồn</th>
                <th className="p-3 text-right">Min</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="p-3">{m.code}</td>
                  <td className="p-3">{m.name}</td>
                  <td className={`p-3 text-right ${m.current_stock <= m.min_stock ? 'text-red-600' : ''}`}>{m.current_stock}</td>
                  <td className="p-3 text-right">{m.min_stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}


