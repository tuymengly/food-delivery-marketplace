import React, { useState, useEffect } from 'react';
import Toast from '../components/Toast';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaStar, FaShoppingCart, FaMinus, FaPlus, FaArrowLeft, FaHeart } from 'react-icons/fa';
import { BiTime } from 'react-icons/bi';
import { MdDeliveryDining } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { addCartItem, fetchFoodDetail } from '../api/foodApi';
import FoodRecommendButton from '../components/FoodRecommendButton';

// Single detail page for every food item, regardless of category. This
// replaces the four near-identical DetailMenuFood/Snack/Dessert/Soup
// components that used to live at /MenuFood/:id, /MenuSnack/:id, etc. -
// the category only ever changed a label here, never the behavior.
const getFoodType = (category = '') => {
  const value = String(category).toLowerCase();
  if (value.includes('dessert')) return 'dessert';
  if (value.includes('snack')) return 'snack';
  if (value.includes('soup')) return 'soup';
  return 'food';
};

const getCartItemCount = () => {
  try {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    return Array.isArray(cart) ? cart.length : 0;
  } catch {
    return 0;
  }
};

const FoodDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [cartHasItems, setCartHasItems] = useState(getCartItemCount() > 0);

  // Buy Now should reflect the actual cart, not just "this page just added
  // something" - stay in sync with adds/removes/clears from anywhere
  // (Cart.jsx, Favorites.jsx, this page) via the shared cartUpdated event.
  useEffect(() => {
    const syncCartState = () => setCartHasItems(getCartItemCount() > 0);
    window.addEventListener('cartUpdated', syncCartState);
    return () => window.removeEventListener('cartUpdated', syncCartState);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadFoodDetail = async () => {
      try {
        setLoading(true);
        setError('');

        const foodData = await fetchFoodDetail(id);
        if (isMounted) {
          setFood(foodData);
        }
      } catch (error) {
        console.error('Failed to fetch food details:', error);
        if (isMounted) {
          setError(
            error?.response?.data?.message ||
              error.message ||
              'Failed to load food details.'
          );
          setFood(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadFoodDetail();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const type = getFoodType(food?.category);

  // Check if item is already in favorites
  useEffect(() => {
    if (food) {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      const isAlreadyFavorite = favorites.some(
        (item) => item.id === food.id && item.type === type
      );
      setIsFavorite(isAlreadyFavorite);
    }
  }, [food, type]);

  const handleFavoriteToggle = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

    if (isFavorite) {
      const updated = favorites.filter(
        (item) => !(item.id === food.id && item.type === type)
      );
      localStorage.setItem('favorites', JSON.stringify(updated));
      setIsFavorite(false);
    } else {
      favorites.push({
        id: food.id,
        name: food.name,
        price: food.price,
        image: food.image_url || food.image,
        category: food.category?.name || food.category,
        restaurant_id: food.restaurant_id || food.restaurant?.id,
        food_id: food.id,
        qty: food.qty || 10,
        type,
        detailLink: `/food/${food.id}`,
      });
      localStorage.setItem('favorites', JSON.stringify(favorites));
      setIsFavorite(true);
    }

    window.dispatchEvent(new Event('favoritesUpdated'));
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#F4F5F7]">
        <p className="text-slate-600 text-lg font-medium">Loading food details...</p>
      </div>
    );
  }

  if (!food) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#F4F5F7]">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[#1A2233] mb-4">
            {error ? 'Unable to Load Food' : 'Food Not Found'}
          </h2>
          {error && (
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              {error}
            </p>
          )}
          <Link
            to="/menu"
            className="text-[#0B1F3B] hover:text-[#132C52] font-semibold inline-block"
          >
            ← Back to Menu
          </Link>
        </div>
      </div>
    );
  }

  const handleQuantityChange = (change) => {
    if (change === 'increase') setQuantity((prev) => prev + 1);
    else if (change === 'decrease' && quantity > 1) setQuantity((prev) => prev - 1);
  };

  const totalPrice = (food.price * quantity).toFixed(2);

  const addToCart = async () => {
    const currentUser = localStorage.getItem('currentUser') || localStorage.getItem('token');
    if (!currentUser) {
      setToastMessage('Please login to add items to cart');
      setShowToast(true);
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    if (!localStorage.getItem('token')) {
      setToastMessage('Please login to add items to cart');
      setShowToast(true);
      return;
    }

    try {
      await addCartItem(food.id, quantity);
    } catch (error) {
      setToastMessage(error?.response?.data?.message || 'Could not add item to cart. Please try again.');
      setShowToast(true);
      return;
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const index = cart.findIndex((item) => item.id === food.id && item.type === type);

    if (index >= 0) {
      cart[index].quantity += quantity;
    } else {
      cart.push({
        id: food.id,
        name: food.name,
        price: food.price,
        image: food.image_url || food.image,
        category: food.category?.name || food.category,
        restaurant_id: food.restaurant_id || food.restaurant?.id,
        food_id: food.id,
        qty: food.qty || 10,
        type,
        quantity,
        detailLink: `/food/${food.id}`,
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));

    setToastMessage(`${quantity} ${food.name}${quantity > 1 ? 's' : ''} added to cart!`);
    setShowToast(true);
  };

  return (
    <>
      {showToast && <Toast message={toastMessage} onClose={() => setShowToast(false)} />}

      <div className="w-full min-h-screen bg-[#F4F5F7] py-10 px-4 sm:px-6 md:px-12 lg:px-20 overflow-x-hidden">
        {/* Back Button */}
        <Link
          to="/menu"
          className="inline-flex items-center gap-2 text-[#0B1F3B] hover:text-[#132C52] font-semibold mb-8 group"
        >
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform duration-300" />
          {t('button.backToMenu') || 'Back to Menu'}
        </Link>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 items-start">
          {/* Image */}
          <div className="relative w-full">
            <div className="border border-[#D6DBE3] overflow-hidden">
              <img
                src={food.image_url || food.image || 'https://via.placeholder.com/500'}
                alt={food.name}
                className="w-full h-auto max-h-[450px] sm:max-h-[500px] object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>

            {/* Favorite Button */}
            <button
              onClick={handleFavoriteToggle}
              className="absolute top-4 right-4 w-11 h-11 bg-white border border-[#D6DBE3] flex items-center justify-center hover:scale-105 transition-transform"
            >
              <FaHeart
                className={`text-lg ${isFavorite ? 'text-[#A6321E]' : 'text-slate-400'}`}
              />
            </button>

            {/* Category Badge */}
            <div className="absolute bottom-4 left-4 bg-[#0B1F3B] px-3 py-1.5">
              <span className="text-white font-semibold text-sm">
                {food.category?.name || food.category || 'Food'}
              </span>
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-white border border-[#D6DBE3] p-6 sm:p-8 md:p-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1A2233] mb-4">
              {food.name}
            </h1>

            <div className="flex flex-wrap items-center gap-2 mb-6">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className="text-amber-400 text-lg" />
                ))}
              </div>
              <span className="text-slate-600 text-sm sm:text-base font-medium">
                (4.9) • 127 Reviews
              </span>
            </div>
            <FoodRecommendButton food={food} />

            <p className="text-slate-700 text-base sm:text-lg leading-relaxed mb-8">
              {food.description}
            </p>

            {/* Price */}
            <div className="mb-8">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-4xl sm:text-5xl font-bold text-[#0B1F3B]">
                  ${totalPrice}
                </span>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-8">
              <label className="block text-slate-700 font-semibold mb-3 text-lg">
                Quantity
              </label>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => handleQuantityChange('decrease')}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-[#EEF2F8] hover:bg-[#DFE7F2] flex items-center justify-center transition cursor-pointer"
                >
                  <FaMinus className="text-[#0B1F3B]" />
                </button>
                <span className="text-2xl font-bold text-[#1A2233] w-14 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange('increase')}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-[#EEF2F8] hover:bg-[#DFE7F2] flex items-center justify-center transition cursor-pointer"
                >
                  <FaPlus className="text-[#0B1F3B]" />
                </button>
                <span className="text-slate-500 text-sm sm:text-base">
                  Available:{' '}
                  <span className="font-semibold text-emerald-600">
                    {food.qty || 10} items
                  </span>
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button
                onClick={addToCart}
                className="flex-1 bg-[#0B1F3B] hover:bg-[#132C52] text-white py-4 font-bold text-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <FaShoppingCart /> Add to Cart
              </button>
              {cartHasItems && (
                <Link
                  to="/cart"
                  className="flex-1 sm:flex-none px-6 border border-[#0B1F3B] hover:bg-[#EEF2F8] text-[#0B1F3B] py-4 font-bold transition text-center"
                >
                  Buy Now
                </Link>
              )}
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-[#EEF2F8] p-4 text-center">
                <MdDeliveryDining className="text-3xl text-[#0B1F3B] mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">Free Delivery</p>
              </div>
              <div className="bg-[#EEF2F8] p-4 text-center">
                <BiTime className="text-3xl text-[#0B1F3B] mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">30 Min</p>
              </div>
              <div className="bg-[#EEF2F8] p-4 text-center">
                <FaStar className="text-3xl text-[#0B1F3B] mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">Top Rated</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FoodDetail;