'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
}

interface MenuItem {
  name: string;
  path: string;
  icon: string;
  children?: MenuItem[];
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['factory', 'store', 'system']);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    setCurrentUser(JSON.parse(userStr));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]
    );
  };

  const menuSections = [
    {
      id: 'factory',
      title: 'Quản lý Xưởng',
      icon: '⚙',
      items: [
        { name: 'Dashboard', path: '/admin/dashboard', icon: '▪' },
        { name: 'Đơn hàng SX', path: '/admin/orders', icon: '▪' },
        { name: 'Sản phẩm', path: '/admin/products', icon: '▪' },
        { name: 'Nguyên vật liệu', path: '/admin/materials', icon: '▪' },
        { name: 'Quy trình SX', path: '/admin/production', icon: '▪' },
        {
          name: 'Kho',
          path: '#',
          icon: '▪',
          children: [
            { name: 'Kho NVL', path: '/admin/warehouse/materials', icon: '·' },
            { name: 'Kho thành phẩm', path: '/admin/warehouse/finished-products', icon: '·' },
          ],
        },
      ],
    },
    {
      id: 'store',
      title: 'Quản lý Cửa hàng',
      icon: '◉',
      items: [
        { name: 'Dashboard', path: '/admin/store/dashboard', icon: '▪' },
        { name: 'Bán hàng (POS)', path: '/admin/store/pos', icon: '▪' },
        { name: 'Kho cửa hàng', path: '/admin/store/warehouse', icon: '▪' },
        { name: 'Thu chi', path: '/admin/store/transactions', icon: '▪' },
      ],
    },
    {
      id: 'system',
      title: 'Hệ thống',
      icon: '◈',
      items: [
        { name: 'Khách hàng', path: '/admin/customers', icon: '▪' },
        { name: 'Nhà cung cấp', path: '/admin/suppliers', icon: '▪' },
        { name: 'Người dùng', path: '/admin/users', icon: '▪' },
        { name: 'Tài chính', path: '/admin/finance', icon: '▪' },
        { name: 'Báo cáo', path: '/admin/reports', icon: '▪' },
      ],
    },
  ];

  const isActive = (path: string) => {
    if (path === '#') return false;
    if (path === '/admin/products' && pathname?.startsWith('/admin/products')) {
      return true;
    }
    return pathname === path;
  };

  const getBreadcrumbs = () => {
    const pathSegments = pathname?.split('/').filter(Boolean) || [];
    const breadcrumbs = [{ name: 'Trang chủ', path: '/admin' }];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      if (segment === 'admin') return;

      currentPath += `/${segment}`;
      const fullPath = `/admin${currentPath}`;

      // Tìm tên từ menu
      let name = segment;
      menuSections.forEach((section) => {
        section.items.forEach((item) => {
          if (item.path === fullPath) {
            name = item.name;
          }
          if (item.children) {
            item.children.forEach((child) => {
              if (child.path === fullPath) {
                name = child.name;
              }
            });
          }
        });
      });

      // Xử lý các trường hợp đặc biệt
      if (segment === 'materials' && pathSegments[index - 1] !== 'warehouse') {
        name = 'Định mức NVL';
      }

      breadcrumbs.push({ name, path: fullPath });
    });

    return breadcrumbs;
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`bg-gray-900 text-white transition-all duration-300 ${
          sidebarOpen ? 'w-72' : 'w-20'
        } flex flex-col fixed h-screen z-50`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-gray-700 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold">Xưởng May</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-800 rounded text-gray-400"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto py-2">
          {menuSections.map((section) => (
            <div key={section.id} className="mb-1">
              <button
                onClick={() => toggleMenu(section.id)}
                className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-800 text-gray-300"
              >
                <div className="flex items-center">
                  <span className="text-base">{section.icon}</span>
                  {sidebarOpen && <span className="ml-3 text-sm font-semibold uppercase">{section.title}</span>}
                </div>
                {sidebarOpen && (
                  <span className="text-xs">{expandedMenus.includes(section.id) ? '▼' : '▶'}</span>
                )}
              </button>

              {expandedMenus.includes(section.id) && (
                <ul className="space-y-0.5">
                  {section.items.map((item) => (
                    <li key={item.path}>
                      {item.children ? (
                        <>
                          <div className="flex items-center px-4 py-2 text-gray-400 text-sm">
                            <span className="mr-2">{item.icon}</span>
                            {sidebarOpen && <span>{item.name}</span>}
                          </div>
                          <ul className="ml-4">
                            {item.children.map((child) => (
                              <li key={child.path}>
                                <Link
                                  href={child.path}
                                  className={`flex items-center px-4 py-2 text-sm hover:bg-gray-800 transition-colors ${
                                    isActive(child.path) ? 'bg-blue-600 text-white' : 'text-gray-300'
                                  }`}
                                  title={!sidebarOpen ? child.name : ''}
                                >
                                  <span className="mr-2">{child.icon}</span>
                                  {sidebarOpen && <span>{child.name}</span>}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <Link
                          href={item.path}
                          className={`flex items-center px-4 py-2 text-sm hover:bg-gray-800 transition-colors ${
                            isActive(item.path) ? 'bg-blue-600 text-white' : 'text-gray-300'
                          }`}
                          title={!sidebarOpen ? item.name : ''}
                        >
                          <span className="mr-2">{item.icon}</span>
                          {sidebarOpen && <span>{item.name}</span>}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>

        {/* User Info */}
        <div className="p-3 border-t border-gray-700">
          {sidebarOpen ? (
            <div>
              <div className="text-xs font-medium truncate">{currentUser.fullName}</div>
              <div className="text-xs text-gray-400 mb-2">{currentUser.role}</div>
              <button
                onClick={handleLogout}
                className="w-full px-2 py-1.5 bg-red-600 hover:bg-red-700 rounded text-xs"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full p-2 bg-red-600 hover:bg-red-700 rounded text-sm"
              title="Đăng xuất"
            >
              ⊗
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${sidebarOpen ? 'ml-72' : 'ml-20'} transition-all duration-300`}>
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <nav className="flex items-center text-sm text-gray-600">
            {getBreadcrumbs().map((crumb, index) => (
              <div key={crumb.path} className="flex items-center">
                {index > 0 && <span className="mx-2">/</span>}
                {index === getBreadcrumbs().length - 1 ? (
                  <span className="text-gray-900 font-medium">{crumb.name}</span>
                ) : (
                  <Link href={crumb.path} className="hover:text-blue-600">
                    {crumb.name}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
