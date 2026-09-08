import { useState, useEffect } from 'react';
import {
  Search,
  Clock,
  Package,
  AlertCircle,
  X,
  User,
  Phone,
  MapPin
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
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Failed to update status! Please try again.');
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

  // Helper Badge Styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'New':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'Accepted':
        return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'Preparing':
        return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'Ready':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-600 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const tabs = ['All', 'New', 'Accepted', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

  return (
    <div className="p-6 space-y-6 bg-[#fcfbfa] min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Order Management</h1>
          <p className="text-sm text-slate-500">Monitor and update incoming customer orders</p>
        </div>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-700 transition"
        >
          Refresh Data
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === tab
                    ? 'bg-orange-500 text-white shadow-sm'
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
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm text-slate-500 font-medium">Loading order data...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
          <p className="text-rose-700 font-medium">{error}</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center">
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
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              {/* Left Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-800 text-base">{order.id}</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(order.status)}`}>
                    {order.status}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {order.time}
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <p><span className="font-medium text-slate-700">Customer:</span> {order.customer} {order.phone ? `(${order.phone})` : ''}</p>
                  <p><span className="font-medium text-slate-700">Items:</span> {order.items}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end border-t pt-3 lg:pt-0 lg:border-t-0">
                {updatingId === order.real_id ? (
                  <span className="text-xs text-slate-400 font-medium px-4">Updating...</span>
                ) : (
                  <>
                    {order.status === 'New' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(order.real_id, 'Accepted')}
                          className="px-3.5 py-1.5 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(order.real_id, 'Cancelled')}
                          className="px-3.5 py-1.5 text-rose-500 text-xs font-bold hover:bg-rose-50 rounded-xl transition"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {order.status === 'Accepted' && (
                      <button 
                        onClick={() => handleUpdateStatus(order.real_id, 'Preparing')}
                        className="px-3.5 py-1.5 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition"
                      >
                        Mark Preparing
                      </button>
                    )}

                    {order.status === 'Preparing' && (
                      <button 
                        onClick={() => handleUpdateStatus(order.real_id, 'Ready')}
                        className="px-3.5 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition"
                      >
                        Mark Ready
                      </button>
                    )}

                    {order.status === 'Ready' && (
                      <button 
                        onClick={() => handleUpdateStatus(order.real_id, 'Completed')}
                        className="px-3.5 py-1.5 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition"
                      >
                        Mark Completed
                      </button>
                    )}

                    <button 
                      onClick={() => setSelectedOrderDetails(order)}
                      className="px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Order Details - {selectedOrderDetails.id}</h3>
                <p className="text-xs text-slate-400">{selectedOrderDetails.time}</p>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Details */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <User className="w-4 h-4 text-orange-500" />
                <span className="font-semibold">Customer:</span> {selectedOrderDetails.customer}
              </div>
              {selectedOrderDetails.phone && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-4 h-4 text-orange-500" />
                  <span className="font-semibold">Phone:</span> {selectedOrderDetails.phone}
                </div>
              )}
              {selectedOrderDetails.address && (
                <div className="flex items-start gap-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-orange-500 mt-0.5" />
                  <span><strong className="font-semibold">Address:</strong> {selectedOrderDetails.address}</span>
                </div>
              )}
            </div>

            {/* Items Summary */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Ordered Items</h4>
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 font-medium">
                {selectedOrderDetails.items}
              </div>
              <div className="flex justify-between items-center pt-4 text-sm font-bold text-slate-800">
                <span>Total Price:</span>
                <span className="text-orange-600">{selectedOrderDetails.price}</span>
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-2">
              <button 
                onClick={() => setSelectedOrderDetails(null)}
                className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
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
