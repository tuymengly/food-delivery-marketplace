import React, { useEffect } from 'react';
import 'aos/dist/aos.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import FoodDetail from './pages/FoodDetail';
import Favorites from './pages/Favorites';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import OrderTracking from './pages/OrderTracking';
import OrderHistory from './pages/OrderHistory';
import AllMenu from './pages/AllMenu';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import SearchResults from './pages/SearchResults';
import Reservation from './pages/Reservation';
import Service from './pages/Service';
import Contact from './pages/Contact';
import Pickup from './pages/Pickup';
import Shops from './pages/Shops';
import Restaurants from './pages/Restaurants';
import RestaurantDetail from './pages/RestaurantDetail';
import Profile from './pages/Profile';
import VerifyOtp from './pages/VerifyOtp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { bootstrapSessionFromUrlToken } from './api/app';

// import { Contact } from 'lucide-react';
import AOS from "aos";
import "aos/dist/aos.css";


const App = () => {
    useEffect(() => {
    AOS.init({
      duration: 900,
      offset: 80,
      once: true,
    });
  }, []);

  // Picks up a session handed off from the admin-restaurant app via ?token=,
  // e.g. a customer who logged in on the wrong portal and got redirected here.
  useEffect(() => {
    bootstrapSessionFromUrlToken().then((didBootstrap) => {
      if (didBootstrap) window.dispatchEvent(new Event('authChanged'));
    });
  }, []);

  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Menu page is the default/first page customers see */}
        <Route path="/" element={<AllMenu />} />
        <Route path="/home" element={<Navigate to="/" replace />} />

        {/* Food detail page (single page for every category - see FoodDetail.jsx) */}
        <Route path='/food/:id' element={<FoodDetail/>}/>

        {/* Favorites page */}
        <Route path='/favorites' element={<Favorites/>}/>

        {/* Cart page */}
        <Route path='/cart' element={<Cart/>}/>

        {/* Checkout page */}
        <Route path='/checkout' element={<Checkout/>}/>

        {/* Order Success page */}
        <Route path='/order-success' element={<OrderSuccess/>}/>

        <Route path="/order-tracking" element={<OrderTracking />} />

        {/* Order History page */}
        <Route path='/order-history' element={<OrderHistory/>}/>
        <Route path='/profile' element={<Profile/>}/>

        {/* All Menu page */}
        <Route path='/menu' element={<AllMenu/>}/>

        {/* Primary marketplace modes */}
        <Route path='/pickup' element={<Pickup/>}/>
        <Route path='/shops' element={<Shops/>}/>
        <Route path='/restaurants' element={<Restaurants/>}/>
        <Route path='/restaurants/:id' element={<RestaurantDetail/>}/>

        {/* About page */}
        <Route path='/about' element={<About/>}/>

        {/* Auth pages */}
        <Route path='/login' element={<Login/>}/>
        <Route path='/register' element={<Register/>}/>
        <Route path='/verify-otp' element={<VerifyOtp/>}/>
        <Route path='/forgot-password' element={<ForgotPassword/>}/>
        <Route path='/reset-password' element={<ResetPassword/>}/>

        {/* Search page */}
        <Route path='/search' element={<SearchResults/>}/>
        
        {/* Reservation page */}
        <Route path='/reservation' element={<Reservation/>}/>

        {/* service page */}
        <Route path='/service' element={<Service/>}/>

        {/* Contact page */}
        <Route path='/contact' element={<Contact/>}/>

      </Routes>
      
    </Router>
  );
};

export default App;
