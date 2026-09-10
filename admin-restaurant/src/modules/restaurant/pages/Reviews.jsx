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
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Customer')}&background=f97316&color=fff`
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fcfbfa]">
        <Loader2 className="w-9 h-9 text-orange-600 animate-spin" />
        <span className="mt-3 text-sm text-slate-600 font-medium">Loading reviews...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fcfbfa] p-4">
        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl max-w-md w-full text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h3 className="text-base font-bold text-red-900">Connection problem</h3>
          <p className="text-xs text-red-600 font-medium">{error}</p>
          <button
            onClick={() => fetchReviews(true)}
            className="mt-2 px-5 py-2.5 bg-orange-600 text-white rounded-xl text-xs font-semibold hover:bg-orange-700 transition inline-flex items-center gap-2"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            ព្យាយាមម្តងទៀត
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-[#fcfbfa] min-h-screen space-y-4 sm:space-y-6 text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Customer Reviews</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5 sm:mt-1">
            Monitor feedback and respond to your customers
          </p>
        </div>
        <button
          onClick={() => fetchReviews(true)}
          disabled={isRefreshing}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-orange-600' : ''} />
          Refresh
        </button>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4 sm:gap-6">
        <div className="text-center md:text-left space-y-1">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            {reviewSummary.average.toFixed(1)}
          </h2>
          <div className="flex items-center gap-1 text-amber-400 justify-center md:justify-start">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={16}
                className={i < Math.round(reviewSummary.average) ? 'fill-amber-400' : 'text-slate-200'}
              />
            ))}
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Based on {reviewSummary.total} total reviews
          </p>
        </div>

        <div className="flex-1 w-full space-y-2 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
          {reviewSummary.counts.map((item) => (
            <div key={item.rating} className="flex items-center gap-3 text-xs font-semibold">
              <span className="w-12 text-slate-500 shrink-0">{item.rating} Star</span>
              <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-orange-600 h-full" style={{ width: `${item.percent}%` }} />
              </div>
              <span className="w-10 text-right text-slate-400 shrink-0">{item.percent}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search reviews by customer or dish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {['All', '5', '4', '3', '2', '1'].map((star) => (
            <button
              key={star}
              onClick={() => setSelectedRating(star)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedRating === star
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {star === 'All' ? 'All Rating' : `${star} Star`}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-medium bg-white rounded-2xl border border-slate-100">
            No reviews match your filter criteria.
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div key={review.id} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <img
                    src={review.avatar}
                    alt={review.customer}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-slate-900">{review.customer}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex items-center text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={i < review.rating ? 'fill-amber-400' : 'text-slate-200'}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">{review.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-1 sm:pt-0 border-t border-slate-50 sm:border-none">
                  <span className="px-2.5 py-0.5 bg-[#fdf2ee] text-orange-600 rounded-full text-[10px] sm:text-[11px] font-bold truncate">
                    {review.food}
                  </span>
                  <button
                    onClick={() => handleDeleteReview(review.id)}
                    disabled={updatingId === review.id}
                    className="text-slate-400 hover:text-rose-500 transition p-1 rounded-lg disabled:opacity-50"
                    aria-label="Delete review"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-700 font-medium leading-relaxed">{review.comment}</p>

              {review.reply && (
                <div className="p-3 sm:p-3.5 bg-[#faf8f5] rounded-xl border-l-4 border-orange-600 space-y-0.5">
                  <span className="text-[11px] font-bold text-orange-600">Restaurant Reply</span>
                  <p className="text-xs text-slate-600 font-medium">{review.reply}</p>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between border-t border-slate-50 text-xs">
                <button
                  onClick={() => setActiveReplyId(activeReplyId === review.id ? null : review.id)}
                  className="flex items-center gap-1.5 font-bold text-orange-600 hover:underline"
                >
                  <MessageSquare size={14} />
                  <span>{review.reply ? 'Edit Reply' : 'Reply to Customer'}</span>
                </button>
              </div>

              {activeReplyId === review.id && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Write your response..."
                    value={replyText[review.id] || ''}
                    onChange={(e) => setReplyText({ ...replyText, [review.id]: e.target.value })}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
                  />
                  <button
                    onClick={() => handleSendReply(review.id)}
                    disabled={updatingId === review.id}
                    className="px-4 py-2 bg-orange-600 text-white font-bold rounded-xl text-xs hover:bg-orange-700 transition flex items-center justify-center gap-1 disabled:opacity-60"
                  >
                    <Send size={13} /> {updatingId === review.id ? 'Saving...' : 'Send'}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
