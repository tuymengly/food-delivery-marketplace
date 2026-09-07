import { useEffect, useState } from 'react';
import { FaRegStar, FaStar } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getFoodRecommendation, toggleFoodRecommendation } from '../api/foodApi';

const FoodRecommendButton = ({ food }) => {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('token')) return;

    getFoodRecommendation(food.id)
      .then((response) => setRating(response.data?.rating || 0))
      .catch(() => {});
  }, [food.id]);

  const handleRating = async (selectedRating) => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }

    const previousRating = rating;
    setRating(selectedRating);
    setSaving(true);

    try {
      await toggleFoodRecommendation(food.id, selectedRating);
    } catch (error) {
      setRating(previousRating);
      alert(error.response?.data?.message || 'Could not save your rating.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="inline-flex flex-wrap items-center gap-2 rounded-full bg-orange-50 px-4 py-2">
      <span className="text-sm font-semibold text-orange-700">Rate & recommend:</span>
      <div className="flex items-center gap-1" role="group" aria-label={`Rate ${food.name}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRating(star)}
            disabled={saving}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            aria-pressed={rating === star}
            className="cursor-pointer text-xl transition hover:scale-110 disabled:cursor-wait disabled:opacity-60"
          >
            {star <= rating ? (
              <FaStar className="text-yellow-400" />
            ) : (
              <FaRegStar className="text-gray-400 hover:text-yellow-400" />
            )}
          </button>
        ))}
      </div>
      {rating > 0 && <span className="text-xs font-semibold text-yellow-700">{rating}/5</span>}
    </div>
  );
};

export default FoodRecommendButton;
