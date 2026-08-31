import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import { khmerFoods } from '../data';
import { IoSearch } from 'react-icons/io5';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import 'aos/dist/aos.css';

const MenuFood = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFoods, setFilteredFoods] = useState(khmerFoods);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const { t } = useTranslation();

  useEffect(() => {
    AOS.init({
      duration: 500,
      once: true,
    });
  }, []);

  // 🔎 Filter foods
  useEffect(() => {
    const filtered = khmerFoods.filter(
      (food) =>
        food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        food.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        food.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredFoods(filtered);
    setCurrentPage(1);
  }, [searchQuery]);

  // 🔢 Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredFoods.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredFoods.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-orange-50 to-white overflow-x-hidden">
      <div className="w-full py-16 px-4 sm:px-6 md:px-10 lg:px-14">
        {/* 🍽️ Section Title */}
        <div className="text-center mb-12">
          <span className="inline-block text-orange-600 font-bold text-xs sm:text-sm uppercase tracking-[0.3em] mb-3 sm:mb-4">
            🍽️ Main Dishes
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-gradient-to-r from-orange-600 via-red-500 to-orange-600 bg-clip-text mb-3 sm:mb-4">
            Authentic Khmer Cuisine
          </h1>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto px-4">
            Experience the rich flavors of traditional Cambodian main dishes
          </p>
          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <div className="w-20 sm:w-24 h-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          </div>
        </div>

        {/* 🔍 Search Bar */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="relative">
            <IoSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 text-xl" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes by name, category, or description..."
              className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-2xl border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all duration-300 shadow-sm hover:shadow-md text-sm sm:text-base"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-2 text-center">
            Found {filteredFoods.length}{' '}
            {filteredFoods.length === 1 ? 'dish' : 'dishes'}
            {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
          </p>
        </div>

        {/* 🧆 Food Cards Grid */}
        <div className="w-full flex flex-wrap gap-6 justify-center">
          {currentItems.length > 0 ? (
            currentItems.map((s, index) => (
              <div
                key={s.id}
                data-aos="fade-up"
                data-aos-delay={index * 100}
                className="w-full sm:w-[48%] lg:w-[23%] bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 ease-in-out group hover:-translate-y-2 border border-gray-100"
              >
                {/* Image */}
                <div className="relative w-full aspect-[4/3] sm:aspect-[3/2] bg-gradient-to-br from-orange-400 via-red-400 to-orange-500 overflow-hidden">
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-all duration-500"></div>
                  <img
                    src={s.image}
                    alt={s.name}
                    className="w-full h-full object-cover rounded-t-2xl group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-1.5 rounded-full shadow-lg font-bold text-sm sm:text-base">
                    ${s.price}
                  </div>
                </div>

                {/* Info */}
                <div className="p-5 flex flex-col justify-between h-[220px] sm:h-[240px]">
                  <div>
                    <h1 className="text-gray-900 text-xl sm:text-2xl font-bold mb-2 group-hover:text-orange-600 transition-colors duration-300">
                      {s.name}
                    </h1>
                    <p className="text-gray-500 text-sm sm:text-base">
                      Authentic Khmer Recipe
                    </p>
                  </div>
                  <Link
                    to={`/MenuFood/${s.id}`}
                    className="mt-4 block text-center w-full px-6 py-3 rounded-xl text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 hover:scale-105 hover:shadow-xl transition-all duration-300 font-semibold text-sm sm:text-base"
                  >
                    {t('button.viewDetails')}
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="w-full text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No dishes found
              </h3>
              <p className="text-gray-600 mb-6">
                Try searching with different keywords
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-semibold shadow-lg hover:scale-105 transition-all duration-300"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>

        {/* 📄 Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12 mb-8 flex-wrap">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-3 rounded-lg font-semibold transition-all ${
                currentPage === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-orange-600 hover:bg-orange-50 border-2 border-orange-600 shadow-md hover:shadow-lg'
              }`}
            >
              <FaChevronLeft />
            </button>

            {[...Array(totalPages)].map((_, index) => {
              const pageNumber = index + 1;
              if (
                pageNumber === 1 ||
                pageNumber === totalPages ||
                (pageNumber >= currentPage - 1 &&
                  pageNumber <= currentPage + 1)
              ) {
                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                      currentPage === pageNumber
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg scale-110'
                        : 'bg-white text-gray-700 hover:bg-orange-50 border-2 border-gray-300 shadow-md hover:shadow-lg'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              } else if (
                pageNumber === currentPage - 2 ||
                pageNumber === currentPage + 2
              ) {
                return (
                  <span key={pageNumber} className="text-gray-400 px-2">
                    ...
                  </span>
                );
              }
              return null;
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-3 rounded-lg font-semibold transition-all ${
                currentPage === totalPages
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-orange-600 hover:bg-orange-50 border-2 border-orange-600 shadow-md hover:shadow-lg'
              }`}
            >
              <FaChevronRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuFood;
