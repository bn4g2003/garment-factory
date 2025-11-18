'use client';

import { useEffect, useState } from 'react';

interface Process {
  id: string;
  process_code: string;
  process_name: string;
  status: string;
  start_time: string | null;
  end_time: string | null;
  order_id: string;
  order_code: string;
  assigned_to?: string | null;
}

export default function ProductionTasksPage() {
  const [tasks, setTasks] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) setCurrentUser(JSON.parse(userStr));

        const res = await fetch('/api/production');
        const data = await res.json();
        if (data.success) {
          // flatten processes
          let processes: Process[] = data.orders.flatMap((o: any) =>
            o.processes.map((p: any) => ({ ...p, order_id: o.order_id, order_code: o.order_code }))
          );

          // If current user is production_staff, show only assigned tasks
          if (userStr) {
            const user = JSON.parse(userStr);
            if (user.role === 'production_staff') {
              processes = processes.filter((p) => p.assigned_to === user.id);
            }
          }

          setTasks(processes);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const handleAction = async (id: string, action: 'start' | 'complete') => {
    if (!confirm(`${action === 'start' ? 'Bắt đầu' : 'Hoàn thành'} công đoạn này?`)) return;
    setUpdating(id);
    try {
      const body: any = { action };
      if (currentUser && action === 'start') body.user_id = currentUser.id;

      const res = await fetch(`/api/production/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Có lỗi');
        return;
      }
      // refresh
      const reload = await fetch('/api/production');
      const d2 = await reload.json();
      let processes: Process[] = d2.orders.flatMap((o: any) =>
        o.processes.map((p: any) => ({ ...p, order_id: o.order_id, order_code: o.order_code }))
      );
      if (currentUser && currentUser.role === 'production_staff') {
        processes = processes.filter((p) => p.assigned_to === currentUser.id);
      }
      setTasks(processes);
    } catch (error) {
      alert('Có lỗi xảy ra');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Công việc - Sản xuất</h1>
      {loading ? (
        <div>Đang tải...</div>
      ) : tasks.length === 0 ? (
        <div className="text-gray-500">Không có công việc</div>
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => (
            <div key={t.id} className="bg-white rounded shadow p-4 flex justify-between items-center">
              <div>
                <div className="font-semibold">{t.process_name} — {t.order_code}</div>
                <div className="text-sm text-gray-500">Trạng thái: {t.status}</div>
              </div>
              <div className="space-x-2">
                {t.status === 'pending' && (
                  <button disabled={!!updating} onClick={() => handleAction(t.id, 'start')} className="px-3 py-1 bg-blue-600 text-white rounded">
                    Bắt đầu
                  </button>
                )}
                {t.status === 'in_progress' && (
                  <button disabled={!!updating} onClick={() => handleAction(t.id, 'complete')} className="px-3 py-1 bg-green-600 text-white rounded">
                    Hoàn thành
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}


