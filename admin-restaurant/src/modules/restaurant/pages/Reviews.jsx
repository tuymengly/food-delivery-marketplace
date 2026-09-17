import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Star,
  MessageSquare,
  Trash2,
  Search,
  Send,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import {
  deleteRestaurantReview,
  getRestaurantReviews,
  replyToRestaurantReview
} from '../../../services/restaurantService';

const avatarFor = (name) => (
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Customer')}&background=1e3a8a&color=fff&rounded=false`
);

const normalizeReview = (review) => {
  const customer = review.user?.name || review.reviewer_name || 'Guest Customer';

  return {
    id: review.id,
    customer,
    avatar: review.user?.avatar_url || review.user?.avatar || avatarFor(customer),
    rating: Number(review.rating) || 0,
    date: review.created_at ? new Date(review.created_at).toLocaleDateString('en-US') : 'N/A',
    food: review.food?.name || (review.order?.id ? `Order #${review.order.id}` : 'Restaurant Review'),
    comment: review.comment || review.content || 'No comment provided.',
    reply: review.reply || '',
    status: review.status || 'published',
  };
};

export default function Reviews() {
  const [selectedRating, setSelectedRating] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState({});
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);

  const fetchReviews = useCallback(async (isManual = false) => {
    try {
      if (isManual) setIsRefreshing(true);
      setError(null);

      const restaurantId = localStorage.getItem('restaurant_id');
      const response = await getRestaurantReviews(restaurantId);
      const reviewData = response.data.data || response.data.reviews || [];

      setReviews(Array.isArray(reviewData) ? reviewData.map(normalizeReview) : []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err.response?.data?.message || 'Unable to load reviews.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchReviews();
    });
  }, [fetchReviews]);

  const reviewSummary = useMemo(() => {
    const total = reviews.length;
    const average = total > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / total
      : 0;

    const counts = [5, 4, 3, 2, 1].map((rating) => {
      const count = reviews.filter((review) => review.rating === rating).length;
      const percent = total > 0 ? Math.round((count / total) * 100) : 0;

      return { rating, count, percent };
    });

    return { total, average, counts };
  }, [reviews]);

  const handleSendReply = async (id) => {
    const reply = (replyText[id] || '').trim();
    if (!reply) return;

    try {
      setUpdatingId(id);
      const response = await replyToRestaurantReview(id, reply);
      const updated = response.data.data ? normalizeReview(response.data.data) : null;

      setReviews((currentReviews) => currentReviews.map((review) => (
        review.id === id ? (updated || { ...review, reply }) : review
      )));
      setReplyText((currentReplies) => ({ ...currentReplies, [id]: '' }));
      setActiveReplyId(null);
    } catch (err) {
      console.error('Error sending reply:', err);
      alert(err.response?.data?.message || 'Failed to send reply.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteReview = async (id) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      setUpdatingId(id);
      await deleteRestaurantReview(id);
      setReviews((currentReviews) => currentReviews.filter((review) => review.id !== id));
    } catch (err) {
      console.error('Error deleting review:', err);
      alert(err.response?.data?.message || 'Failed to delete review.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredReviews = reviews.filter((review) => {
    const query = searchQuery.toLowerCase();
    const matchesRating = selectedRating === 'All' || review.rating === Number(selectedRating);
    const matchesSearch =
      review.customer.toLowerCase().includes(query) ||
      review.comment.toLowerCase().includes(query) ||
      review.food.toLowerCase().includes(query);

    return matchesRating && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 rounded-none">
        <Loader2 className="w-10 h-10 text-blue-900 animate-spin" />
        <span className="mt-4 text-xs text-slate-600 font-bold uppercase tracking-widest">Loading reviews...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-4 rounded-none">
        <div className="bg-white border border-slate-300 p-8 rounded-none max-w-md w-full text-center space-y-4 shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-700 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Connection Problem</h3>
          <p className="text-xs text-slate-600 font-medium">{error}</p>
          <button
            onClick={() => fetchReviews(true)}
            className="mt-4 px-6 py-2.5 bg-blue-900 text-white rounded-none text-xs font-bold uppercase tracking-wider hover:bg-blue-950 transition inline-flex items-center gap-2 border border-blue-950"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 bg-slate-100 min-h-screen space-y-6 text-slate-800 font-sans rounded-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Customer Reviews</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Monitor feedback and respond to your customers
          </p>
        </div>
        <button
          onClick={() => fetchReviews(true)}
          disabled={isRefreshing}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-200 border border-slate-300 text-slate-800 hover:bg-slate-300 rounded-none text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 w-full sm:w-auto"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-blue-900' : ''} />
          Refresh
        </button>
      </div>

      {/* Review Summary Block */}
      <div className="bg-white p-6 rounded-none border border-slate-300 shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            {reviewSummary.average.toFixed(1)}
          </h2>
          <div className="flex items-center gap-1 text-amber-500 justify-center md:justify-start">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={18}
                className={i < Math.round(reviewSummary.average) ? 'fill-amber-500' : 'text-slate-200'}
              />
            ))}
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pt-1">
            Based on {reviewSummary.total} reviews
          </p>
        </div>

        <div className="flex-1 w-full space-y-2.5 border-t md:border-t-0 md:border-l border-slate-300 pt-5 md:pt-0 md:pl-8">
          {reviewSummary.counts.map((item) => (
            <div key={item.rating} className="flex items-center gap-4 text-[11px] font-bold text-slate-700 uppercase tracking-wide">
              <span className="w-14 shrink-0 text-slate-600">{item.rating} Star</span>
              <div className="flex-1 bg-slate-200 h-2 rounded-none overflow-hidden">
                <div className="bg-blue-900 h-full transition-all duration-500" style={{ width: `${item.percent}%` }} />
              </div>
              <span className="w-12 text-right text-slate-500 shrink-0">{item.percent}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search reviews by customer or dish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-none text-xs font-medium focus:outline-none focus:border-blue-900 transition-colors placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {['All', '5', '4', '3', '2', '1'].map((star) => (
            <button
              key={star}
              onClick={() => setSelectedRating(star)}
              className={`px-4 py-2.5 rounded-none text-[11px] font-bold uppercase tracking-wider transition whitespace-nowrap border ${
                selectedRating === star
                  ? 'bg-blue-900 text-white border-blue-950'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {star === 'All' ? 'All Ratings' : `${star} Star`}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs font-bold uppercase tracking-widest bg-white border border-slate-300 rounded-none shadow-sm">
            No reviews match your filter criteria.
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div key={review.id} className="bg-white p-5 sm:p-6 rounded-none border border-slate-300 shadow-sm space-y-4">
              
              {/* Review Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-center gap-4">
                  <img
                    src={review.avatar}
                    alt={review.customer}
                    className="w-12 h-12 rounded-none border border-slate-300 object-cover shrink-0"
                  />
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">{review.customer}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={i < review.rating ? 'fill-amber-500' : 'text-slate-200'}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{review.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-3 sm:pt-0 border-t border-slate-200 sm:border-none">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-300 rounded-none text-[10px] font-bold uppercase tracking-wider truncate max-w-[200px]">
                    {review.food}
                  </span>
                  <button
                    onClick={() => handleDeleteReview(review.id)}
                    disabled={updatingId === review.id}
                    className="text-slate-400 hover:text-rose-700 transition p-1.5 border border-transparent hover:border-rose-200 hover:bg-rose-50 rounded-none disabled:opacity-50"
                    aria-label="Delete review"
                    title="Delete Review"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Review Comment */}
              <p className="text-sm text-slate-800 font-medium leading-relaxed">
                {review.comment}
              </p>

              {/* Restaurant Reply */}
              {review.reply && (
                <div className="p-4 bg-slate-50 border border-slate-200 border-l-4 border-l-blue-900 rounded-none space-y-1.5 mt-2">
                  <span className="text-[10px] font-bold text-blue-900 uppercase tracking-widest block">Restaurant Reply</span>
                  <p className="text-xs text-slate-700 font-medium">{review.reply}</p>
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-200 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setActiveReplyId(activeReplyId === review.id ? null : review.id)}
                    className="flex items-center gap-2 text-[11px] font-bold text-blue-900 uppercase tracking-wide hover:text-blue-950 transition"
                  >
                    <MessageSquare size={14} />
                    <span>{review.reply ? 'Edit Reply' : 'Reply to Customer'}</span>
                  </button>
                </div>

                {/* Reply Input Form */}
                {activeReplyId === review.id && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                    <input
                      type="text"
                      placeholder="Write your response..."
                      value={replyText[review.id] || ''}
                      onChange={(e) => setReplyText({ ...replyText, [review.id]: e.target.value })}
                      className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-none text-xs font-medium focus:outline-none focus:border-blue-900 transition-colors"
                    />
                    <button
                      onClick={() => handleSendReply(review.id)}
                      disabled={updatingId === review.id}
                      className="px-6 py-2.5 bg-blue-900 text-white font-bold rounded-none text-[11px] uppercase tracking-wider hover:bg-blue-950 transition flex items-center justify-center gap-2 border border-blue-950 disabled:opacity-50"
                    >
                      <Send size={14} /> {updatingId === review.id ? 'Saving...' : 'Send Reply'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}