import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaHeart, FaShoppingCart, FaTrash } from 'react-icons/fa';
import { BsSearchHeartFill } from "react-icons/bs";
import Toast from '../components/Toast';

const Favorites = () => {
  const { t } = useTranslation();
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
      setToastMessage(t('favorites.loginRequired'));
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
    setToastMessage(`${item.name} ${t('favorites.addedToCart')}`);
    setShowToast(true);
  };

  if (favorites.length === 0) {
    return (
      <div className="w-full min-h-screen bg-slate-100 pt-24 pb-16 px-6 md:px-14 font-sans rounded-none">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 border-b border-slate-300 pb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 uppercase tracking-tight mb-2">
              {t('favorites.title')}
            </h1>
            <p className="text-slate-500 text-sm uppercase tracking-widest font-bold">{t('favorites.subtitle')}</p>
          </div>

          {/* Empty State */}
          <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-300 rounded-none shadow-sm">
            <div className="w-24 h-24 bg-none border border-none flex items-center justify-center mb-6 rounded-none">
              <BsSearchHeartFill className="text-5xl text-slate-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide mb-2">{t('favorites.empty')}</h2>
            <p className="text-slate-500 mb-8 text-center max-w-md text-sm font-medium">
              {t('favorites.startAdding')}
            </p>
            <Link
              to="/menu"
              className="px-8 py-3 bg-blue-900 hover:bg-blue-950 text-white rounded-none font-bold uppercase tracking-wider transition-colors border border-blue-950 shadow-sm inline-block"
            >
              {t('orderPages.browseMenu')}
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
    <div className="w-full min-h-screen bg-slate-100 pt-24 pb-16 px-6 md:px-14 font-sans rounded-none">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-slate-300 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 uppercase tracking-tight mb-2">
              {t('favorites.title')}
            </h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
              {t('favorites.savedCount', { count: favorites.length })}
            </p>
          </div>
          <button
            onClick={clearAllFavorites}
            className="mt-4 md:mt-0 px-6 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-[11px] uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer rounded-none"
          >
            <FaTrash size={12} />
            {t('favorites.removeAll')}
          </button>
        </div>

        {/* Favorites Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((item) => (
            <div
              key={item.id}
              className="bg-white overflow-hidden border border-slate-300 hover:border-blue-900 transition-colors group flex flex-col rounded-none shadow-sm"
            >
              {/* Image Container */}
              <div className="relative w-full h-[220px] bg-slate-100 border-b border-slate-200 overflow-hidden rounded-none">
                <img
                  src={item.image}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  alt={item.name}
                />
                
                {/* Remove Button */}
                <button
                  onClick={() => removeFromFavorites(item.id)}
                  className="absolute top-4 right-4 w-9 h-9 bg-white border border-slate-300 flex items-center justify-center hover:bg-rose-50 transition-colors rounded-none shadow-sm"
                  title={t('favorites.removeTooltip')}
                >
                  <FaHeart className="text-sm text-rose-700" />
                </button>
                
                {/* Price Badge */}
                <div className="absolute top-4 left-4 bg-blue-900 border border-blue-950 text-white px-3 py-1.5 font-bold text-sm uppercase tracking-wide rounded-none shadow-sm">
                  ${item.price}
                </div>
              </div>

              {/* Details */}
              <div className="w-full p-5 bg-white flex flex-col flex-grow justify-between rounded-none">
                <div>
                  <h1 className="text-slate-900 text-sm font-bold uppercase tracking-wide mb-1 group-hover:text-blue-900 transition-colors line-clamp-1">
                    {item.name}
                  </h1>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{item.category}</p>
                  
                  {item.qty && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 inline-block uppercase tracking-widest rounded-none mb-2">
                      {t('favorites.available', { qty: item.qty })}
                    </span>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                  <Link
                    to={item.detailLink}
                    className="flex-1 text-center px-4 py-2.5 text-white bg-blue-900 hover:bg-blue-950 border border-blue-950 transition-colors font-bold text-[11px] uppercase tracking-wider rounded-none flex items-center justify-center"
                  >
                    {t('button.viewDetails')}
                  </Link>
                  <button
                    onClick={() => addToCart(item)}
                    className="px-4 py-2.5 bg-slate-50 hover:bg-slate-200 border border-slate-300 text-blue-900 transition-colors cursor-pointer flex items-center justify-center rounded-none"
                    title={t('favorites.addToCartTooltip')}
                  >
                    <FaShoppingCart size={14} />
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