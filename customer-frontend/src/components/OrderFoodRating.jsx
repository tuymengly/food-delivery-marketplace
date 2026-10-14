import { useState } from 'react';
import { FaPen, FaRegStar, FaStar } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { submitOrderFoodReview } from '../api/reviewApi';
import Toast from './Toast';

const STARS = [1, 2, 3, 4, 5];

/**
 * Star rating for a single dish of a completed order.
 *
 * `review` is the customer's existing rating for this dish (undefined while it
 * has not been rated yet). A saved rating is handed back through `onSaved` so
 * the parent can keep its "which dish is already rated" map in step without
 * re-fetching the whole order.
 */
const OrderFoodRating = ({ orderId, foodId, foodName, review, onSaved }) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState(review?.rating ?? 0);
  const [comment, setComment] = useState(review?.comment ?? '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // The ratings of an order are fetched after it is opened, so a dish can go
  // from "not rated" to "already rated" while this form is on screen. Adopt
  // the new value during render rather than in an effect - a fresh review is
  // a different piece of data, not an ongoing external subscription.
  const [seenReviewId, setSeenReviewId] = useState(review?.id ?? null);
  if ((review?.id ?? null) !== seenReviewId) {
    setSeenReviewId(review?.id ?? null);
    setRating(review?.rating ?? 0);
    setComment(review?.comment ?? '');
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!rating) {
      setFeedback({ type: 'error', message: t('orderPages.ratingPickStars') });
      return;
    }

    setSaving(true);

    try {
      const response = await submitOrderFoodReview(orderId, { foodId, rating, comment });

      onSaved?.(response.data?.data);
      setEditing(false);
      setFeedback({ type: 'success', message: t('orderPages.ratingSaved') });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || t('orderPages.ratingFailed'),
      });
    } finally {
      setSaving(false);
    }
  };

  const cancelEditing = () => {
    setRating(review?.rating ?? 0);
    setComment(review?.comment ?? '');
    setEditing(false);
  };

  const stars = (interactive) =>
    STARS.map((star) => (
      <button
        key={star}
        type="button"
        // The summary state is a read-only picture of the saved rating.
        disabled={!interactive}
        onClick={() => interactive && setRating(star)}
        aria-label={t('orderPages.ratingStarLabel', { count: star })}
        aria-pressed={interactive ? rating === star : undefined}
        className={
          interactive
            ? 'text-xl leading-none transition hover:scale-110 disabled:cursor-wait disabled:opacity-60'
            : 'text-lg leading-none'
        }
      >
        {star <= rating ? (
          <FaStar className="text-amber-400" />
        ) : (
          <FaRegStar className={interactive ? 'text-slate-300 hover:text-amber-400' : 'text-slate-300'} />
        )}
      </button>
    ));

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      {feedback && (
        <Toast message={feedback.message} type={feedback.type} onClose={() => setFeedback(null)} />
      )}

      {!review || editing ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {t('orderPages.rateThisDish')}
            </span>
            <div className="flex items-center gap-1" role="group" aria-label={t('orderPages.rateDish', { name: foodName })}>
              {stars(true)}
            </div>
            {rating > 0 && <span className="text-xs font-bold text-amber-600">{rating}/5</span>}
          </div>

          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={2}
            maxLength={1000}
            placeholder={t('orderPages.ratingComment')}
            className="w-full border border-slate-300 p-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-blue-900 focus:outline-none resize-none"
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={saving || !rating}
              className="bg-blue-900 hover:bg-blue-950 disabled:bg-slate-300 disabled:border-slate-300 text-white px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest border border-blue-950 transition-colors"
            >
              {saving ? t('orderPages.ratingSaving') : t('orderPages.submitRating')}
            </button>
            {review && (
              <button
                type="button"
                onClick={cancelEditing}
                className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-slate-600 border border-slate-300 hover:bg-slate-100 transition-colors"
              >
                {t('common.cancel')}
              </button>
            )}
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
              {t('orderPages.yourRating')}
            </p>
            <div className="flex items-center gap-1">
              {stars(false)}
              <span className="ml-2 text-xs font-bold text-amber-600">{review.rating}/5</span>
            </div>
            {review.comment && (
              <p className="mt-1 text-xs text-slate-600 italic">“{review.comment}”</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setEditing(true)}
            className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-blue-900 border border-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <FaPen className="text-[10px]" /> {t('orderPages.changeRating')}
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderFoodRating;
