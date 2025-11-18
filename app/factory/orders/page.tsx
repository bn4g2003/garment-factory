'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Order {
  id: string;
  order_code: string;
  customer_name: string;
  status: string;
  total_amount: number;
  created_at: string;
}

export default function FactoryOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/orders');
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
      <h1 className="text-2xl font-bold mb-4">Đơn hàng SX</h1>
      {loading ? (
        <div>Đang tải...</div>
      ) : (
        <div className="bg-white rounded shadow">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Mã đơn</th>
                <th className="p-3 text-left">Khách hàng</th>
                <th className="p-3 text-left">Trạng thái</th>
                <th className="p-3 text-right">Tổng tiền</th>
                <th className="p-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="p-3">{o.order_code}</td>
                  <td className="p-3">{o.customer_name}</td>
                  <td className="p-3">{o.status}</td>
                  <td className="p-3 text-right">{o.total_amount.toLocaleString()}đ</td>
                  <td className="p-3 text-center">
                    <Link href={`/admin/orders/${o.id}`} className="text-blue-600 hover:underline">
                      Chi tiết
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}


