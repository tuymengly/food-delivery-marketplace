import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Store,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  MapPin,
  Phone,
  Mail,
  Tag,
  Image as ImageIcon,
  X,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  getRestaurantApplications,
  getRestaurantApplication,
  approveRestaurantApplication,
  rejectRestaurantApplication,
} from '../../../services/adminService';

const STATUS_LABEL = {
  pending: 'Pending',
  active: 'Approved',
  rejected: 'Rejected',
  inactive: 'Disabled',
};

const STATUS_BADGE_CLASS = {
  pending: 'bg-amber-100/80 text-amber-700',
  active: 'bg-emerald-100/80 text-emerald-600',
  rejected: 'bg-rose-100/80 text-rose-600',
  inactive: 'bg-slate-100 text-slate-500',
};

const DAY_LABELS = [
  ['monday', 'Monday'],
  ['tuesday', 'Tuesday'],
  ['wednesday', 'Wednesday'],
  ['thursday', 'Thursday'],
  ['friday', 'Friday'],
  ['saturday', 'Saturday'],
  ['sunday', 'Sunday'],
];

function StatusBadge({ status }) {
  const key = String(status || '').toLowerCase();
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_BADGE_CLASS[key] || 'bg-slate-100 text-slate-500'}`}>
      {STATUS_LABEL[key] || status}
    </span>
  );
}

export default function RestaurantApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState('Pending');
  const [searchTerm, setSearchTerm] = useState('');

  // Review modal state
  const [reviewState, setReviewState] = useState({ open: false, loading: false, application: null });
  const [actionError, setActionError] = useState('');
  const [approving, setApproving] = useState(false);

  // Reject reason modal state
  const [rejectModal, setRejectModal] = useState({ open: false, application: null });
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [rejectError, setRejectError] = useState('');

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getRestaurantApplications('all');
      setApplications(res.data.data || res.data || []);
    } catch (err) {
      console.error('Error fetching restaurant applications:', err);
      setError(err.response?.data?.message || 'Failed to load restaurant applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const counts = useMemo(() => ({
    all: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    active: applications.filter((a) => a.status === 'active').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  }), [applications]);

  const filteredApplications = applications.filter((app) => {
    const matchesTab =
      activeTab === 'All' ||
      (activeTab === 'Pending' && app.status === 'pending') ||
      (activeTab === 'Approved' && app.status === 'active') ||
      (activeTab === 'Rejected' && app.status === 'rejected');

    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      app.name?.toLowerCase().includes(term) ||
      app.user?.name?.toLowerCase().includes(term) ||
      app.user?.email?.toLowerCase().includes(term);

    return matchesTab && matchesSearch;
  });

  const notifySidebar = () => window.dispatchEvent(new Event('restaurant-application-reviewed'));

  const openReview = async (application) => {
    setReviewState({ open: true, loading: true, application });
    setActionError('');
    try {
      const res = await getRestaurantApplication(application.id);
      const full = res.data.data || res.data;
      setReviewState({ open: true, loading: false, application: full });
    } catch (err) {
      console.error('Error loading application detail:', err);
      setReviewState({ open: true, loading: false, application });
      setActionError('Could not load full application details. Showing summary only.');
    }
  };

  const closeReview = () => {
    setReviewState({ open: false, loading: false, application: null });
    setActionError('');
  };

  const handleApprove = async (application) => {
    setApproving(true);
    setActionError('');
    try {
      await approveRestaurantApplication(application.id);
      closeReview();
      await fetchApplications();
      notifySidebar();
    } catch (err) {
      console.error('Error approving application:', err);
      setActionError(err.response?.data?.message || 'Failed to approve this application.');
    } finally {
      setApproving(false);
    }
  };

  const openRejectModal = (application) => {
    setRejectModal({ open: true, application });
    setRejectReason('');
    setRejectError('');
  };

  const closeRejectModal = () => {
    setRejectModal({ open: false, application: null });
    setRejectReason('');
    setRejectError('');
  };

  const handleReject = async (event) => {
    event.preventDefault();
    if (!rejectReason.trim()) {
      setRejectError('A rejection reason is required.');
      return;
    }
    setRejecting(true);
    setRejectError('');
    try {
      await rejectRestaurantApplication(rejectModal.application.id, rejectReason.trim());
      closeRejectModal();
      closeReview();
      await fetchApplications();
      notifySidebar();
    } catch (err) {
      console.error('Error rejecting application:', err);
      setRejectError(err.response?.data?.message || 'Failed to reject this application.');
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading restaurant applications...</div>;
  }

  const app = reviewState.application;

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-[#F4F5F7] min-h-screen text-[#1A2233] space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1F3B] tracking-tight">Restaurant Applications</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">Review new restaurant registrations before they go live on the marketplace.</p>
      </div>

      {error && (
        <div className="bg-[#FBEEEC] border border-[#F0D5CF] text-[#A6321E] px-4 py-3 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" /> {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 border border-[#D6DBE3] flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total applications</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#1A2233] mt-1">{counts.all}</h3>
          </div>
          <div className="w-10 h-10 bg-[#EEF2F8] text-[#0B1F3B] flex items-center justify-center shrink-0">
            <Store size={18} />
          </div>
        </div>

        <div className="bg-white p-5 border border-[#D6DBE3] border-l-4 border-l-amber-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Pending review</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#1A2233] mt-1">{counts.pending}</h3>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock size={19} />
          </div>
        </div>

        <div className="bg-white p-5 border border-[#D6DBE3] border-l-4 border-l-emerald-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Approved</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#1A2233] mt-1">{counts.active}</h3>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={19} />
          </div>
        </div>

        <div className="bg-white p-5 border border-[#D6DBE3] border-l-4 border-l-[#A6321E] flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Rejected</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#1A2233] mt-1">{counts.rejected}</h3>
          </div>
          <div className="w-10 h-10 bg-[#F6DCD8] text-[#A6321E] flex items-center justify-center shrink-0">
            <XCircle size={18} />
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white border border-[#D6DBE3] overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-[#D6DBE3] bg-[#FAFBFC] px-4 sm:px-6 pt-4 gap-4 sm:gap-8 overflow-x-auto">
          {[
            { label: 'Pending', badge: counts.pending },
            { label: 'Approved', badge: null },
            { label: 'Rejected', badge: null },
            { label: 'All', badge: null },
          ].map((tab) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.label)}
              className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 transition whitespace-nowrap relative cursor-pointer border-b-2 -mb-px ${
                activeTab === tab.label ? 'text-[#0B1F3B] border-[#0B1F3B]' : 'text-slate-500 border-transparent hover:text-[#0B1F3B]'
              }`}
            >
              {tab.label}
              {!!tab.badge && (
                <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 font-bold">{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="p-4 border-b border-[#D6DBE3]">
          <div className="relative w-full sm:w-96">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by restaurant or owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#D6DBE3] text-xs focus:outline-none focus:border-[#0B1F3B]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-[#D6DBE3] text-[11px] font-bold text-slate-400 tracking-wider uppercase bg-[#FAFBFC]">
                <th className="py-3.5 px-4 sm:px-6">Restaurant</th>
                <th className="py-3.5 px-4 sm:px-6">Owner</th>
                <th className="py-3.5 px-4 sm:px-6">Email</th>
                <th className="py-3.5 px-4 sm:px-6">Submitted</th>
                <th className="py-3.5 px-4 sm:px-6">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDEFF3] text-sm">
              {filteredApplications.length > 0 ? (
                filteredApplications.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAFBFC] transition">
                    <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 flex items-center justify-center font-bold text-xs shrink-0 bg-[#EEF2F8] text-[#0B1F3B]">
                          {item.name?.charAt(0)}
                        </div>
                        <span className="font-semibold text-[#1A2233]">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-slate-600 font-medium whitespace-nowrap">
                      {item.user?.name || 'N/A'}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-slate-500 text-xs whitespace-nowrap">
                      {item.user?.email || 'No email'}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-slate-500 text-xs whitespace-nowrap">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-center">
                      <button
                        onClick={() => openReview(item)}
                        className="px-3 py-1.5 bg-[#0B1F3B] hover:bg-[#132C52] text-white text-xs font-semibold transition cursor-pointer"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-slate-400">
                    No applications found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {reviewState.open && app && (
        <div className="fixed inset-0 bg-[#0B1F3B]/50 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-[#D6DBE3]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#D6DBE3] bg-[#0B1F3B] sticky top-0 z-10">
              <div>
                <h3 className="font-bold text-white text-base">{app.name}</h3>
                <p className="text-[11px] text-white/60 mt-0.5">Restaurant Application Review</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={app.status} />
                <button onClick={closeReview} className="text-white/70 hover:text-white cursor-pointer">
                  <X size={19} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {reviewState.loading && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 size={14} className="animate-spin" /> Loading full application details...
                </div>
              )}

              {actionError && (
                <div className="bg-[#FBEEEC] border border-[#F0D5CF] text-[#A6321E] px-4 py-2.5 text-xs">
                  {actionError}
                </div>
              )}

              {app.status === 'rejected' && app.rejection_reason && (
                <div className="bg-[#FBEEEC] border border-[#F0D5CF] px-4 py-3 text-xs text-[#A6321E]">
                  <strong className="font-bold">Rejection reason:</strong> {app.rejection_reason}
                </div>
              )}

              {/* Cover Image */}
              {app.image && (
                <img src={app.image} alt={app.name} className="w-full h-44 object-cover border border-[#D6DBE3]" />
              )}

              {/* Restaurant Information */}
              <section>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Restaurant Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <Tag size={15} className="text-[#0B1F3B] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400">Cuisine / Category</p>
                      <p className="text-slate-800 font-medium">{app.cuisine || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone size={15} className="text-[#0B1F3B] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400">Phone</p>
                      <p className="text-slate-800 font-medium">{app.phone || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:col-span-2">
                    <MapPin size={15} className="text-[#0B1F3B] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400">Address</p>
                      <p className="text-slate-800 font-medium">{app.address || 'Not specified'}</p>
                      {app.latitude && app.longitude && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{app.latitude}, {app.longitude}</p>
                      )}
                    </div>
                  </div>
                  {app.description && (
                    <div className="sm:col-span-2">
                      <p className="text-[11px] font-semibold text-slate-400 mb-1">Description</p>
                      <p className="text-slate-700 text-sm leading-relaxed">{app.description}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Owner Information */}
              <section>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Owner Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400">Owner Name</p>
                    <p className="text-slate-800 font-medium">{app.user?.name || 'N/A'}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Mail size={15} className="text-[#0B1F3B] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400">Email</p>
                      <p className="text-slate-800 font-medium">{app.user?.email || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Opening Hours */}
              {app.opening_hours && Object.keys(app.opening_hours).length > 0 && (
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Opening Hours</h4>
                  <div className="border border-[#D6DBE3] divide-y divide-[#EDEFF3]">
                    {DAY_LABELS.map(([key, label]) => {
                      const day = app.opening_hours?.[key];
                      if (!day) return null;
                      return (
                        <div key={key} className="flex items-center justify-between px-3 py-2 text-xs">
                          <span className="font-semibold text-slate-600">{label}</span>
                          <span className="text-slate-500">
                            {day.closed ? 'Closed' : `${day.open || '—'} – ${day.close || '—'}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Photos */}
              {Array.isArray(app.photos) && app.photos.length > 0 && (
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <ImageIcon size={13} /> Restaurant Photos
                  </h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {app.photos.map((url, index) => (
                      <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt={`Restaurant photo ${index + 1}`} className="w-full h-20 object-cover border border-[#D6DBE3] hover:opacity-80 transition" />
                      </a>
                    ))}
                  </div>
                </section>
              )}

              {/* Documents */}
              <section>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <FileText size={13} /> Submitted Documents
                </h4>
                {Array.isArray(app.documents) && app.documents.length > 0 ? (
                  <div className="space-y-2">
                    {app.documents.map((doc, index) => (
                      <a
                        key={index}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-3 py-2.5 border border-[#D6DBE3] text-xs text-[#0B1F3B] hover:bg-[#EEF2F8] transition"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <FileText size={14} /> {doc.name || `Document ${index + 1}`}
                        </span>
                        <ExternalLink size={13} className="text-slate-400" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No documents submitted.</p>
                )}
              </section>
            </div>

            {/* Actions */}
            {app.status === 'pending' && (
              <div className="flex flex-col sm:flex-row justify-end gap-2 px-6 py-4 border-t border-[#D6DBE3] bg-[#FAFBFC] sticky bottom-0">
                <button
                  type="button"
                  onClick={() => openRejectModal(app)}
                  className="px-4 py-2.5 border border-[#D6DBE3] text-[#A6321E] hover:bg-[#FBEEEC] text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <XCircle size={14} /> Reject
                </button>
                <button
                  type="button"
                  onClick={() => handleApprove(app)}
                  disabled={approving}
                  className="px-4 py-2.5 bg-[#0B1F3B] hover:bg-[#132C52] text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {approving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Approve
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-[#0B1F3B]/60 backdrop-blur-[2px] z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md shadow-2xl border border-[#D6DBE3]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#D6DBE3] bg-[#A6321E]">
              <h3 className="font-bold text-white text-base">Reject Application</h3>
              <button onClick={closeRejectModal} className="text-white/80 hover:text-white cursor-pointer">
                <X size={19} />
              </button>
            </div>
            <form onSubmit={handleReject} className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                Rejecting <strong>{rejectModal.application?.name}</strong>. The owner will see this reason on their dashboard.
              </p>
              {rejectError && (
                <div className="bg-[#FBEEEC] border border-[#F0D5CF] text-[#A6321E] px-3 py-2 text-xs">
                  {rejectError}
                </div>
              )}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Rejection reason *</label>
                <textarea
                  required
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Business license photo is unreadable, please resubmit."
                  className="w-full p-3 border border-[#D6DBE3] text-xs focus:outline-none focus:border-[#A6321E] resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeRejectModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejecting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#A6321E] hover:bg-[#8A2A19] transition cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                >
                  {rejecting && <Loader2 size={14} className="animate-spin" />} Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
