import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Category = () => {
    const { t } = useTranslation();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        AOS.init({
            duration: 500, 
            once: true, 
        });

        const fetchCategories = async () => {
            try {
                // ហៅទៅកាន់ Endpoint: GET /api/categories
                const response = await api.get('/categories');
                
                // ទាញយកទិន្នន័យពី response.data.data តាមโครงចារ JSON របស់ Laravel Controller
                setCategories(response.data.data);
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    return (
        <div className="bg-gradient-to-b from-amber-50 to-white py-16">
            <div className="container mx-auto px-4">
                {/* Top Category Section */}
                <div className="text-center mb-16 px-4">
                    <span className="inline-block text-orange-600 font-bold text-sm uppercase tracking-[0.3em] mb-4">
                        🍜 {t("menuSection.smallTitle")}
                    </span>

                    <h2 className="text-4xl md:text-6xl font-extrabold text-transparent bg-gradient-to-r from-orange-600 via-red-500 to-orange-600 bg-clip-text mb-6 leading-tight">
                        {t("menuSection.mainTitle")}
                    </h2>

                    <p className="text-gray-700 text-lg md:text-xl max-w-3xl mx-auto mb-8 font-medium">
                        {t("menuSection.descriptionPart1")}
                        <span className="text-orange-600 font-semibold"> {t("menuSection.descriptionPart2")}</span>
                    </p>

                    <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 text-lg">Loading categories...</p>
                    </div>
                ) : (
                    /* Main Card */
                    <div className="w-full h-auto py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {categories.map((s, index) => (
                            <div
                                data-aos="fade-up"
                                data-aos-delay={index * 100}
                                data-aos-duration="800"
                                key={s.id}
                                className='w-full h-[520px] bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 ease-in-out group hover:-translate-y-3 border border-gray-100'
                            >
                                {/* Image */}
                                <div className='relative w-full h-[60%] p-4 bg-gradient-to-br from-orange-400 via-red-400 to-orange-500 overflow-hidden'>
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-all duration-500"></div>
                                    <img 
                                        src={s.image_url || s.image || 'https://via.placeholder.com/400'} 
                                        className='w-full h-full object-cover rounded-xl shadow-xl group-hover:scale-110 transition-transform duration-700' 
                                        alt={s.name} 
                                    />

                                    {/* បង្ហាញចំនួន foods ដែលមានក្នុង category នេះ (ព្រោះប្រើ withCount('foods')) */}
                                    <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg">
                                        <span className="text-orange-600 font-bold text-sm">{s.foods_count} Items</span>
                                    </div>
                                </div>

                                {/* Detail Card */}
                                <div className='w-full h-[40%] p-5 bg-white flex flex-col justify-between'>
                                    <div>
                                        <h1 className='text-gray-900 text-2xl font-bold mb-2 group-hover:text-orange-600 transition-colors duration-300'>
                                            {s.name}
                                        </h1>
                                        <p className='text-gray-600 text-sm leading-relaxed line-clamp-2'>
                                            {s.description}
                                        </p>
                                    </div>

                                    <Link
                                        to={`/menu?category=${s.id}`}
                                        className='inline-block text-center px-6 py-2.5 rounded-xl text-white bg-gradient-to-r from-orange-500 to-red-500 
                                        hover:from-orange-600 hover:to-red-600 hover:scale-105 hover:shadow-xl hover:shadow-orange-300/50
                                        transition-all duration-300 font-semibold mt-3'
                                    >
                                       {t('button.exploreMenu')} →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Category;