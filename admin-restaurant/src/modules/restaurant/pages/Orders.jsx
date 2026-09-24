import { useState, useEffect } from 'react';
import {
  Search,
  Clock,
  Package,
  AlertCircle,
  X,
  User,
  Phone,
  MapPin,
  Store,
  Bike
} from 'lucide-react';
import API from '../../../services/api';

const Orders = () => {
  const [ordersData, setOrdersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // 1. Fetch Orders from Laravel API
  const fetchOrders = async () => {
    try {
      const restaurantId = localStorage.getItem('restaurant_id');
      const params = restaurantId ? { restaurant_id: restaurantId } : {};
      const response = await API.get('/restaurant/orders', { params });
      if (response.data.success) {
        setOrdersData(Array.isArray(response.data.orders) ? response.data.orders : []);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders data! Please check your network connection or server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchOrders();
    });
  }, []);

  // 2. Update Status Function (sending real_id to Laravel)
  const handleUpdateStatus = async (realId, newStatus) => {
    try {
      setUpdatingId(realId);
      const response = await API.patch(`/restaurant/orders/${realId}/status`, { status: newStatus });

      if (response.data.success) {
        // Update local React state immediately using real_id
        setOrdersData((prevOrders) =>
          prevOrders.map((order) =>
            order.real_id === realId ? { ...order, status: response.data.status } : order
          )
        );

        // Update modal state if open
        if (selectedOrderDetails && selectedOrderDetails.real_id === realId) {
          setSelectedOrderDetails((prev) => ({ ...prev, status: response.data.status }));
        }

        // Marking an order ready triggers the backend's automatic nearest-rider
        // assignment, so the rider details only become accurate on a re-fetch.
        if (newStatus === 'Ready') {
          await fetchOrders();
          if (response.data.assigned_rider_id) {
            alert(`Order is ready - rider #${response.data.assigned_rider_id} was assigned.`);
          } else {
            alert('Order is ready. No rider is available right now - it will be assigned automatically.');
          }
        }

        return;
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      alert(`Failed to update status: ${err.response?.data?.message || 'Please try again.'}`);
    } finally {
      setUpdatingId(null);
    }
  };

  // 3. Filter and Search Logic
  const filteredOrders = ordersData.filter((order) => {
    const status = order.status || '';
    const orderId = order.id || '';
    const customer = order.customer || '';
    const query = searchQuery.toLowerCase();
    const matchesTab = activeTab === 'All' || status.toLowerCase() === activeTab.toLowerCase();
    const matchesSearch =
      orderId.toLowerCase().includes(query) ||
      customer.toLowerCase().includes(query) ||
      (order.phone && order.phone.includes(searchQuery));

    return matchesTab && matchesSearch;
  });

  // Helper Badge Styling — square, left-accented tag instead of a rounded pill
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-[#EEF2F8] text-[#0B1F3B] border-l-2 border-[#0B1F3B]';
      case 'Accepted':
        return 'bg-[#EEF2F8] text-[#0B1F3B] border-l-2 border-[#0B1F3B]';
      case 'Preparing':
        return 'bg-amber-50 text-amber-700 border-l-2 border-amber-500';
      case 'Ready':
        return 'bg-emerald-50 text-emerald-700 border-l-2 border-emerald-500';
      case 'Delivering':
        return 'bg-sky-50 text-sky-700 border-l-2 border-sky-500';
      case 'Delivered':
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-l-2 border-emerald-700';
      case 'Cancelled':
        return 'bg-[#FBEEEC] text-[#A6321E] border-l-2 border-[#A6321E]';
      default:
        return 'bg-slate-50 text-slate-600 border-l-2 border-slate-400';
    }
  };

  // What the restaurant should read in place of the raw status: the delivery
  // leg has its own progress (a rider can already be assigned while the order
  // itself is still "Ready").
  const getStatusLabel = (order) => {
    const status = order.status || '';
    if (status === 'Ready') {
      if (order.delivery_status === 'assigned') return 'Ready — Rider Assigned';
      if (order.delivery_status === 'picked_up' || order.delivery_status === 'delivering') return 'Rider Picked Up';
      if (order.order_type === 'pickup') return 'Ready for Pick-up';
      return 'Ready — Waiting for Rider';
    }
    if (status === 'Delivered') return 'Delivered';
    return status;
  };

  const tabs = ['All', 'Pending', 'Accepted', 'Preparing', 'Ready', 'Delivering', 'Delivered', 'Cancelled'];

  return (
    <div className="p-6 space-y-6 bg-[#F4F5F7] min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1F3B]">Order Management</h1>
          <p className="text-sm text-slate-500">Monitor and update incoming customer orders</p>
        </div>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-[#0B1F3B] text-white text-sm font-semibold hover:bg-[#132C52] transition cursor-pointer"
        >
          Refresh Data
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 border border-[#D6DBE3] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeTab === tab
                    ? 'bg-[#0B1F3B] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Inputs */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by Order ID, Name, Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#FAFBFC] border border-[#D6DBE3] text-xs focus:outline-none focus:border-[#0B1F3B] transition"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#D6DBE3]">
          <div className="w-10 h-10 border-4 border-[#0B1F3B] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm text-slate-500 font-medium">Loading order data...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-[#FBEEEC] border border-[#F0D5CF] text-center">
          <AlertCircle className="w-10 h-10 text-[#A6321E] mx-auto mb-2" />
          <p className="text-[#A6321E] font-medium">{error}</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 bg-white border border-[#D6DBE3] text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">No Orders Found</h3>
          <p className="text-xs text-slate-400 mt-1">There are no orders matching your selected criteria.</p>
        </div>
      ) : (
        /* Orders List */
        <div className="grid gap-4">
          {filteredOrders.map((order) => (
            <div
              key={order.real_id}
              className="bg-white border border-[#D6DBE3] p-5 hover:border-[#0B1F3B] transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              {/* Left Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-bold text-[#1A2233] text-base">{order.id}</span>
                  <span className={`px-2.5 py-1 text-xs font-semibold ${getStatusBadge(order.status)}`}>
                    {getStatusLabel(order)}
                  </span>
                  <span className={`px-2.5 py-1 text-xs font-semibold flex items-center gap-1 ${
                    order.order_type === 'pickup'
                      ? 'bg-violet-50 text-violet-700 border-l-2 border-violet-500'
                      : 'bg-sky-50 text-sky-700 border-l-2 border-sky-500'
                  }`}>
                    {order.order_type === 'pickup' ? <Store className="w-3.5 h-3.5" /> : <Bike className="w-3.5 h-3.5" />}
                    {order.order_type === 'pickup' ? 'Pick-up' : 'Delivery'}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {order.time}
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <p><span className="font-medium text-slate-700">Customer:</span> {order.customer} {order.phone ? `(${order.phone})` : ''}</p>
                  <p><span className="font-medium text-slate-700">Items:</span> {order.items}</p>
                  {order.rider && (
                    <p className="flex items-center gap-1 text-sky-700">
                      <Bike className="w-3.5 h-3.5" />
                      <span className="font-medium">Rider:</span> {order.rider}
                      {order.rider_phone ? ` (${order.rider_phone})` : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end border-t border-[#EBEDF1] pt-3 lg:pt-0 lg:border-t-0">
                {updatingId === order.real_id ? (
                  <span className="text-xs text-slate-400 font-medium px-4">Updating...</span>
                ) : (
                  <>
                    {order.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(order.real_id, 'Preparing')}
                          className="px-3.5 py-1.5 bg-[#0B1F3B] text-white text-xs font-bold hover:bg-[#132C52] transition cursor-pointer"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(order.real_id, 'Cancelled')}
                          className="px-3.5 py-1.5 text-[#A6321E] text-xs font-bold hover:bg-[#FBEEEC] transition cursor-pointer"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {order.status === 'Accepted' && (
                      <button 
                        onClick={() => handleUpdateStatus(order.real_id, 'Preparing')}
                        className="px-3.5 py-1.5 bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition cursor-pointer"
                      >
                        Start Preparing
                      </button>
                    )}

                    {order.status === 'Preparing' && (
                      <button
                        onClick={() => handleUpdateStatus(order.real_id, 'Ready')}
                        className="px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition cursor-pointer"
                      >
                        {order.order_type === 'pickup' ? 'Mark Ready for Pickup' : 'Mark Ready'}
                      </button>
                    )}

                    {order.status === 'Ready' && order.order_type === 'pickup' && (
                      <button
                        onClick={() => handleUpdateStatus(order.real_id, 'Completed')}
                        className="px-3.5 py-1.5 bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition cursor-pointer"
                      >
                        Mark Picked Up
                      </button>
                    )}

                    {/* A delivery order at READY_FOR_PICKUP is matched to a
                        rider by the backend - the restaurant just waits. */}
                    {order.status === 'Ready' && order.order_type !== 'pickup' && (
                      <span className="px-3.5 py-1.5 bg-slate-100 text-slate-500 text-xs font-semibold">
                        {order.delivery_status === 'assigned'
                          ? 'Rider on the way'
                          : 'Waiting for a rider'}
                      </span>
                    )}

                    <button 
                      onClick={() => setSelectedOrderDetails(order)}
                      className="px-3.5 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
                    >
                      Details
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Order Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-[#0B1F3B]/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-lg w-full shadow-2xl space-y-0 max-h-[90vh] overflow-y-auto border border-[#D6DBE3]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#D6DBE3] bg-[#0B1F3B]">
              <div>
                <h3 className="text-lg font-bold text-white">Order Details - {selectedOrderDetails.id}</h3>
                <p className="text-xs text-white/70">{selectedOrderDetails.time}</p>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1.5 text-white/70 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Details */}
              <div className="space-y-2 bg-[#FAFBFC] p-4 border border-[#D6DBE3] text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <User className="w-4 h-4 text-[#0B1F3B]" />
                  <span className="font-semibold">Customer:</span> {selectedOrderDetails.customer}
                </div>
                {selectedOrderDetails.phone && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="w-4 h-4 text-[#0B1F3B]" />
                    <span className="font-semibold">Phone:</span> {selectedOrderDetails.phone}
                  </div>
                )}
                {selectedOrderDetails.order_type === 'pickup' ? (
                  <div className="flex items-start gap-2 text-slate-700">
                    <Store className="w-4 h-4 text-[#0B1F3B] mt-0.5" />
                    <span>
                      <strong className="font-semibold">Pick-up in person</strong>
                      {selectedOrderDetails.pickup_location && ` — ${selectedOrderDetails.pickup_location}`}
                    </span>
                  </div>
                ) : selectedOrderDetails.address && (
                  <div className="flex items-start gap-2 text-slate-700">
                    <MapPin className="w-4 h-4 text-[#0B1F3B] mt-0.5" />
                    <span><strong className="font-semibold">Address:</strong> {selectedOrderDetails.address}</span>
                  </div>
                )}
                {selectedOrderDetails.order_type !== 'pickup' && (
                  <div className="flex items-start gap-2 text-slate-700">
                    <Bike className="w-4 h-4 text-[#0B1F3B] mt-0.5" />
                    <span>
                      <strong className="font-semibold">Delivery:</strong>{' '}
                      {selectedOrderDetails.rider
                        ? `${selectedOrderDetails.rider}${selectedOrderDetails.rider_phone ? ` (${selectedOrderDetails.rider_phone})` : ''}`
                        : 'No rider assigned yet'}
                    </span>
                  </div>
                )}
              </div>

              {/* Items Summary */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 mb-3">Ordered Items</h4>
                <div className="p-3 bg-[#FAFBFC] border border-[#D6DBE3] text-xs text-slate-700 font-medium">
                  {selectedOrderDetails.items}
                </div>
                <div className="flex justify-between items-center pt-4 text-sm font-bold text-[#1A2233]">
                  <span>Total Price:</span>
                  <span className="text-[#0B1F3B]">{selectedOrderDetails.price}</span>
                </div>
              </div>

              {/* Close Button */}
              <button 
                onClick={() => setSelectedOrderDetails(null)}
                className="w-full py-2.5 bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;