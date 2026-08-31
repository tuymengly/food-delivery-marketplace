import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaHeart, FaShoppingCart, FaTrash } from 'react-icons/fa';
import Toast from '../components/Toast';

const Favorites = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Check authentication on mount
  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      // Redirect to login if not authenticated
      navigate('/login');
      return;
    }
    loadFavorites();
  }, [navigate]);

  const loadFavorites = () => {
    const storedFavorites = localStorage.getItem('favorites');
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
  };

  const removeFromFavorites = (itemId) => {
    const updatedFavorites = favorites.filter(item => item.id !== itemId);
    setFavorites(updatedFavorites);
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    window.dispatchEvent(new Event('favoritesUpdated'));
  };

  const clearAllFavorites = () => {
    setFavorites([]);
    localStorage.removeItem('favorites');
    window.dispatchEvent(new Event('favoritesUpdated'));
  };

  const addToCart = (item) => {
    // Check if user is logged in
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      setToastMessage('Please login to add items to cart');
      setShowToast(true);
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      return;
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id && cartItem.type === item.type);

    if (existingItemIndex >= 0) {
      // Item already in cart, increase quantity
      cart[existingItemIndex].quantity += 1;
    } else {
      // Add new item to cart with quantity 1
      const cartItem = {
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        category: item.category,
        qty: item.qty,
        type: item.type,
        quantity: 1,
        detailLink: item.detailLink
      };
      cart.push(cartItem);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    
    // Show toast notification
    setToastMessage(`${item.name} added to cart!`);
    setShowToast(true);
  };

  if (favorites.length === 0) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-orange-50 to-white pt-24 pb-16 px-6 md:px-14">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-gradient-to-r from-orange-600 via-red-500 to-orange-600 bg-clip-text mb-4">
              My Favorites
            </h1>
            <p className="text-gray-600 text-lg">Your favorite Khmer dishes</p>
          </div>

          {/* Empty State */}
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-32 h-32 bg-orange-100 rounded-full flex items-center justify-center mb-6">
              <FaHeart className="text-6xl text-orange-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">No Favorites Yet</h2>
            <p className="text-gray-600 mb-8 text-center max-w-md">
              Start adding your favorite dishes by clicking the heart icon on any menu item!
            </p>
            <Link 
              to="/MenuFood" 
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              Browse Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {showToast && (
        <Toast 
          message={toastMessage} 
          onClose={() => setShowToast(false)} 
        />
      )}
    <div className="w-full min-h-screen bg-gradient-to-b from-orange-50 to-white pt-24 pb-16 px-6 md:px-14">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-gradient-to-r from-orange-600 via-red-500 to-orange-600 bg-clip-text mb-2">
              My Favorites
            </h1>
            <p className="text-gray-600 text-lg">
              You have {favorites.length} favorite {favorites.length === 1 ? 'item' : 'items'}
            </p>
          </div>
          <button
            onClick={clearAllFavorites}
            className="mt-4 md:mt-0 px-6 py-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
          >
            <FaTrash />
            Clear All
          </button>
        </div>

        {/* Favorites Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {favorites.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 ease-in-out group hover:-translate-y-3 border border-gray-100"
            >
              {/* Image */}
              <div className="relative w-full h-[250px] p-4 bg-gradient-to-br from-orange-400 via-red-400 to-orange-500 overflow-hidden">
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-all duration-500"></div>
                <img
                  src={item.image}
                  className="w-full h-full object-cover rounded-xl shadow-xl group-hover:scale-110 transition-transform duration-700"
                  alt={item.name}
                />
                {/* Remove Button */}
                <button
                  onClick={() => removeFromFavorites(item.id)}
                  className="absolute top-6 right-6 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300"
                >
                  <FaHeart className="text-lg text-red-500" />
                </button>
                {/* Price Badge */}
                <div className="absolute top-6 left-6 bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2 rounded-full shadow-lg font-bold text-lg">
                  ${item.price}
                </div>
              </div>

              {/* Details */}
              <div className="w-full p-5 bg-white flex flex-col justify-between">
                <div>
                  <h1 className="text-gray-900 text-xl font-bold mb-2 group-hover:text-orange-600 transition-colors duration-300">
                    {item.name}
                  </h1>
                  <p className="text-gray-500 text-sm mb-1">{item.category}</p>
                  {item.qty && (
                    <p className="text-green-600 text-sm font-semibold">
                      {item.qty} available
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Link
                    to={item.detailLink}
                    className="flex-1 text-center px-4 py-2.5 rounded-xl text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 hover:scale-105 transition-all duration-300 font-semibold text-sm"
                  >
                    View Details
                  </Link>
                  <button 
                    onClick={() => addToCart(item)}
                    className="px-4 py-2.5 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-xl font-semibold shadow-md hover:scale-105 transition-all duration-300"
                  >
                    <FaShoppingCart />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
};

export default Favorites;
