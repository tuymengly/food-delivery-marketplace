import React, { useState, useEffect } from 'react';
import { 
  Search, 
  UserPlus, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  User,
  Utensils,
  Bike,
  Edit2,
  Trash2,
  X,
  Filter,
  Loader2,
  Lock
} from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser } from "../../../services/adminService";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '', // បន្ថែម password field នៅទីនេះ
    role: 'Customer',
    status: 'Active',
    location: ''
  });

  // Fetch Users from API
  const fetchUsersData = async () => {
    try {
      setLoading(true);
      const res = await getUsers();
      setUsers(res.data?.data || res.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersData();
  }, []);

  // Open Modal
  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '', // ពេល Edit ទុក password ទទេ សឹមដាក់បើសិនចង់ប្តូរ
        role: user.role || 'Customer',
        status: user.status || 'Active',
        location: user.location || ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'Customer',
        status: 'Active',
        location: ''
      });
    }
    setIsModalOpen(true);
  };

  // Close Modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  // Save User (Create / Update)
  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      
      // បើពេល Edit ហើយអត់បានវាយ password ថ្មី អាចលុប property password ចោលកុំឱ្យវា update ទៅជា string ទទេ
      const dataToSend = { ...formData };
      if (editingUser && !dataToSend.password) {
        delete dataToSend.password;
      }

      if (editingUser) {
        await updateUser(editingUser.id, dataToSend);
      } else {
        await createUser(dataToSend);
      }
      await fetchUsersData(); // Refresh list after save
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save user:', error);
      alert(error.response?.data?.message || 'មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ!');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete User
  const handleDeleteUser = async (id) => {
    if (window.confirm('តើអ្នកប្រាកដថាចង់លុប User នេះមែនទេ?')) {
      try {
        await deleteUser(id);
        setUsers(users.filter(u => u.id !== id));
        setSelectedUsers(selectedUsers.filter(userId => userId !== id));
      } catch (error) {
        console.error('Failed to delete user:', error);
        alert('លុបមិនបានសម្រេច!');
      }
    }
  };

  // Filter Data Logic
  const filteredUsers = users.filter((user) => {
    const matchesSearch = (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (user.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'All Roles' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'All Statuses' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Checkbox Handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(filteredUsers.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (id) => {
    setSelectedUsers(prev => 
      prev.includes(id) ? prev.filter(userId => userId !== id) : [...prev, id]
    );
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredUsers.length === 0) {
      alert('គ្មានទិន្នន័យសម្រាប់ Export ទេ!');
      return;
    }
    const headers = ['ID,Name,Email,Role,Status,Location,Join Date\n'];
    const rows = filteredUsers.map(u => `${u.id},"${u.name}",${u.email},${u.role},${u.status},"${u.location || ''}",${u.created_at || u.joinDate}`);
    const csvContent = 'data:text/csv;charset=utf-8,' + headers.concat(rows).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `users_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dynamic Badges
  const renderRoleBadge = (role) => {
    switch (role) {
      case 'Customer':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100/70 text-blue-600"><User size={13} /> Customer</span>;
      case 'Restaurant':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-100/70 text-orange-700"><Utensils size={13} /> Restaurant</span>;
      case 'Driver':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100/70 text-amber-700"><Bike size={13} /> Driver</span>;
      default: return <span className="text-xs text-gray-500">{role}</span>;
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100/80 text-emerald-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active</span>;
      case 'Pending':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100/80 text-amber-700"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Pending</span>;
      case 'Suspended':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100/80 text-rose-600">⚠️ Suspended</span>;
      default: return <span className="text-xs text-gray-500">{status}</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-[#fffaf8] min-h-screen text-gray-800 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">User Management</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage all platform users, roles, and access permissions.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition shadow-xs"
            />
          </div>

          <button 
            onClick={() => handleOpenModal()} 
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#f96b44] hover:bg-[#e05630] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition shrink-0 cursor-pointer"
          >
            <UserPlus size={16} /> Add New User
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        
        {/* Filter Bar */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none cursor-pointer shadow-xs"
            >
              <option value="All Roles">All Roles</option>
              <option value="Customer">Customer</option>
              <option value="Restaurant">Restaurant</option>
              <option value="Driver">Driver</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none cursor-pointer shadow-xs"
            >
              <option value="All Statuses">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Suspended">Suspended</option>
            </select>

            <button 
              onClick={() => { setSearchTerm(''); setRoleFilter('All Roles'); setStatusFilter('All Statuses'); }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-orange-600 hover:text-orange-700 bg-orange-50/60 rounded-xl transition cursor-pointer"
            >
              <Filter size={14} /> Reset Filters
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>Showing {filteredUsers.length} of {users.length}</span>
            <div className="flex items-center gap-1">
              <button className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 transition"><ChevronLeft size={16} /></button>
              <button className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 transition"><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#fff3ef] text-[11px] font-bold text-gray-500 tracking-wider uppercase border-b border-orange-100">
                <th className="py-3.5 px-4 w-10 text-center">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer" 
                  />
                </th>
                <th className="py-3.5 px-4">USER DETAILS</th>
                <th className="py-3.5 px-4">ROLE</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4">LOCATION</th>
                <th className="py-3.5 px-4">JOIN DATE</th>
                <th className="py-3.5 px-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400">
                    <Loader2 size={24} className="animate-spin mx-auto text-orange-500 mb-2" />
                    កំពុងទាញទិន្នន័យ...
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-orange-50/20 transition">
                    <td className="py-4 px-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer" 
                      />
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover border border-gray-100" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs shrink-0">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-900 leading-tight">{user.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">{renderRoleBadge(user.role)}</td>
                    <td className="py-4 px-4">{renderStatusBadge(user.status)}</td>
                    <td className="py-4 px-4 text-gray-600 text-xs font-medium">{user.location || 'N/A'}</td>
                    <td className="py-4 px-4 text-gray-600 text-xs font-medium">{user.created_at || user.joinDate || 'N/A'}</td>

                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => handleOpenModal(user)}
                          className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition cursor-pointer" 
                          title="Edit User"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer" 
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400 text-xs sm:text-sm">
                    No users found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 font-semibold hover:text-gray-900 transition bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 cursor-pointer"
          >
            <Download size={14} /> Export CSV
          </button>
          <div>Selected: <span className="font-bold text-gray-800">{selectedUsers.length}</span> users</div>
        </div>

      </div>

      {/* Modal Popup */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-extrabold text-gray-900 text-base">
                {editingUser ? 'Edit User Profile' : 'Add New User'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-orange-500"
                  placeholder="e.g. Sarah Jenkins"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-orange-500"
                  placeholder="e.g. sarah@example.com"
                />
              </div>

              {/* Input Password សម្រាប់បង្កើត ឬកែប្រែ User */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Password {editingUser && <span className="text-gray-400 font-normal">(Leave blank to keep current)</span>}
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    required={!editingUser} // บังคับដាក់ password ពេល Add New User ប៉ុន្តែមិនบังคับពេល Edit
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-orange-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-orange-500 cursor-pointer bg-white"
                  >
                    <option value="Customer">Customer</option>
                    <option value="Restaurant">Restaurant</option>
                    <option value="Driver">Driver</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-orange-500 cursor-pointer bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Location</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-orange-500"
                  placeholder="e.g. Phnom Penh"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1 px-4 py-2 text-xs font-semibold text-white bg-[#f96b44] hover:bg-[#e05630] rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}