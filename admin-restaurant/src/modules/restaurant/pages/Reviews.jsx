import React, { useState } from 'react';
import { Star, MessageSquare, Trash2, Search, Send } from 'lucide-react';

export default function Reviews() {
  const [selectedRating, setSelectedRating] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState({});
  const [activeReplyId, setActiveReplyId] = useState(null);

  const [reviews, setReviews] = useState([
    {
      id: 1,
      customer: 'Sophea Kim',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      rating: 5,
      date: '2026-08-25',
      food: 'Double Smash Burger',
      comment: 'The best smash burger in Phnom Penh! The beef is juicy and the secret sauce is amazing. Fast delivery too!',
      reply: 'Thank you so much Sophea! Happy to know you loved the sauce!',
      likes: 4,
    },
    {
      id: 2,
      customer: 'John Doe',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      rating: 4,
      date: '2026-08-24',
      food: 'Crispy Chicken Burger',
      comment: 'Great crispy chicken burger. Only wish it came with extra pickles, but overall solid food.',
      reply: null,
      likes: 2,
    },
    {
      id: 3,
      customer: 'Dara Chan',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
      rating: 5,
      date: '2026-08-22',
      food: 'Truffle Fries & Shake',
      comment: 'Truffle fries were crisp and aromatic. Vanilla shake was thick and perfect.',
      reply: 'Thanks Dara! See you again next time!',
      likes: 5,
    },
    {
      id: 4,
      customer: 'Lida Suon',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
      rating: 2,
      date: '2026-08-20',
      food: 'Spicy Jalapeño Burger',
      comment: 'The food arrived lukewarm and took over 45 minutes.',
      reply: null,
      likes: 0,
    },
  ]);

  // Reply submit handler
  const handleSendReply = (id) => {
    if (!replyText[id]) return;
    setReviews(
      reviews.map((rev) => (rev.id === id ? { ...rev, reply: replyText[id] } : rev))
    );
    setReplyText({ ...replyText, [id]: '' });
    setActiveReplyId(null);
  };

  // Delete review handler
  const handleDeleteReview = (id) => {
    if (confirm('Are you sure you want to delete this review?')) {
      setReviews(reviews.filter((rev) => rev.id !== id));
    }
  };

  // Filter logic
  const filteredReviews = reviews.filter((rev) => {
    const matchesRating = selectedRating === 'All' || rev.rating === Number(selectedRating);
    const matchesSearch =
      rev.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rev.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rev.food.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRating && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 bg-[#fcfbfa] min-h-screen space-y-4 sm:space-y-6 text-gray-800">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Customer Reviews</h1>
        <p className="text-xs text-gray-500 font-medium mt-0.5 sm:mt-1">
          Monitor feedback and respond to your customers
        </p>
      </div>

      {/* Rating Summary Card */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-4 sm:gap-6">
        <div className="text-center md:text-left space-y-1">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">4.7</h2>
          <div className="flex items-center gap-1 text-amber-400 justify-center md:justify-start">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} className="fill-amber-400" />
            ))}
          </div>
          <p className="text-xs text-gray-400 font-medium">Based on 128 total reviews</p>
        </div>

        <div className="flex-1 w-full space-y-2 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
          {[
            { stars: '5 Star', count: '85%', width: 'w-[85%]' },
            { stars: '4 Star', count: '10%', width: 'w-[10%]' },
            { stars: '3 Star', count: '3%', width: 'w-[3%]' },
            { stars: '2 Star', count: '2%', width: 'w-[2%]' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 text-xs font-semibold">
              <span className="w-12 text-gray-500 shrink-0">{item.stars}</span>
              <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className={`bg-[#ea580c] h-full ${item.width}`} />
              </div>
              <span className="w-10 text-right text-gray-400 shrink-0">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search reviews by customer or dish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500 transition"
          />
        </div>

        {/* Rating Filter Tabs (Horizontal Scroll on Mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {['All', '5', '4', '3', '2'].map((star) => (
            <button
              key={star}
              onClick={() => setSelectedRating(star)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedRating === star
                  ? 'bg-[#ea580c] text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {star === 'All' ? 'All Rating' : `${star} Star`}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3 sm:space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs font-medium bg-white rounded-2xl border border-gray-100">
            No reviews match your filter criteria.
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div key={rev.id} className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <img
                    src={rev.avatar}
                    alt={rev.customer}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-gray-900">{rev.customer}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex items-center text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={i < rev.rating ? 'fill-amber-400' : 'text-gray-200'}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-gray-400 font-medium">• {rev.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-1 sm:pt-0 border-t border-gray-50 sm:border-none">
                  <span className="px-2.5 py-0.5 bg-[#fdf2ee] text-[#ea580c] rounded-full text-[10px] sm:text-[11px] font-bold truncate">
                    {rev.food}
                  </span>
                  <button
                    onClick={() => handleDeleteReview(rev.id)}
                    className="text-gray-400 hover:text-rose-500 transition p-1 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Comment Content */}
              <p className="text-xs text-gray-700 font-medium leading-relaxed">{rev.comment}</p>

              {/* Existing Reply Box */}
              {rev.reply && (
                <div className="p-3 sm:p-3.5 bg-[#faf8f5] rounded-xl border-l-4 border-[#ea580c] space-y-0.5">
                  <span className="text-[11px] font-bold text-[#ea580c]">Restaurant Reply</span>
                  <p className="text-xs text-gray-600 font-medium">{rev.reply}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between border-t border-gray-50 text-xs">
                <button
                  onClick={() => setActiveReplyId(activeReplyId === rev.id ? null : rev.id)}
                  className="flex items-center gap-1.5 font-bold text-[#ea580c] hover:underline"
                >
                  <MessageSquare size={14} />
                  <span>{rev.reply ? 'Edit Reply' : 'Reply to Customer'}</span>
                </button>
              </div>

              {/* Reply Input Form */}
              {activeReplyId === rev.id && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Write your response..."
                    value={replyText[rev.id] || ''}
                    onChange={(e) => setReplyText({ ...replyText, [rev.id]: e.target.value })}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
                  />
                  <button
                    onClick={() => handleSendReply(rev.id)}
                    className="px-4 py-2 bg-[#ea580c] text-white font-bold rounded-xl text-xs hover:bg-orange-700 transition flex items-center justify-center gap-1"
                  >
                    <Send size={13} /> Send
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