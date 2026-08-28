import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AOS from 'aos';
import { khmerSnacks } from '../data'
import { IoSearch } from 'react-icons/io5';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useTranslation } from 'react-i18next'

const MenuSnack = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSnacks, setFilteredSnacks] = useState(khmerSnacks);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
   const { t } = useTranslation();

  useEffect(() => {
    AOS.init({
      duration: 500,
      once: true,
    });
  }, []);

  useEffect(() => {
    const filtered = khmerSnacks.filter(snack =>
      snack.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snack.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snack.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredSnacks(filtered);
    setCurrentPage(1);
  }, [searchQuery]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSnacks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSnacks.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className='w-full h-auto bg-gradient-to-b from-orange-50 to-white'>
          <div className='w-full h-auto py-16 px-6 md:px-14'>
                {/* title category */}
                <div className='text-center mb-12'>
                  <span className='inline-block text-orange-600 font-bold text-sm uppercase tracking-[0.3em] mb-4'>
                    🥟 Snacks Collection
                  </span>
                  <h1 className='text-4xl md:text-5xl font-extrabold text-transparent bg-gradient-to-r from-orange-600 via-red-500 to-orange-600 bg-clip-text mb-4'>
                    Delicious Khmer Snacks
                  </h1>
                  <p className='text-gray-600 text-lg max-w-2xl mx-auto'>
                    Perfect bites for any time of the day
                  </p>
                  <div className='flex items-center justify-center gap-2 mt-6'>
                    <div className='w-2 h-2 bg-orange-500 rounded-full'></div>
                    <div className='w-24 h-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full'></div>
                    <div className='w-2 h-2 bg-orange-500 rounded-full'></div>
                  </div>
                </div>

                {/* Search Bar */}
                <div className='max-w-2xl mx-auto mb-8'>
                  <div className='relative'>
                    <IoSearch className='absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 text-xl' />
                    <input
                      type='text'
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder='Search snacks by name, category, or description...'
                      className='w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all duration-300 shadow-md hover:shadow-lg'
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold'
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <p className='text-sm text-gray-500 mt-2 text-center'>
                    Found {filteredSnacks.length} {filteredSnacks.length === 1 ? 'snack' : 'snacks'}
                    {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
                  </p>
                </div>

                {/* main card */}
                <div className="w-full h-auto py-8 grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-8">
                  {currentItems.length > 0 ? (
                    currentItems.map((s, index)=>(

                      <div data-aos="fade-up"
                          data-aos-delay={index * 100}
                          data-aos-duration="800"
                          key={s.id}
                          className='bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 ease-in-out group hover:-translate-y-3 border border-gray-100'>

                        {/* image */}
                        <div className='relative w-full h-[260px] p-4 bg-gradient-to-br from-orange-400 via-red-400 to-orange-500 overflow-hidden'>
                          <img src={s.image} className='w-full h-full object-cover rounded-xl shadow-xl group-hover:scale-110 transition-transform duration-700' alt={s.name} />
                          <div className="absolute top-4 left-4 bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2 rounded-full shadow-lg font-bold text-lg">
                            ${s.price}
                          </div>
                        </div>

                        {/* text */}
                        <div className='p-5 flex flex-col justify-between h-[200px]'>
                          <div>
                            <h1 className='text-gray-900 text-xl font-bold mb-2 group-hover:text-orange-600 transition-colors duration-300'>{s.name}</h1>
                            <p className='text-gray-500 text-sm'>Authentic Khmer Recipe</p>
                          </div>

                          <Link to={`/MenuSnack/${s.id}`} className='block text-center w-full px-6 py-3 rounded-xl text-white bg-gradient-to-r from-orange-500 to-red-500 
                          hover:from-orange-600 hover:to-red-600 hover:scale-105 hover:shadow-xl hover:shadow-orange-300/50
                          transition-all duration-300 font-semibold'>
                            {t('button.viewDetails')}
                          </Link>
                        </div>

                      </div>
                    ))
                  ) : (
                    <div className='w-full text-center py-20'>…</div>
                  )}
                </div>

                




                {/* Pagination */}
                {totalPages > 1 && (
                  <div className='flex items-center justify-center gap-2 mt-12 mb-8'>
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
                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
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
                      } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                        return <span key={pageNumber} className='text-gray-400 px-2'>...</span>;
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
  )
}

export default MenuSnack