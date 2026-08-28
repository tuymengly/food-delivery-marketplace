import React, { useState } from 'react';
import Sidebar from '../components/DriverSidebar';
import Header from '../components/Header'; 
import { 
  Utensils, 
  Navigation, 
  History, 
  Wallet,
  CheckCircle,
  Package,
  User
} from 'lucide-react';

export default function DriverDashboard() {
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState('requests');
  const [activeOrder, setActiveOrder] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const user = {
    name: 'Tom Wright',
    role: 'Super Admin'
  };

  const availableRequests = [
    {
      id: 101,
      priority: 'High Priority',
      price: '$12.50',
      restaurant: 'Burger Joint - Downtown',
      customer: 'Sokha Chen',
      phone: '012 345 678',
      dropoff: '123 Main St, Apt 4B',
      distance: '3.2 mi total',
      estTime: 'Est. 15 min',
      isHighPriority: true,
    },
    {
      id: 102,
      priority: null,
      price: '$8.75',
      restaurant: 'Sushi Master',
      customer: 'Bopha Vang',
      phone: '098 765 432',
      dropoff: '456 Elm St, Suite 200',
      distance: '1.5 mi total',
      estTime: 'Est. 8 min',
      isHighPriority: false,
    },
  ];

  const recentHistory = [
    { id: '#Order #8924', date: 'Today, 10:30 AM', amount: '+$14.20', status: 'Completed' },
    { id: '#Order #8923', date: 'Today, 09:15 AM', amount: '+$9.50', status: 'Completed' },
    { id: '#Order #8922', date: 'Yesterday', amount: '+$11.00', status: 'Completed' },
  ];

  const handleAcceptOrder = (req) => setActiveOrder({ ...req, status: 'accepted' });
  const handlePickupFood = () => setActiveOrder(prev => ({ ...prev, status: 'picked_up' }));
  const handleStartDelivery = () => setActiveOrder(prev => ({ ...prev, status: 'delivering' }));
  const handleCompleteDelivery = () => {
    setActiveOrder(null);
    alert('ការដឹកជញ្ជូនត្រូវបានបញ្ចប់ដោយជោគជ័យ!');
  };

  const navItems = [
    { id: 'requests', label: 'Delivery Requests', icon: Package },
    { id: 'history', label: 'Delivery History', icon: History },
    { id: 'earnings', label: 'View Earnings', icon: Wallet },
    { id: 'profile', label: 'Driver Profile', icon: User },
  ];

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 font-sans overflow-hidden relative">
      
      <Sidebar 
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        navItems={navItems}
      />

      <div className="flex-1 flex flex-col h-screen overflow-y-auto w-full bg-[#f8fafc]">
        
        <Header 
          setIsSidebarOpen={setIsSidebarOpen}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          user={user}
        />

        <main className="p-6 sm:p-8 space-y-6 w-full max-w-7xl mx-auto">
          
          {/* Top Bar / Overview */}
          <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-900 capitalize">{activeTab} Overview</h2>
              <p className="text-xs text-slate-400">Manage your active tasks and deliveries</p>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100">
              <span className={`text-[11px] font-bold tracking-wider ${isOnline ? 'text-emerald-600' : 'text-slate-400'}`}>
                {isOnline ? 'AVAILABLE' : 'OFFLINE'}
              </span>
              <button
                onClick={() => setIsOnline(!isOnline)}
                className={`w-10 h-5.5 flex items-center rounded-full p-0.5 transition-colors ${
                  isOnline ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <span className="w-4 h-4 bg-white rounded-full shadow-md" />
              </button>
            </div>
          </div>

          {/* Active Delivery Card */}
          {activeOrder && (
            <div className="bg-white rounded-2xl border-2 border-orange-500 shadow-md p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold flex items-center gap-1.5">
                  <Package size={14} /> Active Delivery Step
                </span>
                <span className="text-xl font-bold text-slate-900">{activeOrder.price}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pickup Location</p>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800">{activeOrder.restaurant}</h4>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Drop-off Customer</p>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800">{activeOrder.customer} ({activeOrder.phone})</h4>
                  <p className="text-xs text-slate-500">{activeOrder.dropoff}</p>
                </div>
              </div>

              <div>
                {activeOrder.status === 'accepted' && (
                  <button onClick={handlePickupFood} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm">
                    <Utensils size={16} /> Step 1: Pickup Food
                  </button>
                )}
                {activeOrder.status === 'picked_up' && (
                  <button onClick={handleStartDelivery} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm">
                    <Navigation size={16} /> Step 2: Start Delivery
                  </button>
                )}
                {activeOrder.status === 'delivering' && (
                  <button onClick={handleCompleteDelivery} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm">
                    <CheckCircle size={16} /> Step 3: Complete Delivery
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Delivery Requests Tab */}
          {activeTab === 'requests' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Available Delivery Requests</h3>

                {!isOnline ? (
                  <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-slate-400 font-medium shadow-sm">
                    សូមប្តូរ Driver Status ទៅជា <span className="text-emerald-600 font-bold">AVAILABLE</span> ដើម្បីទទួលអូឌើ។
                  </div>
                ) : (
                  availableRequests.map((req) => (
                    <div key={req.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 hover:shadow-md transition">
                      <div className="flex items-center justify-between">
                        {req.isHighPriority ? (
                          <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-lg text-[11px] font-bold">
                            {req.priority}
                          </span>
                        ) : <div />}
                        <span className="text-xl font-bold text-slate-900">{req.price}</span>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-3 relative pl-6 border-l-2 border-dashed border-slate-200 ml-2">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PICKUP</p>
                            <h4 className="text-xs font-bold text-slate-800">{req.restaurant}</h4>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DROP-OFF</p>
                            <h4 className="text-xs font-bold text-slate-800">{req.dropoff}</h4>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleAcceptOrder(req)}
                          disabled={activeOrder !== null}
                          className={`w-full sm:w-auto px-6 py-2.5 text-white font-bold rounded-xl text-xs transition shadow-sm ${
                            activeOrder !== null ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#ea580c] hover:bg-[#c2410c]'
                          }`}
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Right Summary Panel */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
                    <Wallet size={16} className="text-[#ea580c]" />
                    <span>Today's Earnings</span>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900">$142.50</h2>
                  <p className="text-xs text-slate-400">12 deliveries completed today</p>
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Delivery History</h3>
              <div className="divide-y divide-slate-100">
                {recentHistory.map((item, idx) => (
                  <div key={idx} className="py-3.5 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{item.id}</h4>
                      <p className="text-[10px] text-slate-400">{item.date}</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">{item.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Earnings Tab */}
          {activeTab === 'earnings' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Earnings Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 bg-orange-50/50 border border-orange-100 rounded-xl">
                  <p className="text-xs text-slate-500 font-bold">This Week</p>
                  <h4 className="text-2xl font-black text-orange-600">$450.00</h4>
                </div>
                <div className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                  <p className="text-xs text-slate-500 font-bold">This Month</p>
                  <h4 className="text-2xl font-black text-emerald-600">$1,820.00</h4>
                </div>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Driver Profile Details</h3>
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover border-2 border-orange-500"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Yorn Rotha</h4>
                  <p className="text-xs text-slate-500">Vehicle: Honda Dream (Phnom Penh 1AB-2345)</p>
                  <span className="text-[10px] bg-emerald-50 text-emerald-600 font-bold px-2.5 py-0.5 rounded-md mt-1 inline-block border border-emerald-100">
                    Verified Driver
                  </span>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}