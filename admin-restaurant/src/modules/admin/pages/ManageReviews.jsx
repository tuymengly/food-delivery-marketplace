import React, { useState, useEffect } from 'react';
import { 
  Star, 
  MessageSquare, 
  Clock, 
  Flag, 
  TrendingUp, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  CornerUpLeft, 
  EyeOff, 
  ShieldAlert, 
  Mail, 
  Utensils, 
  Bike, 
  X,
  Eye
} from 'lucide-react';
import { getReviews, updateReviewStatus, replyToReview } from '../../../services/adminService';

export default function ManageReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('All Reviews');
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('All Ratings');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  // Modal States
  const [replyModal, setReplyModal] = useState({ open: false, review: null });
  const [replyText, setReplyText] = useState('');
  const [contactModal, setContactModal] = useState({ open: false, review: null });
  const [contactText, setContactText] = useState('');

  // 1. Fetch Reviews Data from Laravel API
  const fetchReviewsData = async () => {
    try {
      setLoading(true);
      const res = await getReviews();
      const rawData = res.data.data || res.data || [];

      // Map API Response to UI Structure Safely
      const mappedReviews = rawData.map((item) => ({
        id: item.id,
        reviewer: item.user?.name || item.reviewer_name || 'Anonymous',
        orderId: item.order_id ? `#ORD-${item.order_id}` : (item.order?.order_number || '#ORD-N/A'),
        target: item.restaurant?.name || item.driver?.name || item.target_name || 'N/A',
        targetType: item.type || (item.restaurant_id ? 'restaurant' : 'driver'),
        rating: Number(item.rating) || 0,
        time: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A',
        comment: item.comment || item.content || 'No comment provided.',
        status: (item.status || 'PUBLISHED').toUpperCase(),
        flagReason: item.flag_reason || item.reason || null,
        avatar: item.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.user?.name || 'User')}&background=random`,
        borderColor: (item.status || '').toUpperCase() === 'FLAGGED' 
          ? 'border-l-rose-500' 
          : (item.status || '').toUpperCase() === 'HIDDEN' 
          ? 'border-l-slate-300' 
          : 'border-l-emerald-500'
      }));

      setReviews(mappedReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewsData();
  }, []);

  // Dynamic Statistics Calculation
  const totalReviewsCount = reviews.length;
  const flaggedCount = reviews.filter((r) => r.status === 'FLAGGED').length;
  const pendingCount = reviews.filter((r) => r.rating <= 2 && r.status === 'PUBLISHED').length;
  const avgRating = totalReviewsCount > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviewsCount).toFixed(1)
    : '0.0';

  // Filter Logic
  const filteredReviews = reviews.filter((rev) => {
    const matchesSearch =
      rev.reviewer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rev.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rev.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rev.comment.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesTab = true;
    if (activeTab === 'Restaurant Reviews') matchesTab = rev.targetType === 'restaurant';
    if (activeTab === 'Driver Reviews') matchesTab = rev.targetType === 'driver';
    if (activeTab === 'Flagged') matchesTab = rev.status === 'FLAGGED';

    let matchesRating = true;
    if (ratingFilter === '5 Stars') matchesRating = rev.rating === 5;
    if (ratingFilter === '4 Stars') matchesRating = rev.rating === 4;
    if (ratingFilter === '1 Star') matchesRating = rev.rating === 1;

    let matchesStatus = true;
    if (statusFilter === 'Published') matchesStatus = rev.status === 'PUBLISHED';
    if (statusFilter === 'Flagged') matchesStatus = rev.status === 'FLAGGED';
    if (statusFilter === 'Hidden') matchesStatus = rev.status === 'HIDDEN';

    return matchesSearch && matchesTab && matchesRating && matchesStatus;
  });

  // Action Handlers
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateReviewStatus(id, newStatus);
      fetchReviewsData();
    } catch (error) {
      console.error('Error updating review status:', error);
      alert('បរាជ័យក្នុងការប្តូរ Status!');
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      await replyToReview(replyModal.review?.id, { reply: replyText });
      alert(`Reply sent to ${replyModal.review?.reviewer}`);
      setReplyModal({ open: false, review: null });
      setReplyText('');
      fetchReviewsData();
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('បរាជ័យក្នុងការផ្ញើ Reply!');
    }
  };

  const handleSendContact = (e) => {
    e.preventDefault();
    if (!contactText.trim()) return;
    alert(`Message sent to ${contactModal.review?.reviewer}:\n"${contactText}"`);
    setContactModal({ open: false, review: null });
    setContactText('');
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">កំពុងទាញយក Reviews...</div>;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-[#fffaf8] min-h-screen text-slate-800 space-y-6">
      
      {/* 1. Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Reviews Management</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">Monitor customer feedback and manage platform ratings.</p>
      </div>

      {/* 2. Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Avg. Rating */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">AVG. RATING</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
              {avgRating} <Star size={22} className="text-orange-500 fill-orange-500" />
            </h3>
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-2">
              <TrendingUp size={12} /> Live average
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp size={20} />
          </div>
        </div>

        {/* Total Reviews */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">TOTAL REVIEWS</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{totalReviewsCount}</h3>
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-2">
              <TrendingUp size={12} /> Total recorded
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-xs shrink-0">
            <MessageSquare size={18} />
          </div>
        </div>

        {/* Pending Response */}
        <div className="bg-white p-5 rounded-2xl border-l-4 border-l-orange-500 border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">PENDING RESPONSE</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{pendingCount}</h3>
            <p className="text-xs text-slate-500 font-medium mt-2">Low ratings needing review</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
        </div>

        {/* Flagged Reviews */}
        <div className="bg-[#fff1eb] p-5 rounded-2xl border-l-4 border-l-rose-500 border border-rose-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase">FLAGGED REVIEWS</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1">{flaggedCount}</h3>
            <p className="text-xs text-rose-600 font-semibold mt-2">Action required immediately</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center shrink-0">
            <Flag size={18} />
          </div>
        </div>
      </div>

      {/* 3. Main Content Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/30 px-4 sm:px-6 pt-4 gap-4 sm:gap-8 overflow-x-auto">
          {[
            { label: 'All Reviews', badge: null },
            { label: 'Restaurant Reviews', badge: null },
            { label: 'Driver Reviews', badge: null },
            { label: 'Flagged', badge: flaggedCount > 0 ? flaggedCount : null }
          ].map((tab) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.label)}
              className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 transition whitespace-nowrap relative cursor-pointer ${
                activeTab === tab.label 
                  ? 'text-orange-600 border-b-2 border-orange-600' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
              {tab.badge && (
                <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-extrabold">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100">
          <div className="relative w-full sm:w-80 md:w-96">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search reviewer, order ID, or text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-orange-500 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            <select 
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none cursor-pointer shadow-xs"
            >
              <option value="All Ratings">All Ratings</option>
              <option value="5 Stars">5 Stars</option>
              <option value="4 Stars">4 Stars</option>
              <option value="1 Star">1 Star</option>
            </select>

            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none cursor-pointer shadow-xs"
            >
              <option value="All Statuses">All Statuses</option>
              <option value="Published">Published</option>
              <option value="Flagged">Flagged</option>
              <option value="Hidden">Hidden</option>
            </select>

            <button 
              onClick={() => { setSearchTerm(''); setRatingFilter('All Ratings'); setStatusFilter('All Statuses'); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-200 transition cursor-pointer"
            >
              <Filter size={14} /> Reset
            </button>
          </div>
        </div>

        {/* Reviews List */}
        <div className="p-4 space-y-4">
          {filteredReviews.length > 0 ? (
            filteredReviews.map((rev) => (
              <div 
                key={rev.id} 
                className={`p-4 sm:p-5 rounded-2xl border border-slate-100 bg-white shadow-xs border-l-4 ${rev.borderColor} flex flex-col md:flex-row justify-between gap-4 items-start`}
              >
                {/* Review Content Left */}
                <div className="flex gap-3.5 items-start max-w-2xl w-full">
                  <img src={rev.avatar} alt={rev.reviewer} className="w-10 h-10 rounded-full object-cover shrink-0" />
                  <div className="space-y-1.5 w-full">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">{rev.reviewer}</span>
                      <span className="text-xs text-slate-400 font-medium">{rev.orderId}</span>
                    </div>

                    {/* Target Tag */}
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-orange-50 text-orange-700 text-xs font-medium">
                      {rev.targetType === 'restaurant' ? <Utensils size={12} /> : <Bike size={12} />}
                      {rev.target}
                    </div>

                    {/* Rating Stars & Time */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex text-orange-500">
                        {[...Array(5)].map((_, index) => (
                          <Star 
                            key={index} 
                            size={14} 
                            className={index < rev.rating ? "fill-orange-500" : "text-slate-200 fill-slate-200"} 
                          />
                        ))}
                      </div>
                      <span className="text-xs text-slate-400 font-medium">{rev.time}</span>
                      
                      {/* Status Badges */}
                      {rev.status === 'PUBLISHED' && (
                        <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 tracking-wider">
                          PUBLISHED
                        </span>
                      )}
                      {rev.status === 'FLAGGED' && (
                        <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white tracking-wider flex items-center gap-1">
                          <Flag size={10} fill="white" /> FLAGGED
                        </span>
                      )}
                      {rev.status === 'HIDDEN' && (
                        <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 tracking-wider">
                          HIDDEN
                        </span>
                      )}
                    </div>

                    {/* Comment */}
                    <p className="text-xs text-slate-700 leading-relaxed font-normal pt-1">
                      "{rev.comment}"
                    </p>

                    {/* Flag Reason Box */}
                    {rev.flagReason && (
                      <div className="mt-2 p-3 bg-rose-50/60 rounded-xl border border-rose-100 text-xs text-rose-700">
                        <strong className="font-bold">Flag Reason:</strong> {rev.flagReason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons Right */}
                <div className="flex md:flex-col gap-2 w-full md:w-auto justify-end shrink-0 pt-2 md:pt-0">
                  {rev.status === 'FLAGGED' ? (
                    <>
                      <button 
                        onClick={() => handleUpdateStatus(rev.id, 'PUBLISHED')}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#b83818] hover:bg-[#962c12] text-white text-xs font-semibold rounded-xl transition w-full md:w-auto cursor-pointer"
                      >
                        <ShieldAlert size={14} /> Approve & Publish
                      </button>

                      <button 
                        onClick={() => setContactModal({ open: true, review: rev })}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition w-full md:w-auto cursor-pointer"
                      >
                        <Mail size={14} /> Contact User
                      </button>
                    </>
                  ) : rev.status === 'HIDDEN' ? (
                    <button 
                      onClick={() => handleUpdateStatus(rev.id, 'PUBLISHED')}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-semibold rounded-xl transition w-full md:w-auto cursor-pointer"
                    >
                      <Eye size={14} /> Unhide Review
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => setReplyModal({ open: true, review: rev })}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-semibold rounded-xl transition w-full md:w-auto cursor-pointer"
                      >
                        <CornerUpLeft size={14} /> Reply
                      </button>

                      <button 
                        onClick={() => handleUpdateStatus(rev.id, 'HIDDEN')}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-xl transition w-full md:w-auto cursor-pointer"
                      >
                        <EyeOff size={14} /> Hide
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No reviews found matching your selected filters.
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-slate-100 text-xs text-slate-500">
          <span>Showing 1 to {filteredReviews.length} of {reviews.length} reviews</span>
          <div className="flex items-center gap-1 font-medium">
            <button className="p-1 hover:text-slate-800 transition"><ChevronLeft size={16} /></button>
            <button className="w-7 h-7 bg-[#b83818] text-white rounded-lg flex items-center justify-center font-bold">1</button>
            <button className="w-7 h-7 hover:bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center">2</button>
            <button className="p-1 hover:text-slate-800 transition"><ChevronRight size={16} /></button>
          </div>
        </div>

      </div>

      {/* Reply Modal */}
      {replyModal.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 relative">
            <button 
              onClick={() => { setReplyModal({ open: false, review: null }); setReplyText(''); }} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={20} />
            </button>
            <h3 className="font-bold text-slate-900 text-base mb-1">Reply to {replyModal.review?.reviewer}</h3>
            <p className="text-xs text-slate-500 mb-4">Order {replyModal.review?.orderId}</p>
            
            <form onSubmit={handleSendReply} className="space-y-4">
              <textarea
                required
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your official response here..."
                className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500"
              />
              <div className="flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => { setReplyModal({ open: false, review: null }); setReplyText(''); }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Send Reply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contact User Modal */}
      {contactModal.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 relative">
            <button 
              onClick={() => { setContactModal({ open: false, review: null }); setContactText(''); }} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={20} />
            </button>
            <h3 className="font-bold text-slate-900 text-base mb-1">Contact User</h3>
            <p className="text-xs text-slate-500 mb-4">Send a direct message regarding issue on {contactModal.review?.orderId}</p>
            
            <form onSubmit={handleSendContact} className="space-y-3 text-xs">
              <input 
                type="text" 
                readOnly 
                value={`To: ${contactModal.review?.reviewer}`} 
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
              />
              <textarea
                required
                rows={4}
                value={contactText}
                onChange={(e) => setContactText(e.target.value)}
                placeholder="Type your official message..."
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => { setContactModal({ open: false, review: null }); setContactText(''); }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}