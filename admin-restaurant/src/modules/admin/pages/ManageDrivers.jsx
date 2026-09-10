import { useEffect, useState } from 'react';
import { 
  Search, 
  Users, 
  Bike, 
  Clock, 
  Star, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Car, 
  UserPlus, 
  X, 
  Edit2, 
  Trash2,
  Loader2
} from 'lucide-react';
import { createDriver, deleteDriver, getDrivers, updateDriver } from '../../../services/driverService';

export default function ManageDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  // Shown once right after a rider account is created, since the temporary
  // password is only ever returned in that single API response.
  const [createdCredentials, setCreatedCredentials] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    vehicle: 'Moto',
    status: 'Online'
  });

  useEffect(() => {
    let isMounted = true;

    getDrivers()
      .then((response) => {
        if (!isMounted) return;

        const resData = response.data;
        const driverList = Array.isArray(resData) ? resData : (resData.data || []);
        setDrivers(driverList);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.response?.data?.message || err.message || 'Unable to load driver data.');
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. POST / PUT: Create or Update Driver
  const handleSaveDriver = async (e) => {
    e.preventDefault();
    try {
      const response = editingDriver
        ? await updateDriver(editingDriver.id, formData)
        : await createDriver(formData);
      const resData = response.data;
      const savedDriver = resData.data || resData;

      if (editingDriver) {
        setDrivers((currentDrivers) => currentDrivers.map(d => d.id === editingDriver.id ? savedDriver : d));
      } else {
        setDrivers((currentDrivers) => [savedDriver, ...currentDrivers]);
        if (savedDriver.temporary_password) {
          setCreatedCredentials({ email: savedDriver.email, password: savedDriver.temporary_password });
        }
      }

      setIsModalOpen(false);
      setEditingDriver(null);
    } catch (err) {
      alert(`Error: ${err.response?.data?.message || err.message || 'An error occurred while saving data.'}`);
    }
  };

  // 3. PATCH / PUT: Verify Driver (Change status to Online)
  const handleVerify = async (id) => {
    try {
      const response = await updateDriver(id, { status: 'Online' });
      const resData = response.data;
      const updatedDriver = resData.data || resData;

      setDrivers((currentDrivers) => currentDrivers.map(d => d.id === id ? updatedDriver : d));
    } catch (err) {
      alert(`Error: ${err.response?.data?.message || err.message || 'An error occurred while updating status.'}`);
    }
  };

  // 4. DELETE: Remove Driver
  const handleDeleteDriver = async (id) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      try {
        await deleteDriver(id);

        setDrivers((currentDrivers) => currentDrivers.filter(d => d.id !== id));
      } catch (err) {
        alert(`Error: ${err.response?.data?.message || err.message || 'Unable to delete this driver.'}`);
      }
    }
  };

  // Calculate Stat Cards
  const totalDrivers = drivers.length;
  const activeNow = drivers.filter(d => d.status === 'Online').length;
  const pendingVerif = drivers.filter(d => d.status === 'Pending').length;

  // Filter Data
  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch = driver.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          driver.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVehicle = vehicleFilter === 'All' || driver.vehicle === vehicleFilter;
    const matchesStatus = statusFilter === 'All' || driver.status === statusFilter;
    return matchesSearch && matchesVehicle && matchesStatus;
  });

  // Open Add/Edit Modal
  const handleOpenModal = (driver = null) => {
    if (driver) {
      setEditingDriver(driver);
      setFormData({
        name: driver.name || '',
        email: driver.email || '',
        phone: driver.phone || '',
        vehicle: driver.vehicle || 'Moto',
        status: driver.status || 'Online'
      });
    } else {
      setEditingDriver(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        vehicle: 'Moto',
        status: 'Online'
      });
    }
    setIsModalOpen(true);
  };

  // Vehicle Icon helper
  const renderVehicleIcon = (vehicle) => {
    switch (vehicle) {
      case 'Car': return <Car size={13} />;
      case 'Moto': return <Bike size={13} />;
      default: return <Bike size={13} />;
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-[#fffaf8] min-h-screen text-slate-800 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Driver Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Oversee delivery partners, performance, and compliance.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium text-sm rounded-xl shadow-sm transition w-full sm:w-auto"
        >
          <UserPlus size={16} /> Add New Driver
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-orange-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">TOTAL DRIVERS</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{totalDrivers.toLocaleString()}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-orange-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">ACTIVE NOW</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{activeNow}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
            <Bike size={20} />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-orange-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">PENDING VERIF.</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{pendingVerif}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-orange-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">AVG. RATING</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">4.8</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center shrink-0">
            <Star size={20} />
          </div>
        </div>
      </div>

      {/* Drivers Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        
        {/* Search & Filter Bar */}
        <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search drivers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Vehicles</option>
              <option value="Moto">Moto</option>
              <option value="Bike">Bike</option>
              <option value="Car">Car</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
              <option value="Pending">Pending</option>
            </select>

            <button className="px-3 py-2 bg-rose-50 text-rose-500 font-medium text-sm rounded-xl hover:bg-rose-100 transition flex items-center gap-1.5">
              <Filter size={15} /> Filter
            </button>
          </div>
        </div>

        {/* Table Overflow Container */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-500 gap-2">
              <Loader2 className="animate-spin" size={20} /> Loading drivers...
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 bg-slate-50/50">
                  <th className="py-3.5 px-4 sm:px-6">Driver Name</th>
                  <th className="py-3.5 px-4 sm:px-6">Status</th>
                  <th className="py-3.5 px-4 sm:px-6">Completed Orders</th>
                  <th className="py-3.5 px-4 sm:px-6">Avg. Rating</th>
                  <th className="py-3.5 px-4 sm:px-6">Earnings (Wk)</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredDrivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-orange-50/10 transition">
                    {/* Driver Name & Avatar */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        {driver.avatar ? (
                          <img src={driver.avatar} alt={driver.name} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0">
                            {driver.name ? driver.name.charAt(0) : 'D'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 leading-tight truncate">{driver.name}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            {renderVehicleIcon(driver.vehicle)} {driver.vehicle || 'Moto'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                      {driver.status === 'Online' && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-700">Online</span>
                      )}
                      {driver.status === 'Offline' && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-100/80 text-rose-600">Offline</span>
                      )}
                      {driver.status === 'Pending' && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100/80 text-orange-600">Pending</span>
                      )}
                    </td>

                    {/* Orders */}
                    <td className="py-4 px-4 sm:px-6 font-medium text-slate-700 whitespace-nowrap">
                      {driver.completedOrders ?? 0}
                    </td>

                    {/* Rating */}
                    <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                      {driver.avgRating ? (
                        <span className="flex items-center gap-1 font-semibold text-slate-800 text-xs">
                          <Star size={14} className="text-blue-500 fill-blue-500" /> {driver.avgRating}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">N/A</span>
                      )}
                    </td>

                    {/* Earnings */}
                    <td className="py-4 px-4 sm:px-6 font-semibold text-slate-800 whitespace-nowrap">
                      ${Number(driver.earningsWk || 0).toFixed(2)}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {driver.status === 'Pending' ? (
                          <button 
                            onClick={() => handleVerify(driver.id)}
                            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                          >
                            Verify
                          </button>
                        ) : (
                          <button 
                            onClick={() => { setSelectedDriver(driver); setIsDetailOpen(true); }}
                            className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg transition"
                          >
                            Details
                          </button>
                        )}

                        <button 
                          onClick={() => handleOpenModal(driver)}
                          className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                          title="Edit Driver"
                        >
                          <Edit2 size={16} />
                        </button>

                        <button 
                          onClick={() => handleDeleteDriver(driver.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Driver"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 text-xs text-slate-500">
          <span>Showing 1 to {filteredDrivers.length} of {drivers.length} drivers</span>
          <div className="flex items-center gap-1 font-medium">
            <button className="p-1 hover:text-slate-800 transition"><ChevronLeft size={16} /></button>
            <button className="w-7 h-7 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center font-bold">1</button>
            <button className="w-7 h-7 hover:bg-slate-100 rounded-full flex items-center justify-center">2</button>
            <button className="w-7 h-7 hover:bg-slate-100 rounded-full flex items-center justify-center">3</button>
            <span>...</span>
            <button className="p-1 hover:text-slate-800 transition"><ChevronRight size={16} /></button>
          </div>
        </div>

      </div>

      {/* Add / Edit Driver Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                {editingDriver ? 'Edit Driver' : 'Add New Driver'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveDriver} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Driver Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
                  placeholder="e.g. Sokha Mean"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
                  placeholder="e.g. sokha@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
                  placeholder="e.g. +855 12 345 678"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Vehicle Type</label>
                  <select
                    value={formData.vehicle}
                    onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="Moto">Moto</option>
                    <option value="Bike">Bike</option>
                    <option value="Car">Car</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-sm transition"
                >
                  {editingDriver ? 'Save Changes' : 'Create Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Driver Details Modal */}
      {isDetailOpen && selectedDriver && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsDetailOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1">
              <X size={20} />
            </button>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 mx-auto flex items-center justify-center font-bold text-xl mb-3">
                {selectedDriver.name ? selectedDriver.name.charAt(0) : 'D'}
              </div>
              <h3 className="font-bold text-lg text-slate-900">{selectedDriver.name}</h3>
              <p className="text-xs text-slate-500">{selectedDriver.email}</p>
              
              <div className="mt-4 pt-4 border-t border-slate-100 text-left space-y-2.5 text-sm">
                <p className="flex justify-between"><strong className="text-slate-600">Phone:</strong> {selectedDriver.phone || 'N/A'}</p>
                <p className="flex justify-between"><strong className="text-slate-600">Vehicle:</strong> {selectedDriver.vehicle || 'Moto'}</p>
                <p className="flex justify-between"><strong className="text-slate-600">Status:</strong> {selectedDriver.status}</p>
                <p className="flex justify-between"><strong className="text-slate-600">Orders Completed:</strong> {selectedDriver.completedOrders ?? 0}</p>
                <p className="flex justify-between"><strong className="text-slate-600">Rating:</strong> {selectedDriver.avgRating || 'N/A'}</p>
                <p className="flex justify-between"><strong className="text-slate-600">Earnings (Wk):</strong> ${Number(selectedDriver.earningsWk || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rider Credentials Modal — shown once right after creation, since the
          temporary password is never retrievable again after this point. */}
      {createdCredentials && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 relative">
            <button onClick={() => setCreatedCredentials(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1">
              <X size={20} />
            </button>
            <h3 className="font-bold text-lg text-slate-900 mb-1">Rider account created</h3>
            <p className="text-xs text-slate-500 mb-4">Share these credentials with the rider. This password will not be shown again.</p>
            <div className="space-y-2 text-sm bg-slate-50 border border-slate-100 rounded-xl p-4">
              <p><strong className="text-slate-600">Email:</strong> {createdCredentials.email}</p>
              <p><strong className="text-slate-600">Temporary password:</strong> <span className="font-mono font-semibold">{createdCredentials.password}</span></p>
            </div>
            <button
              onClick={() => setCreatedCredentials(null)}
              className="w-full mt-4 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
