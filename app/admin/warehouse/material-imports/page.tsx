'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface MaterialImport {
  id: string;
  import_code: string;
  supplier_name: string;
  import_type: string;
  total_amount: number;
  imported_by_name: string;
  import_date: string;
  item_count: number;
}

interface Material {
  id: string;
  code: string;
  name: string;
  unit: string;
  price: number;
}

interface ImportItem {
  material_id: string;
  quantity: number;
  unit_price: number;
}

export default function MaterialImportsPage() {
  const [imports, setImports] = useState<MaterialImport[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    supplier_id: '',
    import_type: 'purchase',
  });
  const [importItems, setImportItems] = useState<ImportItem[]>([]);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
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
      const [importsRes, materialsRes] = await Promise.all([
        fetch('/api/material-imports'),
        fetch('/api/materials'),
      ]);

      const importsData = await importsRes.json();
      const materialsData = await materialsRes.json();

      if (importsData.success) setImports(importsData.imports);
      if (materialsData.success) setMaterials(materialsData.materials);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    setFormData({
      supplier_id: '',
      import_type: 'purchase',
    });
    setImportItems([]);
    setFormError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setFormError('');
  };

  const addImportItem = () => {
    setImportItems([...importItems, { material_id: '', quantity: 0, unit_price: 0 }]);
  };

  const removeImportItem = (index: number) => {
    setImportItems(importItems.filter((_, i) => i !== index));
  };

  const updateImportItem = (index: number, field: string, value: any) => {
    const updated = [...importItems];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'material_id') {
      const material = materials.find((m) => m.id === value);
      if (material) {
        updated[index].unit_price = material.price;
      }
    }
    
    setImportItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    if (importItems.length === 0) {
      setFormError('Vui lòng thêm ít nhất 1 NVL');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/material-imports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items: importItems,
          imported_by: currentUser.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Có lỗi xảy ra');
        setSubmitting(false);
        return;
      }

      alert('✅ Nhập kho NVL thành công!');
      await fetchData();
      closeForm();
    } catch (error) {
      setFormError('Có lỗi xảy ra khi nhập kho');
    } finally {
      setSubmitting(false);
    }
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
            <h3 className="text-xl font-semibold text-white">Nhập kho NVL</h3>
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
                  Loại nhập
                </label>
                <select
                  name="import_type"
                  value={formData.import_type}
                  onChange={(e) => setFormData({ ...formData, import_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                >
                  <option value="purchase">Mua hàng</option>
                  <option value="return">Trả hàng</option>
                </select>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-lg font-semibold text-gray-900">Danh sách NVL</h4>
                <button
                  type="button"
                  onClick={addImportItem}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  + Thêm NVL
                </button>
              </div>

              {importItems.map((item, index) => {
                const material = materials.find((m) => m.id === item.material_id);
                return (
                  <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                    <div className="col-span-5">
                      <select
                        value={item.material_id}
                        onChange={(e) => updateImportItem(index, 'material_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white text-sm"
                        required
                      >
                        <option value="">-- Chọn NVL --</option>
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.code} - {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateImportItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        placeholder="SL"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white text-sm"
                        required
                      />
                    </div>
                    <div className="col-span-1 flex items-center">
                      <span className="text-sm text-gray-700">{material?.unit || ''}</span>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateImportItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        placeholder="Giá"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white text-sm"
                        required
                      />
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <span className="text-sm text-gray-700 font-semibold">
                        {(item.quantity * item.unit_price).toLocaleString()}đ
                      </span>
                      <button
                        type="button"
                        onClick={() => removeImportItem(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })}

              {importItems.length > 0 && (
                <div className="mt-4 text-right">
                  <div className="text-lg font-bold text-gray-900">
                    Tổng: {importItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0).toLocaleString()}đ
                  </div>
                </div>
              )}
            </div>

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
                {submitting ? 'Đang nhập...' : 'Nhập kho'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Danh sách phiếu nhập NVL</h2>
          <button
            onClick={openAddForm}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + Nhập kho NVL
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã phiếu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số NVL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người nhập</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày nhập</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {imports.map((imp) => (
                <tr key={imp.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {imp.import_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {imp.import_type === 'purchase' ? 'Mua hàng' : 'Trả hàng'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{imp.item_count}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {imp.total_amount.toLocaleString()}đ
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {imp.imported_by_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(imp.import_date).toLocaleString('vi-VN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {imports.length === 0 && (
          <div className="text-center py-8 text-gray-500">Chưa có phiếu nhập nào</div>
        )}
      </div>

      <div className="text-center">
        <Link href="/admin/warehouse/materials" className="text-blue-600 hover:text-blue-900">
          ← Quay lại kho NVL
        </Link>
      </div>
    </main>
  );
}
