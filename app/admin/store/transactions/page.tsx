'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Define the interface for a single transaction
interface Transaction {
  id: string;
  transaction_code: string;
  type: 'payment_in' | 'payment_out' | 'refund';
  amount: number;
  date: string;
  related_order_code?: string;
  party_name: string; // Can be customer or supplier name
  status: 'completed' | 'pending' | 'failed';
  payment_method: 'cash' | 'bank_transfer' | 'card';
}

// Mock data for transactions since the API is not ready
const mockTransactions: Transaction[] = [
  {
    id: '1',
    transaction_code: 'TRN-20251118-001',
    type: 'payment_in',
    amount: 5000000,
    date: '2025-11-18T10:30:00Z',
    related_order_code: 'SCO-98765432',
    party_name: 'Nguyễn Văn An',
    status: 'completed',
    payment_method: 'bank_transfer',
  },
  {
    id: '2',
    transaction_code: 'TRN-20251117-005',
    type: 'payment_out',
    amount: 1200000,
    date: '2025-11-17T15:00:00Z',
    party_name: 'Nhà cung cấp Vải ABC',
    status: 'completed',
    payment_method: 'cash',
  },
  {
    id: '3',
    transaction_code: 'TRN-20251117-004',
    type: 'payment_in',
    amount: 2500000,
    date: '2025-11-17T11:45:00Z',
    related_order_code: 'SCO-98765431',
    party_name: 'Trần Thị Bích',
    status: 'pending',
    payment_method: 'bank_transfer',
  },
  {
    id: '4',
    transaction_code: 'TRN-20251116-012',
    type: 'refund',
    amount: 300000,
    date: '2025-11-16T09:00:00Z',
    related_order_code: 'SCO-98765430',
    party_name: 'Lê Hoàng Dũng',
    status: 'completed',
    payment_method: 'card',
  },
  {
    id: '5',
    transaction_code: 'TRN-20251115-002',
    type: 'payment_in',
    amount: 10000000,
    date: '2025-11-15T14:20:00Z',
    related_order_code: 'SCO-98765429',
    party_name: 'Phạm Thị Mai',
    status: 'failed',
    payment_method: 'bank_transfer',
  },
];

export default function StoreTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    // Simulate fetching data from an API
    setTransactions(mockTransactions);
    setLoading(false);
  }, [router]);

  const getStatusBadge = (status: 'completed' | 'pending' | 'failed') => {
    const badges = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
    };
    const labels = {
      completed: 'Hoàn thành',
      pending: 'Chờ xử lý',
      failed: 'Thất bại',
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };
  
  const getTransactionTypeInfo = (type: 'payment_in' | 'payment_out' | 'refund') => {
    const info = {
        payment_in: { label: 'Thu tiền', color: 'text-green-600', sign: '+' },
        payment_out: { label: 'Chi tiền', color: 'text-red-600', sign: '-' },
        refund: { label: 'Hoàn tiền', color: 'text-blue-600', sign: '-' },
    };
    return info[type];
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-900">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <main className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Lịch sử Giao dịch</h2>
          <button
            // onClick={openAddForm} // Placeholder for future functionality
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + Thêm giao dịch
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã Giao Dịch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại Giao Dịch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đối Tượng</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Số Tiền</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày Giao Dịch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng Thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => {
                const typeInfo = getTransactionTypeInfo(transaction.type);
                return (
                    <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {transaction.transaction_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                        <span className={typeInfo.color}>{typeInfo.label}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.party_name}
                        {transaction.related_order_code && (
                            <p className="text-xs text-gray-500">ĐH: {transaction.related_order_code}</p>
                        )}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${typeInfo.color}`}>
                        {typeInfo.sign}{transaction.amount.toLocaleString()}đ
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(transaction.date).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getStatusBadge(transaction.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-blue-600 hover:text-blue-900">Chi tiết</button>
                    </td>
                    </tr>
                );
              })}
            </tbody>
          </table>

          {transactions.length === 0 && (
            <div className="text-center py-8 text-gray-500">Chưa có giao dịch nào</div>
          )}
        </div>
      </div>
    </main>
  );
}
