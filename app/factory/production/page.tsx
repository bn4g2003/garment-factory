'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Process {
  id: string;
  process_code: string;
  process_name: string;
  status: string;
  assigned_to: string | null;
  order_id: string;
  order_code: string;
}

interface ProductionOrder {
  order_id: string;
  order_code: string;
  processes: Process[];
}

export default function FactoryProductionPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/production');
        const data = await res.json();
        if (data.success) setOrders(data.orders);
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
      <h1 className="text-2xl font-bold mb-4">Quy trình Sản xuất</h1>
      {loading ? (
        <div>Đang tải...</div>
      ) : orders.length === 0 ? (
        <div className="text-gray-500">Không có đơn hàng đang sản xuất</div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.order_id} className="bg-white rounded shadow p-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <div className="font-semibold">{o.order_code}</div>
                  <div className="text-sm text-gray-500">Mã: {o.order_id}</div>
                </div>
                <Link href={`/admin/orders/${o.order_id}`} className="text-blue-600 hover:underline">Chi tiết</Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {o.processes.map((p) => (
                  <div key={p.id} className="p-3 border rounded">
                    <div className="font-medium">{p.process_name}</div>
                    <div className="text-sm text-gray-500">Trạng thái: {p.status}</div>
                    <div className="text-sm text-gray-500">Gán: {p.assigned_to || '-'}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}


