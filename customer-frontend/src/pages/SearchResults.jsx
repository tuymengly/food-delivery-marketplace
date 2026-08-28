import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { khmerFoods, khmerSnacks, MenuSoup, khmerDessert } from '../data';
import { IoSearch } from 'react-icons/io5';
import { FaArrowLeft } from 'react-icons/fa';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(query);
  const [results, setResults] = useState([]);

  useEffect(() => {
    setSearchQuery(query);
    performSearch(query);
  }, [query]);

  const performSearch = (searchTerm) => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    const term = searchTerm.toLowerCase();
    
    // Search across all categories
    const allItems = [
      ...khmerFoods.map(item => ({ ...item, type: 'food', detailLink: `/MenuFood/${item.id}` })),
      ...khmerSnacks.map(item => ({ ...item, type: 'snack', detailLink: `/MenuSnack/${item.id}` })),
      ...MenuSoup.map(item => ({ ...item, type: 'soup', detailLink: `/MenuSoup/${item.id}` })),
      ...khmerDessert.map(item => ({ ...item, type: 'dessert', detailLink: `/MenuDessert/${item.id}` }))
    ];

    const filtered = allItems.filter(item =>
      item.name.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term) ||
      (item.description && item.description.toLowerCase().includes(term))
    );

    setResults(filtered);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-orange-50 to-white pt-24 pb-16 px-6 md:px-14">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link to="/home" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold mb-8 group">
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform duration-300" />
          Back to Home
        </Link>

        {/* Search Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-gradient-to-r from-orange-600 via-red-500 to-orange-600 bg-clip-text mb-4">
            Search Results
          </h1>
          {query && (
            <p className="text-gray-600 text-lg">
              Showing results for "<span className="font-bold text-orange-600">{query}</span>"
            </p>
          )}
        </div>

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-12">
          <form onSubmit={handleSearch} className="relative">
            <IoSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500 text-2xl" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your favourite foods today"
              className="w-full pl-14 pr-4 py-4 rounded-2xl border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all duration-300 shadow-lg text-lg"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setResults([]);
                }}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold text-xl"
              >
                ✕
              </button>
            )}
          </form>
        </div>

        {/* Results Count */}
        <div className="mb-8">
          <p className="text-center text-gray-700 text-lg font-semibold">
            Found <span className="text-orange-600">{results.length}</span> {results.length === 1 ? 'item' : 'items'}
          </p>
        </div>

        {/* Results Grid */}
        {results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {results.map((item) => (
              <Link
                key={`${item.type}-${item.id}`}
                to={item.detailLink}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-gray-100 group"
              >
                {/* Image */}
                <div className="relative h-64 overflow-hidden bg-gradient-to-br from-orange-400 via-red-400 to-orange-500 p-4">
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-all duration-500"></div>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-xl shadow-xl group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute top-6 left-6 bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2 rounded-full shadow-lg font-bold text-lg">
                    ${item.price}
                  </div>
                  <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-md">
                    <span className="text-orange-600 font-semibold text-xs uppercase">{item.type}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors duration-300">
                    {item.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">{item.category}</p>
                  {item.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">{item.description}</p>
                  )}
                  <div className="w-full px-4 py-2 text-center rounded-xl text-white bg-gradient-to-r from-orange-500 to-red-500 group-hover:from-orange-600 group-hover:to-red-600 transition-all duration-300 font-semibold text-sm">
                    View Details
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : query ? (
          /* No Results */
          <div className="text-center py-20">
            <div className="text-7xl mb-6">🔍</div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">No results found</h3>
            <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
              We couldn't find any dishes matching "<span className="font-bold">{query}</span>". Try searching with different keywords.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setResults([]);
                window.history.replaceState({}, '', '/search');
              }}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              Clear Search
            </button>
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-20">
            <div className="text-7xl mb-6">🍽️</div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Start Searching</h3>
            <p className="text-gray-600 text-lg">
              Enter a keyword to search across all our delicious menu items
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
