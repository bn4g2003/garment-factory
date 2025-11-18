'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
}

export default function WarehouseLayout({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(userStr) as User;
    if (!['admin', 'warehouse_staff'].includes(user.role)) {
      if (user.role === 'production_staff') router.push('/production/dashboard');
      else if (user.role === 'factory_manager') router.push('/factory/dashboard');
      else router.push('/dashboard');
      return;
    }
    setCurrentUser(user);
  }, [router]);

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className={`bg-gray-900 text-white ${sidebarOpen ? 'w-56' : 'w-20'} fixed h-screen z-50 transition-all`}>
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-lg font-bold">Kho</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-800 rounded text-gray-400">
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="p-4">
          <ul className="space-y-1">
            <li>
              <Link href="/warehouse/dashboard" className="flex items-center px-3 py-2 rounded hover:bg-gray-800">
                <span className="mr-2">▪</span>
                {sidebarOpen && <span>Dashboard</span>}
              </Link>
            </li>
            <li>
              <Link href="/warehouse/materials" className="flex items-center px-3 py-2 rounded hover:bg-gray-800">
                <span className="mr-2">▪</span>
                {sidebarOpen && <span>Kho NVL</span>}
              </Link>
            </li>
            <li>
              <Link href="/warehouse/finished-products" className="flex items-center px-3 py-2 rounded hover:bg-gray-800">
                <span className="mr-2">▪</span>
                {sidebarOpen && <span>Kho TP</span>}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-700 mt-auto">
          {sidebarOpen ? (
            <div>
              <div className="text-xs font-medium truncate">{currentUser.fullName}</div>
              <div className="text-xs text-gray-400 mb-2">{currentUser.role}</div>
              <button
                onClick={() => {
                  localStorage.removeItem('user');
                  router.push('/login');
                }}
                className="w-full px-2 py-1.5 bg-red-600 hover:bg-red-700 rounded text-xs"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                localStorage.removeItem('user');
                router.push('/login');
              }}
              className="w-full p-2 bg-red-600 hover:bg-red-700 rounded text-sm"
              title="Đăng xuất"
            >
              ⊗
            </button>
          )}
        </div>
      </aside>

      <div className={`flex-1 flex flex-col ${sidebarOpen ? 'ml-56' : 'ml-20'} transition-all`}>
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-lg font-semibold text-gray-900">Quản lý Kho</div>
            <div className="text-sm text-gray-600">| NVL & Thành phẩm</div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-xs bg-yellow-50 text-yellow-800 px-2 py-1 rounded">Đơn chờ xuất: 0</div>
            <div className="text-sm text-gray-700">{currentUser.fullName}</div>
          </div>
        </header>

        <main className="p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}


