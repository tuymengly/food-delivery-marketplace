import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom'; // ថែម useSearchParams
import { useTranslation } from 'react-i18next';
import { addCartItem, fetchFoods } from '../api/foodApi';
import { FaHeart, FaRegHeart, FaShoppingCart, FaStar, FaFilter, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { IoSearch } from 'react-icons/io5';
import Toast from '../components/Toast';

const AllMenu = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams(); // ចាប់ Query Params ពី URL

  // ចាប់តម្លៃ filter & discount ពី URL
  const discountParam = searchParams.get('discount');
  const filterParam = searchParams.get('filter');

  // State management
  const [allMenuItems, setAllMenuItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [favorites, setFavorites] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const itemsPerPage = 12;

  useEffect(() => {
    fetchFoods()
      .then((foods) => setAllMenuItems(foods.map((item) => {
        const category = item.category?.toLowerCase() || '';
        const type = category.includes('dessert') ? 'dessert' :
          category.includes('snack') ? 'snack' :
          category.includes('soup') ? 'soup' : 'food';
        return { ...item, type };
      })))
      .catch((error) => console.error('Error fetching menu:', error));
  }, []);

  // Load favorites
  useEffect(() => {
    const storedFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setFavorites(storedFavorites);
    
    const handleFavoritesUpdate = () => {
      const updated = JSON.parse(localStorage.getItem('favorites') || '[]');
      setFavorites(updated);
    };
    
    window.addEventListener('favoritesUpdated', handleFavoritesUpdate);
    return () => window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
  }, []);

  // Filter and search logic (បានបន្ថែម URL Params Filter)
  const filteredItems = allMenuItems.filter(item => {
    // 1. Search filter
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = [item.name, item.category, item.description]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term));
    
    // 2. Category filter
    const categoryText = String(item.category || '').toLowerCase();
    const matchesCategory = selectedCategory === 'all' || (
      selectedCategory === 'main' ? /main|food|dish/.test(categoryText) :
      selectedCategory === 'snack' ? /snack|street/.test(categoryText) :
      selectedCategory === 'dessert' ? /dessert|sweet/.test(categoryText) :
      selectedCategory === 'soup' ? /soup|broth/.test(categoryText) :
      false
    );
    
    // 3. Price filter
    let matchesPrice = true;
    if (priceRange === 'low') matchesPrice = item.price < 1.5;
    else if (priceRange === 'medium') matchesPrice = item.price >= 1.5 && item.price <= 3.0;
    else if (priceRange === 'high') matchesPrice = item.price > 3.0;
    
    // 4. URL Params Filter (Deals & Recommended)
    let matchesUrlFilter = true;
    if (discountParam) {
      matchesUrlFilter = item.discountCode === discountParam;
    } else if (filterParam === 'recommended') {
      matchesUrlFilter = item.isRecommended === true;
    }

    return matchesSearch && matchesCategory && matchesPrice && matchesUrlFilter;
  });

  // Sort logic
  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      default:
        return 0;
    }
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);

  // Handlers
  const toggleFavorite = (itemId, itemType) => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const isFav = favorites.some(fav => fav.id === itemId && fav.type === itemType);

    let updatedFavorites;
    if (isFav) {
      updatedFavorites = favorites.filter(fav => !(fav.id === itemId && fav.type === itemType));
    } else {
      const item = allMenuItems.find(item => item.id === itemId && item.type === itemType);
      updatedFavorites = [...favorites, item];
    }

    setFavorites(updatedFavorites);
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    window.dispatchEvent(new Event('favoritesUpdated'));
  };

  const isFavorite = (itemId, itemType) => {
    return favorites.some(fav => fav.id === itemId && fav.type === itemType);
  };

  const addToCart = async (item) => {
    const currentUser = localStorage.getItem('currentUser') || localStorage.getItem('user');
    if (!currentUser || !localStorage.getItem('token')) {
      setToastMessage(t('favorites.loginRequired'));
      setShowToast(true);
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      return;
    }

    try {
      await addCartItem(item.id, 1);
      setToastMessage(`${item.name} ${t('favorites.addedToCart')}`);
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      setToastMessage(
        error?.response?.data?.message || 'Could not add item to cart. Please try again.'
      );
    }

    setShowToast(true);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setPriceRange('all');
    setSortBy('name');
    setCurrentPage(1);
    setSearchParams({}); // លុប URL Query Params ចោលនៅពេល Reset
  };

  // Categories for filter
  const categories = [
    { value: 'all', label: t('menu.allItems') },
    { value: 'main', label: t('menu.mainDish') },
    { value: 'snack', label: t('menu.snacks') },
    { value: 'dessert', label: t('menu.desserts') },
    { value: 'soup', label: t('menu.soups') }
  ];

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-orange-50 to-white pt-24 pb-16 px-6 md:px-14">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="py-1 text-4xl md:text-5xl font-extrabold text-transparent bg-gradient-to-r from-orange-600 via-red-500 to-orange-600 bg-clip-text mb-4">
            {discountParam 
              ? `Special Deals (${discountParam})` 
              : filterParam === 'recommended' 
              ? 'Recommended For You' 
              : t('menu.allMenu')}
          </h1>
          <p className="text-gray-600 text-lg">
            {t('menu.showing')} {filteredItems.length} {t('menu.items')}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <IoSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl text-orange-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={t('menu.searchPlaceholder')}
              className="w-full px-5 pl-14 py-4 rounded-full border-2 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-lg shadow-lg"
            />
          </div>
        </div>

        {/* Filter Toggle Button (Mobile) */}
        <div className="lg:hidden mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold shadow-lg"
          >
            <FaFilter />
            {showFilters ? t('common.close') : t('menu.filters')}
          </button>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <FaFilter className="text-orange-600" />
                  {t('menu.filters')}
                </h2>
                <button
                  onClick={resetFilters}
                  className="text-sm text-orange-600 hover:text-orange-700 font-semibold cursor-pointer"
                >
                  {t('menu.reset')}
                </button>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('menu.category')}</h3>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <label
                      key={cat.value}
                      className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                        selectedCategory === cat.value
                          ? 'bg-orange-100 border-2 border-orange-500'
                          : 'bg-gray-50 border-2 border-transparent hover:bg-orange-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="category"
                        value={cat.value}
                        checked={selectedCategory === cat.value}
                        onChange={(e) => {
                          setSelectedCategory(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-4 h-4 accent-orange-600 cursor-pointer"
                      />
                      <span className="ml-3 font-medium text-gray-900">{cat.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('menu.priceRange')}</h3>
                <div className="space-y-2">
                  <label className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                    priceRange === 'all' ? 'bg-orange-100 border-2 border-orange-500' : 'bg-gray-50 border-2 border-transparent hover:bg-orange-50'
                  }`}>
                    <input
                      type="radio"
                      name="price"
                      value="all"
                      checked={priceRange === 'all'}
                      onChange={(e) => {
                        setPriceRange(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-4 h-4 accent-orange-600 cursor-pointer"
                    />
                    <span className="ml-3 font-medium text-gray-900">{t('menu.allPrices')}</span>
                  </label>
                  <label className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                    priceRange === 'low' ? 'bg-orange-100 border-2 border-orange-500' : 'bg-gray-50 border-2 border-transparent hover:bg-orange-50'
                  }`}>
                    <input
                      type="radio"
                      name="price"
                      value="low"
                      checked={priceRange === 'low'}
                      onChange={(e) => {
                        setPriceRange(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-4 h-4 accent-orange-600 cursor-pointer"
                    />
                    <span className="ml-3 font-medium text-gray-900">{t('menu.under')}</span>
                  </label>
                  <label className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                    priceRange === 'medium' ? 'bg-orange-100 border-2 border-orange-500' : 'bg-gray-50 border-2 border-transparent hover:bg-orange-50'
                  }`}>
                    <input
                      type="radio"
                      name="price"
                      value="medium"
                      checked={priceRange === 'medium'}
                      onChange={(e) => {
                        setPriceRange(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-4 h-4 accent-orange-600 cursor-pointer"
                    />
                    <span className="ml-3 font-medium text-gray-900">{t('menu.medium')}</span>
                  </label>
                  <label className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                    priceRange === 'high' ? 'bg-orange-100 border-2 border-orange-500' : 'bg-gray-50 border-2 border-transparent hover:bg-orange-50'
                  }`}>
                    <input
                      type="radio"
                      name="price"
                      value="high"
                      checked={priceRange === 'high'}
                      onChange={(e) => {
                        setPriceRange(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-4 h-4 accent-orange-600 cursor-pointer"
                    />
                    <span className="ml-3 font-medium text-gray-900">{t('menu.over')}</span>
                  </label>
                </div>
              </div>

              {/* Sort By */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('menu.sortBy')}</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-orange-500 outline-none cursor-pointer font-medium"
                >
                  <option value="name">{t('menu.nameAZ')}</option>
                  <option value="price-low">{t('menu.priceLowHigh')}</option>
                  <option value="price-high">{t('menu.priceHighLow')}</option>
                  <option value="rating">{t('menu.ratingHighLow')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="lg:col-span-3">
            {/* Results Info */}
            <div className="flex items-center justify-between mb-6 bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <p className="text-gray-700 font-semibold">
                {t('menu.showing')} <span className="text-orange-600">{currentItems.length}</span> {t('menu.of')}{' '}
                <span className="text-orange-600">{sortedItems.length}</span> {t('menu.items')}
              </p>
              <p className="text-sm text-gray-500">
                {t('menu.page')} {currentPage} {t('menu.of')} {totalPages || 1}
              </p>
            </div>

            {/* Items Grid */}
            {currentItems.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {currentItems.map((item) => (
                  <div
                    key={`${item.id}-${item.type}`}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 group flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Container */}
                      <div className="relative overflow-hidden h-48">
                        <Link
                          to={`/${item.type === 'food' ? 'MenuFood' : item.type === 'snack' ? 'MenuSnack' : item.type === 'dessert' ? 'MenuDessert' : 'MenuSoup'}/${item.id}`}
                          className="block w-full h-full"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 cursor-pointer"
                          />
                        </Link>
                        {/* Favorite Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            toggleFavorite(item.id, item.type);
                          }}
                          className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg z-10 cursor-pointer"
                        >
                          {isFavorite(item.id, item.type) ? (
                            <FaHeart className="text-red-500 text-xl" />
                          ) : (
                            <FaRegHeart className="text-gray-700 text-xl" />
                          )}
                        </button>
                        {/* Category Badge */}
                        <div className="absolute top-3 left-3 px-3 py-1 bg-orange-600 text-white text-xs font-semibold rounded-full z-10">
                          {item.category}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <Link
                          to={`/${item.type === 'food' ? 'MenuFood' : item.type === 'snack' ? 'MenuSnack' : item.type === 'dessert' ? 'MenuDessert' : 'MenuSoup'}/${item.id}`}
                          className="block cursor-pointer"
                        >
                          <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-orange-600 transition-colors line-clamp-1">
                            {item.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {item.description}
                          </p>
                        </Link>

                        {/* Rating */}
                        {item.rating && (
                          <div className="flex items-center gap-1 mb-3">
                            <FaStar className="text-yellow-500" />
                            <span className="font-semibold text-gray-900">{item.rating}</span>
                            <span className="text-gray-500 text-sm ml-1">
                              {item.prepTime && `• ${item.prepTime}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price and Add to Cart */}
                    <div className="p-5 pt-0 flex items-center justify-between">
                      <span className="text-2xl font-bold text-orange-600">
                        ${item.price.toFixed(2)}
                      </span>
                      <button
                        onClick={() => addToCart(item)}
                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2 cursor-pointer"
                      >
                        <FaShoppingCart />
                        {t('menu.add')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
                <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IoSearch className="text-5xl text-orange-300" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('menu.noItems')}</h3>
                <p className="text-gray-600 mb-6">{t('menu.tryAdjusting')}</p>
                <button
                  onClick={resetFilters}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:scale-105 transition-transform cursor-pointer"
                >
                  {t('menu.clearFilters')}
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-3 rounded-lg font-semibold transition-all ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-orange-600 hover:bg-orange-50 border-2 border-orange-600 cursor-pointer'
                  }`}
                >
                  <FaChevronLeft />
                </button>

                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`w-10 h-10 rounded-lg font-semibold transition-all cursor-pointer ${
                          currentPage === pageNumber
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                            : 'bg-white text-gray-700 hover:bg-orange-50 border-2 border-gray-300'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                    return <span key={pageNumber} className="text-gray-400">...</span>;
                  }
                  return null;
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-3 rounded-lg font-semibold transition-all ${
                    currentPage === totalPages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-orange-600 hover:bg-orange-50 border-2 border-orange-600 cursor-pointer'
                  }`}
                >
                  <FaChevronRight />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
};

export default AllMenu;
