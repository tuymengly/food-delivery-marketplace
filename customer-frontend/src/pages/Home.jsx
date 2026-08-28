import React from 'react';
import Benner from '../components/Benner';
import Category from '../components/Category';
import Features from '../components/Features';
import Footer from '../components/Footer';
import DealsAndRecommended from '../components/DealsAndRecommended';

const Home = () => {
  return (
    <div>
      <Benner />
      <Category />
      <DealsAndRecommended />
      <Features />
      <Footer />
    </div>
  );
};

export default Home;
