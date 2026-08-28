import React, { useState } from 'react';
import { Search, Eye, Plus, Check, X, ShieldOff, Star } from 'lucide-react';

const initialRestaurants = [
  { id: 1, name: 'The Burger Lab', owner: 'Tom Wright', status: 'Active', rating: '4.7', foods: 24, joined: 'Jun 3, 2026', avatarBg: 'bg-orange-100 text-orange-600' },
  { id: 2, name: 'Sushi Hana', owner: 'Yuki Tanaka', status: 'Active', rating: '4.8', foods: 38, joined: 'Jul 2, 2026', avatarBg: 'bg-red-100 text-red-600' },
  { id: 3, name: 'Pizza Roma', owner: 'Marco Bianchi', status: 'Active', rating: '4.5', foods: 18, joined: 'May 15, 2026', avatarBg: 'bg-amber-100 text-amber-600' },
  { id: 4, name: 'Noodle House', owner: 'Lin Wei', status: 'Pending', rating: '—', foods: 0, joined: 'Aug 20, 2026', avatarBg: 'bg-orange-100 text-orange-600' },
  { id: 5, name: 'Taco Fiesta', owner: 'Carlos Reyes', status: 'Pending', rating: '—', foods: 0, joined: 'Aug 22, 2026', avatarBg: 'bg-orange-100 text-orange-600' },
];

export default function ManageRestaurants() {
  const [restaurants, setRestaurants] = useState(initialRestaurants);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');

  // Dynamic status actions handler
  const handleStatusChange = (id, newStatus) => {
    setRestaurants((prev) =>
      prev.map((res) => (res.id === id ? { ...res, status: newStatus } : res))
    );
  };

  // Filter restaurants logic
  const filteredRestaurants = restaurants.filter((res) => {
    const matchesSearch =
      res.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || res.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = restaurants.filter((r) => r.status === 'Pending').length;

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-[#fffaf8] min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Restaurant Management
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {restaurants.length} total restaurants •{' '}
            <span className="text-orange-600 font-medium">{pendingCount} pending approval</span>
          </p>
        </div>

        <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#f96b44] hover:bg-[#e05630] text-white font-medium text-xs sm:text-sm rounded-xl shadow-xs transition w-full sm:w-auto">
          <Plus size={16} /> Add Restaurant
        </button>
      </div>

      {/* Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by restaurant or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-500 shadow-xs"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none cursor-pointer shadow-xs shrink-0"
        >
          <option value="All Status">All Status</option>
          <option value="Active">Active</option>
          <option value="Pending">Pending</option>
          <option value="Disabled">Disabled</option>
        </select>
      </div>

      {/* Restaurant Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 tracking-wider uppercase bg-gray-50/50">
                <th className="py-3.5 px-4 sm:px-6">Restaurant</th>
                <th className="py-3.5 px-4 sm:px-6">Owner</th>
                <th className="py-3.5 px-4 sm:px-6">Status</th>
                <th className="py-3.5 px-4 sm:px-6">Rating</th>
                <th className="py-3.5 px-4 sm:px-6">Foods</th>
                <th className="py-3.5 px-4 sm:px-6">Joined</th>
                <th className="py-3.5 px-4 sm:px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredRestaurants.length > 0 ? (
                filteredRestaurants.map((item) => (
                  <tr key={item.id} className="hover:bg-orange-50/10 transition">
                    {/* Restaurant Name & Avatar */}
                    <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${item.avatarBg}`}
                        >
                          {item.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-gray-900">{item.name}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 sm:px-6 text-gray-600 font-medium whitespace-nowrap">
                      {item.owner}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                      {item.status === 'Active' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-600">
                          Active
                        </span>
                      )}
                      {item.status === 'Pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100/80 text-amber-700">
                          Pending
                        </span>
                      )}
                      {item.status === 'Disabled' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                          Disabled
                        </span>
                      )}
                    </td>

                    {/* Rating */}
                    <td className="py-4 px-4 sm:px-6 font-semibold text-gray-700 whitespace-nowrap">
                      {item.rating !== '—' ? (
                        <span className="flex items-center gap-1 text-gray-800">
                          <Star size={14} className="fill-amber-400 text-amber-400" /> {item.rating}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="py-4 px-4 sm:px-6 text-gray-500 whitespace-nowrap">{item.foods} items</td>
                    <td className="py-4 px-4 sm:px-6 text-gray-400 text-xs font-medium whitespace-nowrap">
                      {item.joined}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {item.status === 'Active' && (
                          <button
                            onClick={() => handleStatusChange(item.id, 'Disabled')}
                            className="px-2.5 py-1 bg-stone-100 text-stone-600 text-xs font-semibold rounded-lg hover:bg-stone-200 transition"
                          >
                            Disable
                          </button>
                        )}

                        {item.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(item.id, 'Active')}
                              className="px-2.5 py-1 bg-emerald-100 text-emerald-600 text-xs font-semibold rounded-lg hover:bg-emerald-200 transition flex items-center gap-1"
                            >
                              <Check size={12} /> Approve
                            </button>
                            <button
                              onClick={() => handleStatusChange(item.id, 'Disabled')}
                              className="px-2.5 py-1 bg-rose-100 text-rose-600 text-xs font-semibold rounded-lg hover:bg-rose-200 transition flex items-center gap-1"
                            >
                              <X size={12} /> Reject
                            </button>
                          </>
                        )}

                        {item.status === 'Disabled' && (
                          <button
                            onClick={() => handleStatusChange(item.id, 'Active')}
                            className="px-2.5 py-1 bg-sky-100 text-sky-600 text-xs font-semibold rounded-lg hover:bg-sky-200 transition"
                          >
                            Enable
                          </button>
                        )}

                        <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition ml-1">
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-gray-400">
                    No restaurants found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}