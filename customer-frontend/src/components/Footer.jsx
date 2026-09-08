import React from 'react';
import { ChefHat, MapPin, Phone, Mail } from 'lucide-react';
import { FaFacebook, FaInstagram, FaTwitter } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          
          {/* Brand & Socials */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <ChefHat className="w-8 h-8 text-orange-500" strokeWidth={2}/>
              <span className="text-2xl font-bold text-white">BiteRush</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Bringing authentic Khmer cuisine to your doorstep. Experience the rich flavors and traditions of Cambodia.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="bg-gray-800 p-2.5 rounded-full hover:bg-orange-500 hover:text-white transition-colors duration-200">
                <FaFacebook className="w-4 h-4" />
              </a>
              <a href="#" className="bg-gray-800 p-2.5 rounded-full hover:bg-orange-500 hover:text-white transition-colors duration-200">
                <FaInstagram className="w-4 h-4" />
              </a>
              <a href="#" className="bg-gray-800 p-2.5 rounded-full hover:bg-orange-500 hover:text-white transition-colors duration-200">
                <FaTwitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#home" className="hover:text-orange-500 transition-colors duration-200">Home</a></li>
              <li><a href="#menu" className="hover:text-orange-500 transition-colors duration-200">Menu</a></li>
              <li><a href="#about" className="hover:text-orange-500 transition-colors duration-200">About Us</a></li>
              <li><a href="#reservations" className="hover:text-orange-500 transition-colors duration-200">Reservations</a></li>
              <li><a href="#contact" className="hover:text-orange-500 transition-colors duration-200">Contact</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Support</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-orange-500 transition-colors duration-200">Help Center</a></li>
              <li><a href="#" className="hover:text-orange-500 transition-colors duration-200">Terms of Service</a></li>
              <li><a href="#" className="hover:text-orange-500 transition-colors duration-200">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-orange-500 transition-colors duration-200">FAQs</a></li>
              <li><a href="#" className="hover:text-orange-500 transition-colors duration-200">Delivery Info</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-orange-500 flex-shrink-0 mt-1" />
                <span>123 Street, Phnom Penh, Cambodia</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <span>+855 12 345 678</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <span>info@biterush.com</span>
              </li>
            </ul>
            <div className="mt-4">
              <h4 className="text-white font-semibold text-sm mb-1">Opening Hours</h4>
              <p className="text-sm text-gray-400">Mon - Sun: 8:00 AM - 10:00 PM</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
            <p className="text-sm text-gray-400">© 2026 BiteRush. All rights reserved.</p>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="hover:text-orange-500 transition-colors duration-200">Privacy</a>
              <a href="#" className="hover:text-orange-500 transition-colors duration-200">Terms</a>
              <a href="#" className="hover:text-orange-500 transition-colors duration-200">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;