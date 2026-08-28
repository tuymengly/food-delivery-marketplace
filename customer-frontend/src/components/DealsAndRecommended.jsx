import React from 'react';
import { useNavigate } from 'react-router-dom';
// 1. Import ទិន្នន័យទាំងអស់ពី data

import { khmerFoods, khmerSnacks, khmerDessert, MenuSoup } from '../data';

const DealsAndRecommended = () => {
  const navigate = useNavigate();

  // 2. បង្កើត foodProducts ដោយបូកបញ្ចូល Array ទិន្នន័យទាំងអស់
  const foodProducts = [
    ...khmerFoods.map(item => ({ ...item, type: 'food' })),
    ...khmerSnacks.map(item => ({ ...item, type: 'snack' })),
    ...khmerDessert.map(item => ({ ...item, type: 'dessert' })),
    ...MenuSoup.map(item => ({ ...item, type: 'soup' }))
  ];

  // Filter យកតែមុខម្ហូបណាដែលមាន isRecommended: true
  const recommendedItems = foodProducts.filter((item) => item.isRecommended);

  // 1. ចុច "Order Now" លើ Deals -> ទៅ Menu Filter តាម Coupon នោះ
  const handleDealOrder = (promoCode) => {
    localStorage.setItem('appliedPromo', promoCode);
    navigate(`/menu?discount=${promoCode}`);
  };

  // 2. ចុច "See All" លើ Recommended -> ទៅ Menu Filter តាម Recommended
  const handleSeeAllRecommended = () => {
    navigate('/menu?filter=recommended');
  };

  // 3. ចុច "+" បន្ថែមចូល Cart រួចទៅ Checkout ភ្លាមៗ
  const handleAddToCart = (item) => {
    const existingCart = JSON.parse(localStorage.getItem('cart')) || [];
    const itemIndex = existingCart.findIndex((cartItem) => cartItem.id === item.id && cartItem.type === item.type);

    if (itemIndex > -1) {
      existingCart[itemIndex].quantity += 1;
    } else {
      existingCart.push({ ...item, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(existingCart));
    window.dispatchEvent(new Event('cartUpdated'));
    navigate('/cart');
  };

  return (
    <div className="w-full space-y-10 py-10 px-6 md:px-14 bg-[#FFF9F5]">
      {/* 1. Today's Best Deals */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Today's Best Deals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 50% OFF Card */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-6 text-white flex justify-between items-center shadow-lg">
            <div className="space-y-3">
              <h3 className="text-4xl font-extrabold">50% OFF</h3>
              <p className="font-semibold text-lg">Free delivery on your first 3 orders</p>
              <p className="text-xs text-orange-100">New customers only · Use code FIRST50</p>
              <button 
                onClick={() => handleDealOrder('FIRST50')}
                className="mt-2 bg-white/20 backdrop-blur-md border border-white text-white px-6 py-2 rounded-full font-medium hover:bg-white hover:text-orange-600 transition cursor-pointer"
              >
                View 50% Deals
              </button>
            </div>
            <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300" alt="Burger" className="w-32 h-32 object-cover rounded-2xl shadow-md" />
          </div>

          {/* 20% OFF Card */}
          <div className="bg-amber-400 rounded-3xl p-6 text-white flex justify-between items-center shadow-lg">
            <div className="space-y-3">
              <h3 className="text-4xl font-extrabold">20% OFF</h3>
              <p className="font-semibold text-lg">Every order over $25 this weekend</p>
              <p className="text-xs text-amber-100">Saturday & Sunday · Use code WEEKEND20</p>
              <button 
                onClick={() => handleDealOrder('WEEKEND20')}
                className="mt-2 bg-white/20 backdrop-blur-md border border-white text-white px-6 py-2 rounded-full font-medium hover:bg-white hover:text-amber-600 transition cursor-pointer"
              >
                View 20% Deals
              </button>
            </div>
            <img src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300" alt="Pizza" className="w-32 h-32 object-cover rounded-2xl shadow-md" />
          </div>
        </div>
      </div>

      {/* 2. Recommended For You */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recommended For You</h2>
          <button 
            onClick={handleSeeAllRecommended}
            className="text-orange-500 font-semibold hover:underline cursor-pointer"
          >
            See All →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {recommendedItems.map((item) => (
            <div key={`${item.id}-${item.type}`} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between border border-gray-100">
              <div>
                {/* ប្រើ item.image ឬ fallback ទៅ item.img */}
                <img src={item.image || item.img} alt={item.name} className="w-full h-40 object-cover" />
                <div className="p-4">
                  <span className="text-xs text-gray-400 font-medium">{item.shop || item.category}</span>
                  <h4 className="font-bold text-gray-800 text-sm mt-0.5 leading-snug">{item.name}</h4>
                </div>
              </div>
              <div className="p-4 pt-0 flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-900">${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}</span>
                  {item.rating && <span className="text-xs text-gray-500 ml-2">★ {item.rating}</span>}
                </div>
                <button 
                  onClick={() => handleAddToCart(item)}
                  className="bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg hover:bg-orange-600 transition cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DealsAndRecommended;