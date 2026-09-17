import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { fetchFoods } from '../api/foodApi';
import { IoSearch } from 'react-icons/io5';
import { FaArrowLeft } from 'react-icons/fa';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(query);
  const [results, setResults] = useState([]);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFoods()
      .then(setFoods)
      .catch((error) => console.error('Error fetching search data:', error))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setSearchQuery(query);
    performSearch(query);
  }, [query, foods]);

  const performSearch = (searchTerm) => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    const term = searchTerm.trim().toLowerCase();
    
    // Search across all categories
    const allItems = foods.map(item => {
      const category = item.category?.toLowerCase() || '';
      const type = category.includes('dessert') ? 'dessert' :
        category.includes('snack') ? 'snack' :
        category.includes('soup') ? 'soup' : 'food';
      return { ...item, type, detailLink: `/food/${item.id}` };
    });

    const filtered = allItems.filter((item) => {
      const searchableText = [item.name, item.category, item.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(term);
    });

    setResults(filtered);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const term = searchQuery.trim();
    navigate(term ? `/search?q=${encodeURIComponent(term)}` : '/search');
  };

  return (
    <div className="w-full min-h-screen bg-[#F4F5F7] pt-24 pb-16 px-6 md:px-14">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center gap-2 text-[#0B1F3B] hover:text-[#132C52] font-semibold mb-8 group">
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform duration-300" />
          Back to Home
        </Link>

        {/* Search Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#0B1F3B] mb-4">
            Search Results
          </h1>
          {query && (
            <p className="text-slate-600 text-lg">
              Showing results for "<span className="font-bold text-[#0B1F3B]">{query}</span>"
            </p>
          )}
        </div>

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-12">
          <form onSubmit={handleSearch} className="relative">
            <IoSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-2xl" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your favourite foods today"
              className="w-full pl-14 pr-4 py-4 border border-[#D6DBE3] focus:border-[#0B1F3B] outline-none transition-all duration-300 text-lg bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setResults([]);
                }}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1A2233] font-bold text-xl cursor-pointer"
              >
                ✕
              </button>
            )}
          </form>
        </div>

        {/* Results Count */}
        <div className="mb-8">
          <p className="text-center text-slate-700 text-lg font-semibold">
            Found <span className="text-[#0B1F3B]">{results.length}</span> {results.length === 1 ? 'item' : 'items'}
          </p>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="text-center py-20 text-slate-600">Searching menu...</div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {results.map((item) => (
              <Link
                key={`${item.type}-${item.id}`}
                to={item.detailLink}
                className="bg-white overflow-hidden border border-[#D6DBE3] hover:border-[#0B1F3B] transition group"
              >
                {/* Image */}
                <div className="relative h-56 overflow-hidden bg-[#0B1F3B]">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-[#0B1F3B] text-white px-3 py-1.5 font-bold text-base">
                    ${item.price}
                  </div>
                  <div className="absolute top-4 right-4 bg-white px-2.5 py-1">
                    <span className="text-[#0B1F3B] font-semibold text-xs uppercase">{item.type}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-[#1A2233] mb-1 group-hover:text-[#0B1F3B] transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-sm text-slate-500 mb-2">{item.category}</p>
                  <p className="text-sm text-[#0B1F3B] font-semibold mb-3">
                    From: {item.restaurantName}
                  </p>
                  {item.description && (
                    <p className="text-sm text-slate-600 line-clamp-2 mb-4">{item.description}</p>
                  )}
                  <div className="w-full px-4 py-2 text-center text-white bg-[#0B1F3B] group-hover:bg-[#132C52] transition font-semibold text-sm">
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
            <h3 className="text-3xl font-bold text-[#1A2233] mb-4">No results found</h3>
            <p className="text-slate-600 mb-8 text-lg max-w-md mx-auto">
              We couldn't find any dishes matching "<span className="font-bold">{query}</span>". Try searching with different keywords.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setResults([]);
                navigate('/search', { replace: true });
              }}
              className="px-8 py-4 bg-[#0B1F3B] hover:bg-[#132C52] text-white font-bold text-lg transition cursor-pointer"
            >
              Clear Search
            </button>
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-20">
            <div className="text-7xl mb-6">🍽️</div>
            <h3 className="text-3xl font-bold text-[#1A2233] mb-4">Start Searching</h3>
            <p className="text-slate-600 text-lg">
              Enter a keyword to search across all our delicious menu items
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;