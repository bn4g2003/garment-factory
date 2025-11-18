'use client';

import { useEffect, useState } from 'react';

interface Material {
  id: string;
  code: string;
  name: string;
  unit: string;
  current_stock: number;
  min_stock: number;
}

export default function FactoryMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      <h1 className="text-2xl font-bold mb-4">Nguyên vật liệu</h1>
      {loading ? (
        <div>Đang tải...</div>
      ) : (
        <div className="bg-white rounded shadow p-4">
          <ul className="space-y-2">
            {materials.map((m) => (
              <li key={m.id} className={`p-3 rounded ${m.current_stock <= m.min_stock ? 'bg-red-50' : 'bg-white'}`}>
                <div className="flex justify-between">
                  <div>
                    <div className="font-semibold">{m.code} - {m.name}</div>
                    <div className="text-sm text-gray-500">{m.unit}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{m.current_stock}</div>
                    <div className="text-xs text-gray-500">Min: {m.min_stock}</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}


