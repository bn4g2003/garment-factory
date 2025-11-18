'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
  department?: string;
}

export default function ProductionLayout({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(userStr) as User;
    if (!['admin', 'production_staff'].includes(user.role)) {
      // redirect to proper dashboard
      if (user.role === 'factory_manager') router.push('/factory/dashboard');
      else if (user.role === 'warehouse_staff') router.push('/warehouse/dashboard');
      else router.push('/dashboard');
      return;
    }
    setCurrentUser(user);
  }, [router]);

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-lg font-semibold">Quy trình Sản xuất</div>
          <div className="text-sm text-gray-600">Phòng: {currentUser.department || '—'}</div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-xs bg-blue-50 text-blue-800 px-2 py-1 rounded">Công đoạn chờ: 0</div>
          <div className="text-sm text-gray-700">{currentUser.fullName}</div>
          <button
            onClick={() => {
              localStorage.removeItem('user');
              router.push('/login');
            }}
            className="px-3 py-1 bg-red-600 text-white rounded"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <div className="p-6">{children}</div>
    </div>
  );
}


