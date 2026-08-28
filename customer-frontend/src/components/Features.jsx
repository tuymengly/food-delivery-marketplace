import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaClock, FaShieldAlt, FaLeaf, FaHeart } from 'react-icons/fa';
import { MdDeliveryDining } from 'react-icons/md';
import { BiDish } from 'react-icons/bi';

const Features = () => {
  const { t } = useTranslation();
  
  const features = [
    {
      icon: <MdDeliveryDining className="text-5xl" />,
      title: t('home.fastDelivery'),
      description: t('home.fastDeliveryDesc'),
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: <FaLeaf className="text-5xl" />,
      title: t('home.freshIngredients'),
      description: t('home.freshIngredientsDesc'),
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: <BiDish className="text-5xl" />,
      title: t('home.authenticRecipes'),
      description: t('home.authenticRecipesDesc'),
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: <FaShieldAlt className="text-5xl" />,
      title: t('home.qualityGuaranteed'),
      description: t('home.qualityGuaranteedDesc'),
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: <FaClock className="text-5xl" />,
      title: t('home.open247'),
      description: t('home.open247Desc'),
      gradient: "from-amber-500 to-yellow-500"
    },
    {
      icon: <FaHeart className="text-5xl" />,
      title: t('home.madeWithLove'),
      description: t('home.madeWithLoveDesc'),
      gradient: "from-red-500 to-pink-500"
    }
  ];

  return (
    <div className="w-full bg-gradient-to-b from-white via-orange-50 to-white py-20 px-6 md:px-14">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-orange-600 font-bold text-sm uppercase tracking-[0.3em] mb-4">
            ✨ {t('home.whyChooseUs')}
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-gradient-to-r from-orange-600 via-red-500 to-orange-600 bg-clip-text mb-6">
            {t('home.whatMakesUsSpecial')}
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {t('home.featuresSubtitle')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              data-aos="fade-up"
              data-aos-delay={index * 100}
              className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100"
            >
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                {feature.icon}
              </div>
              
              {/* Content */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer">
            <span className="text-xl font-bold">{t('home.readyToOrder')}</span>
            <span className="text-2xl">🍽️</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;
