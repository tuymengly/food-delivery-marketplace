import { useEffect, useRef, useState } from 'react';
import { Bell, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';

const roleConfig = {
  admin: { endpoint: '/admin/orders', target: '/admin/orders', title: 'Platform notifications' },
  restaurant: { endpoint: '/restaurant/orders', target: '/restaurant/orders', title: 'Restaurant notifications' },
  driver: { endpoint: '/driver/orders', target: '/driver/dashboard', title: 'Delivery notifications' },
};

const getRows = (response, role) => {
  const payload = response.data?.data ?? response.data ?? {};
  if (Array.isArray(payload)) return payload;
  if (role === 'driver') return payload.available_requests || payload.orders || [];
  return payload.orders || [];
};

const formatNotification = (item, role) => ({
  id: item.real_id || item.id,
  title: role === 'driver'
    ? `New delivery ${item.id || ''}`.trim()
    : `Order ${item.id || ''}`.trim(),
  detail: role === 'driver'
    ? `${item.restaurant || 'Restaurant'} to ${item.dropoff || 'customer'}`
    : `${item.customer || 'Customer'} - ${item.items || 'New order'}`,
  status: String(item.status || 'new').toLowerCase(),
  time: item.time || 'Recently',
});

export default function NotificationBell({ role = 'restaurant' }) {
  const config = roleConfig[role] || roleConfig.restaurant;
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await API.get(config.endpoint);
      setNotifications(getRows(response, role).slice(0, 5).map((item) => formatNotification(item, role)));
    } catch (error) {
      // Notification failures should not block the dashboard.
      console.warn('Could not load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();
    const timer = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(timer);
  }, [config.endpoint, role]);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  const unreadCount = notifications.filter((item) => ['new', 'pending', 'accepted'].includes(item.status)).length;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`relative rounded-xl p-2 transition ${isOpen ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:bg-slate-50'}`}
        aria-label={`Open ${config.title}`}
        aria-expanded={isOpen}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-black text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-[min(21rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.16)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-black text-slate-900">Notifications</p>
              <p className="mt-0.5 text-[11px] text-slate-400">Latest activity from your workspace</p>
            </div>
            <button type="button" onClick={loadNotifications} className="rounded-lg p-2 text-slate-400 hover:bg-orange-50 hover:text-orange-600" aria-label="Refresh notifications">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center gap-2 px-4 py-8 text-xs text-slate-400"><Loader2 size={16} className="animate-spin" /> Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-8 text-center"><Bell size={24} className="mx-auto mb-2 text-slate-300" /><p className="text-xs font-semibold text-slate-500">No new notifications</p><p className="mt-1 text-[11px] text-slate-400">You are all caught up.</p></div>
          ) : (
            <div className="max-h-80 divide-y divide-slate-50 overflow-y-auto">
              {notifications.map((item) => (
                <button key={item.id} type="button" onClick={() => { setIsOpen(false); navigate(config.target); }} className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-orange-50/60">
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${['new', 'pending', 'accepted'].includes(item.status) ? 'bg-orange-500' : 'bg-slate-300'}`} />
                  <span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-slate-800">{item.title}</span><span className="mt-1 block truncate text-[11px] text-slate-500">{item.detail}</span><span className="mt-1 block text-[10px] text-slate-400">{item.time}</span></span>
                  <ChevronRight size={15} className="mt-1 shrink-0 text-slate-300" />
                </button>
              ))}
            </div>
          )}

          <button type="button" onClick={() => { setIsOpen(false); navigate(config.target); }} className="flex w-full items-center justify-center gap-1 border-t border-slate-100 px-4 py-3 text-xs font-bold text-orange-600 hover:bg-orange-50">View all activity <ChevronRight size={14} /></button>
        </div>
      )}
    </div>
  );
}
