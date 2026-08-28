import React, { useState, useEffect } from 'react';
import Toast from './Toast';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MenuSoup } from '../data';
import { FaStar, FaShoppingCart, FaMinus, FaPlus, FaArrowLeft, FaHeart } from 'react-icons/fa';
import { BiTime } from 'react-icons/bi';
import { MdDeliveryDining } from 'react-icons/md';

const DetailMenuSoup = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const soup = MenuSoup.find((item) => item.id === parseInt(id));

  useEffect(() => {
    if (soup) {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      const isAlreadyFavorite = favorites.some(
        (item) => item.id === soup.id && item.type === 'soup'
      );
      setIsFavorite(isAlreadyFavorite);
    }
  }, [soup]);

  const handleFavoriteToggle = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

    if (isFavorite) {
      const updated = favorites.filter(
        (item) => !(item.id === soup.id && item.type === 'soup')
      );
      localStorage.setItem('favorites', JSON.stringify(updated));
      setIsFavorite(false);
    } else {
      favorites.push({
        id: soup.id,
        name: soup.name,
        price: soup.price,
        image: soup.image,
        category: 'Soup',
        qty: soup.qty || 10,
        type: 'soup',
        detailLink: `/MenuSoup/${soup.id}`,
      });
      localStorage.setItem('favorites', JSON.stringify(favorites));
      setIsFavorite(true);
    }

    window.dispatchEvent(new Event('favoritesUpdated'));
  };

  if (!soup) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Soup Not Found</h2>
          <Link
            to="/MenuSoup"
            className="text-orange-600 hover:text-orange-700 font-semibold"
          >
            ← Back to Soups
          </Link>
        </div>
      </div>
    );
  }

  const handleQuantityChange = (type) => {
    if (type === 'increase') setQuantity((prev) => prev + 1);
    else if (type === 'decrease' && quantity > 1) setQuantity((prev) => prev - 1);
  };

  const totalPrice = (soup.price * quantity).toFixed(2);

  const addToCart = () => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      setToastMessage('Please login to add items to cart');
      setShowToast(true);
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingIndex = cart.findIndex(
      (item) => item.id === soup.id && item.type === 'soup'
    );

    if (existingIndex >= 0) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({
        id: soup.id,
        name: soup.name,
        price: soup.price,
        image: soup.image,
        category: 'Soup',
        qty: soup.qty || 10,
        type: 'soup',
        quantity,
        detailLink: `/MenuSoup/${soup.id}`,
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));

    setToastMessage(`${quantity} ${soup.name}${quantity > 1 ? 's' : ''} added to cart!`);
    setShowToast(true);
  };

  return (
    <>
      {showToast && <Toast message={toastMessage} onClose={() => setShowToast(false)} />}

      <div className="w-full min-h-screen bg-gradient-to-b from-orange-50 to-white py-10 px-4 sm:px-6 md:px-12 lg:px-20 overflow-x-hidden">
        {/* Back to Menu */}
        <Link
          to="/MenuSoup"
          className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold mb-8 group"
        >
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform duration-300" />
          Back to Soups
        </Link>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 items-start">
          {/* 🍜 Image Section */}
          <div className="relative w-full">
            <div className="rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={soup.image}
                alt={soup.name}
                className="w-full h-auto max-h-[450px] sm:max-h-[500px] object-cover rounded-3xl transition-transform duration-700 hover:scale-105"
              />
            </div>

            {/* Favorite Button */}
            <button
              onClick={handleFavoriteToggle}
              className="absolute top-4 right-4 w-11 h-11 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
              <FaHeart
                className={`text-lg ${isFavorite ? 'text-red-500' : 'text-gray-400'}`}
              />
            </button>

            {/* Category Badge */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-md">
              <span className="text-orange-600 font-bold text-sm">Soup</span>
            </div>
          </div>

          {/* 🍲 Info Section */}
          <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 md:p-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {soup.name}
            </h1>

            <div className="flex flex-wrap items-center gap-2 mb-6">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className="text-yellow-400 text-lg" />
                ))}
              </div>
              <span className="text-gray-600 text-sm sm:text-base font-medium">
                (4.9) • 156 Reviews
              </span>
            </div>

            <p className="text-gray-700 text-base sm:text-lg leading-relaxed mb-8">
              {soup.description ||
                'Warm and comforting traditional Khmer soup made with fresh ingredients and authentic spices. Perfect for any meal!'}
            </p>

            {/* 💰 Price */}
            <div className="mb-8">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-4xl sm:text-5xl font-bold text-transparent bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text">
                  ${totalPrice}
                </span>
                <span className="text-gray-500 text-lg line-through">
                  ${(soup.price * 1.5 * quantity).toFixed(2)}
                </span>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                  33% OFF
                </span>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-8">
              <label className="block text-gray-700 font-semibold mb-3 text-lg">
                Quantity
              </label>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => handleQuantityChange('decrease')}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 hover:bg-orange-200 rounded-full flex items-center justify-center transition"
                >
                  <FaMinus className="text-orange-600" />
                </button>
                <span className="text-2xl font-bold text-gray-900 w-14 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange('increase')}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 hover:bg-orange-200 rounded-full flex items-center justify-center transition"
                >
                  <FaPlus className="text-orange-600" />
                </button>
                <span className="text-gray-500 text-sm sm:text-base">
                  Available:{' '}
                  <span className="font-semibold text-green-600">
                    {soup.qty || 10} items
                  </span>
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button
                onClick={addToCart}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition flex items-center justify-center gap-2"
              >
                <FaShoppingCart /> Add to Cart
              </button>
              <Link
                to="/cart"
                className="flex-1 sm:flex-none px-6 bg-orange-100 hover:bg-orange-200 text-orange-600 py-4 rounded-xl font-bold shadow-lg hover:scale-105 transition text-center"
              >
                Buy Now
              </Link>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-orange-50 p-4 rounded-xl text-center">
                <MdDeliveryDining className="text-3xl text-orange-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">Free Delivery</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl text-center">
                <BiTime className="text-3xl text-orange-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">30 Min</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl text-center">
                <FaStar className="text-3xl text-orange-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">Top Rated</p>
              </div>
            </div>

            {/* Promo */}
            <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-2">🍜 Warm & Comforting!</h3>
              <p className="text-gray-700 text-sm sm:text-base">
                Perfect soup for a cozy meal — served hot and fresh!
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DetailMenuSoup;
