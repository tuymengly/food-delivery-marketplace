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
    role: 'customer',
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
        role: String(user.role || 'customer').toLowerCase(),
        status: user.status || 'Active',
        location: user.location || ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'customer',
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
      alert(error.response?.data?.message || 'There was a problem saving the data.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete User
  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await deleteUser(id);
        setUsers(users.filter(u => u.id !== id));
        setSelectedUsers(selectedUsers.filter(userId => userId !== id));
      } catch (error) {
        console.error('Failed to delete user:', error);
        alert('Failed to delete user:!');
      }
    }
  };

  // Filter Data Logic
  const filteredUsers = users.filter((user) => {
    const matchesSearch = (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (user.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'All Roles' || String(user.role || '').toLowerCase() === roleFilter;
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
      alert('There is no data available to export.');
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
    switch (String(role || '').toLowerCase()) {
      case 'customer':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100/70 text-blue-600"><User size={13} /> Customer</span>;
      case 'restaurant':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-100/70 text-orange-700"><Utensils size={13} /> Restaurant</span>;
      case 'rider':
      case 'driver':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100/70 text-amber-700"><Bike size={13} /> Rider</span>;
      case 'admin':
      case 'super_admin':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-200 text-slate-700"><Lock size={13} /> Admin</span>;
      default: return <span className="text-xs text-slate-500">{role}</span>;
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
      default: return <span className="text-xs text-slate-500">{status}</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-[#F4F5F7] min-h-screen text-[#1A2233] space-y-6">

  {/* Header */}
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-[#D6DBE3]">
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1F3B] tracking-tight">User Management</h1>
      <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage all platform users, roles, and access permissions.</p>
    </div>

    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <div className="relative w-full sm:w-72">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search users by name, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-white border border-[#D6DBE3] text-xs sm:text-sm focus:outline-none focus:border-[#0B1F3B] transition"
        />
      </div>

      <button
        onClick={() => handleOpenModal()}
        className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0B1F3B] hover:bg-[#132C52] text-white font-semibold text-xs sm:text-sm transition shrink-0 cursor-pointer"
      >
        <UserPlus size={15} /> Add New User
      </button>
    </div>
  </div>

  {/* Main Table Card */}
  <div className="bg-white border border-[#D6DBE3]">

    {/* Filter Bar */}
    <div className="p-4 border-b border-[#D6DBE3] flex flex-wrap items-center justify-between gap-4 bg-[#FAFBFC]">
      <div className="flex flex-wrap items-center gap-2.5">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-1.5 bg-white border border-[#D6DBE3] text-xs font-medium text-[#1A2233] hover:border-[#0B1F3B] focus:outline-none cursor-pointer"
        >
          <option value="All Roles">All Roles</option>
          <option value="customer">Customer</option>
          <option value="restaurant">Restaurant</option>
          <option value="rider">Rider</option>
          <option value="admin">Admin</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-white border border-[#D6DBE3] text-xs font-medium text-[#1A2233] hover:border-[#0B1F3B] focus:outline-none cursor-pointer"
        >
          <option value="All Statuses">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Pending">Pending</option>
          <option value="Suspended">Suspended</option>
        </select>

        <button
          onClick={() => { setSearchTerm(''); setRoleFilter('All Roles'); setStatusFilter('All Statuses'); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0B1F3B] hover:bg-[#EEF2F8] border border-transparent hover:border-[#D6DBE3] transition cursor-pointer"
        >
          <Filter size={13} /> Reset Filters
        </button>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span>Showing {filteredUsers.length} of {users.length}</span>
        <div className="flex items-center border border-[#D6DBE3]">
          <button className="p-1.5 hover:bg-[#EEF2F8] text-[#0B1F3B] transition border-r border-[#D6DBE3]"><ChevronLeft size={15} /></button>
          <button className="p-1.5 hover:bg-[#EEF2F8] text-[#0B1F3B] transition"><ChevronRight size={15} /></button>
        </div>
      </div>
    </div>

    {/* Table */}
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#0B1F3B] text-[11px] font-semibold text-white/90">
            <th className="py-3 px-4 w-10 text-center">
              <input
                type="checkbox"
                onChange={handleSelectAll}
                checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                className="border-slate-300 text-[#0B1F3B] focus:ring-0 cursor-pointer"
              />
            </th>
            <th className="py-3 px-4">User details</th>
            <th className="py-3 px-4">Role</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4">Location</th>
            <th className="py-3 px-4">Join date</th>
            <th className="py-3 px-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EBEDF1] text-xs sm:text-sm">
          {loading ? (
            <tr>
              <td colSpan="7" className="py-12 text-center text-slate-400">
                <Loader2 size={22} className="animate-spin mx-auto text-[#0B1F3B] mb-2" />
                Loading data...
              </td>
            </tr>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-[#F7F9FC] transition">
                <td className="py-3.5 px-4 text-center">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleSelectUser(user.id)}
                    className="border-slate-300 text-[#0B1F3B] focus:ring-0 cursor-pointer"
                  />
                </td>

                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-8 h-8 object-cover border border-[#D6DBE3]" />
                    ) : (
                      <div className="w-8 h-8 bg-[#0B1F3B] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-[#1A2233] leading-tight">{user.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
                    </div>
                  </div>
                </td>

                <td className="py-3.5 px-4">{renderRoleBadge(user.role)}</td>
                <td className="py-3.5 px-4">{renderStatusBadge(user.status)}</td>
                <td className="py-3.5 px-4 text-slate-600 text-xs font-medium">{user.location || 'N/A'}</td>
                <td className="py-3.5 px-4 text-slate-600 text-xs font-medium">{user.created_at || user.joinDate || 'N/A'}</td>

                <td className="py-3.5 px-4">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => handleOpenModal(user)}
                      className="p-1.5 text-slate-400 hover:text-[#0B1F3B] hover:bg-[#EEF2F8] transition cursor-pointer"
                      title="Edit User"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-1.5 text-slate-400 hover:text-[#A6321E] hover:bg-[#FBEEEC] transition cursor-pointer"
                      title="Delete User"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="py-12 text-center text-slate-400 text-xs sm:text-sm">
                No users found matching your criteria.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    {/* Footer */}
    <div className="p-4 border-t border-[#D6DBE3] flex items-center justify-between text-xs text-slate-500 bg-[#FAFBFC]">
      <button
        onClick={handleExportCSV}
        className="flex items-center gap-1.5 font-semibold text-[#0B1F3B] hover:bg-[#EEF2F8] px-3 py-1.5 border border-[#D6DBE3] transition cursor-pointer"
      >
        <Download size={13} /> Export CSV
      </button>
      <div>Selected: <span className="font-bold text-[#1A2233]">{selectedUsers.length}</span> users</div>
    </div>

  </div>

  {/* Modal Popup */}
  {isModalOpen && (
    <div className="fixed inset-0 bg-[#0B1F3B]/50 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md border border-[#D6DBE3] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D6DBE3] bg-[#0B1F3B]">
          <h3 className="font-bold text-white text-base">
            {editingUser ? 'Edit User Profile' : 'Add New User'}
          </h3>
          <button onClick={handleCloseModal} className="text-white/70 hover:text-white transition cursor-pointer">
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSaveUser} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-[#D6DBE3] text-xs sm:text-sm focus:outline-none focus:border-[#0B1F3B]"
              placeholder="e.g. Sarah Jenkins"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-[#D6DBE3] text-xs sm:text-sm focus:outline-none focus:border-[#0B1F3B]"
              placeholder="e.g. sarah@example.com"
            />
          </div>

          {/* Input Password សម្រាប់បង្កើត ឬកែប្រែ User */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Password {editingUser && <span className="text-slate-400 font-normal">(Leave blank to keep current)</span>}
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required={!editingUser} // បង្ខំដាក់ password ពេល Add New User ប៉ុន្តែមិនបង្ខំពេល Edit
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-9 pr-3 py-2 border border-[#D6DBE3] text-xs sm:text-sm focus:outline-none focus:border-[#0B1F3B]"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-[#D6DBE3] text-xs sm:text-sm focus:outline-none focus:border-[#0B1F3B] cursor-pointer bg-white"
              >
                <option value="customer">Customer</option>
                <option value="restaurant">Restaurant</option>
                <option value="admin">Admin</option>
              </select>
              {/* Riders are created from Manage Drivers, not here - the
                  backend intentionally rejects role=rider on this endpoint. */}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-[#D6DBE3] text-xs sm:text-sm focus:outline-none focus:border-[#0B1F3B] cursor-pointer bg-white"
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Location</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-[#D6DBE3] text-xs sm:text-sm focus:outline-none focus:border-[#0B1F3B]"
              placeholder="e.g. Phnom Penh"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#D6DBE3]">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1 px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3B] hover:bg-[#132C52] transition cursor-pointer disabled:opacity-50"
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