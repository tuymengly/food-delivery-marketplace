import React, { useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";
import AOS from "aos";
import "aos/dist/aos.css";

const Contact = () => {
  const { t } = useTranslation();

  useEffect(() => {
    AOS.init({
      duration: 900,
      easing: "ease-in-out",
      once: true,
    });
  }, []);

  return (
    <div
      className="w-full min-h-screen bg-gradient-to-b from-orange-50 to-white py-16 px-6 lg:px-24"
      data-aos="fade-up"
    >

      {/* Title */}
      <div className="text-center mb-14">
        <h2 data-aos="fade-down" className="text-4xl font-bold text-orange-600">
          {t('contact.title')}
        </h2>
        <p data-aos="fade-up" className="text-gray-600 mt-3 text-lg max-w-2xl mx-auto">
          {t('contact.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">

        {/* Contact Information */}
        <div className="space-y-8">

          <div data-aos="fade-right" className="flex items-start gap-4">
            <FaPhoneAlt className="text-orange-600 text-3xl" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{t('contact.phone')}</h3>
              <p className="text-gray-600">012 345 678 / 098 765 432</p>
            </div>
          </div>

          <div data-aos="fade-right" data-aos-delay="150" className="flex items-start gap-4">
            <FaEnvelope className="text-orange-600 text-3xl" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{t('contact.email')}</h3>
              <p className="text-gray-600">support@biterush.com</p>
            </div>
          </div>

          <div data-aos="fade-right" data-aos-delay="300" className="flex items-start gap-4">
            <FaMapMarkerAlt className="text-orange-600 text-3xl" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{t('contact.address')}</h3>
              <p className="text-gray-600">#123 Phnom Penh, Cambodia</p>
            </div>
          </div>

          {/* Social Media */}
          <div data-aos="zoom-in" data-aos-delay="450" className="flex gap-5 text-orange-600 text-3xl mt-6">
            <FaFacebook className="cursor-pointer hover:text-orange-700 hover:scale-125 transition" />
            <FaInstagram className="cursor-pointer hover:text-orange-700 hover:scale-125 transition" />
            <FaTiktok className="cursor-pointer hover:text-orange-700 hover:scale-125 transition" />
          </div>
        </div>

        {/* Contact Form */}
        <div data-aos="fade-left" className="bg-white shadow-lg rounded-xl p-10 border border-orange-200">
          <form className="space-y-5">
            <input
              type="text"
              placeholder={t('contact.fullName')}
              className="w-full border px-4 py-3 rounded-lg focus:ring focus:ring-orange-300 outline-none"
            />

            <input
              type="email"
              placeholder={t('contact.emailAddress')}
              className="w-full border px-4 py-3 rounded-lg focus:ring focus:ring-orange-300 outline-none"
            />

            <textarea
              rows="5"
              placeholder={t('contact.yourMessage')}
              className="w-full border px-4 py-3 rounded-lg focus:ring focus:ring-orange-300 outline-none"
            ></textarea>

            <button
              data-aos="zoom-in"
              className="w-full bg-orange-600 hover:bg-orange-700 hover:scale-105 transition-all duration-300 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-orange-300"
            >
              {t('contact.sendMessage')}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Contact;
