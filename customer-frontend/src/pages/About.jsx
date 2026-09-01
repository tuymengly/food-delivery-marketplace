import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FaShippingFast, FaUtensils, FaLeaf, FaAward } from 'react-icons/fa';

import AOS from "aos";
import "aos/dist/aos.css";

const About = () => {
  const { t } = useTranslation();

  useEffect(() => {
    AOS.init({
      duration: 900,
      easing: "ease-in-out",
      once: true,
    });
  }, []);

  const advantages = [
    {
      icon: <FaShippingFast className="text-4xl text-orange-500" />,
      title: t('about.fastDelivery'),
      desc: t('about.fastDeliveryDesc')
    },
    {
      icon: <FaUtensils className="text-4xl text-orange-500" />,
      title: t('about.authenticRecipes'),
      desc: t('about.authenticRecipesDesc')
    },
    {
      icon: <FaAward className="text-4xl text-orange-500" />,
      title: t('about.awardWinning'),
      desc: t('about.awardWinningDesc')
    },
    {
      icon: <FaLeaf className="text-4xl text-orange-500" />,
      title: t('about.sustainable'),
      desc: t('about.sustainableDesc')
    }
  ];

  return (
    <div className="w-full min-h-screen bg-[#FFF9F5] pt-24 pb-16 px-6 md:px-14">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Hero Section */}
        <div data-aos="fade-down" className="text-center space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">
            {t('about.title')}
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            {t('about.subtitle')}
          </p>
        </div>

        {/* Story Section */}
        <div data-aos="fade-up" className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            {t('about.ourStory')}
          </h2>
          <p className="text-gray-600 leading-relaxed">
            {t('about.storyPara1')}
          </p>
          <p className="text-gray-600 leading-relaxed">
            {t('about.storyPara2')}
          </p>
        </div>

        {/* Advantages Section */}
        <div data-aos="fade-up">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-10">
            {t('about.whyChooseUs')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {advantages.map((item, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition text-center space-y-3">
                <div className="flex justify-center">{item.icon}</div>
                <h3 className="font-bold text-lg text-gray-800">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div data-aos="zoom-in" className="bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl p-12 text-white shadow-xl">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">5+</div>
              <p>{t('about.yearsOfService')}</p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">200+</div>
              <p>{t('about.menuItems')}</p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">10K+</div>
              <p>{t('about.happyCustomers')}</p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">4.9 ★</div>
              <p>{t('about.averageRating')}</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div data-aos="fade-up" className="text-center pt-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('about.ctaTitle')}
          </h2>
          <p className="text-gray-600 mb-8 text-lg max-w-2xl mx-auto">
            {t('about.ctaSubtitle')}
          </p>
          <Link
            to="/AllMenu"
            className="inline-block px-10 py-4 bg-gradient-to-r from-orange-500
             to-red-500 hover:from-orange-600 hover:to-red-600
             text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl
              hover:scale-105 transition-all duration-300"
          >
            {t('about.browseMenu')}
          </Link>
        </div>

      </div>
    </div>
  );
};

export default About;