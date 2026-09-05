import React, { useEffect } from 'react';
import 'aos/dist/aos.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import MenuFood from './components/MenuFood';
import MenuSnack from './components/MenuSnack';
import MenuDessert from './components/MenuDessert';
import MenuSoup from './components/MenuSoup';
import DetailMenuFood from './components/DetailMenuFood';
import DetailMenuSnack from './components/DetailMenuSnack';
import DetailMenuSoup from './components/DetailMenuSoup';
import DetailMenuDessert from './components/DetailMenuDessert';
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

  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Home page */}
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />

        {/* All Menu in Category */}
        <Route path="/MenuFood" element={<MenuFood/>} />
        <Route path='/MenuSnack' element={<MenuSnack/>}/>
        <Route path='/MenuDessert' element={<MenuDessert/>}/>
        <Route path='/MenuSoup' element={<MenuSoup/>}/>

        {/* Detail menu  */}
        <Route path='/MenuFood/:id' element={<DetailMenuFood/>}/>
        <Route path='/MenuSnack/:id' element={<DetailMenuSnack/>}/>
        <Route path='/MenuDessert/:id' element={<DetailMenuDessert/>}/>
        <Route path='/MenuSoup/:id' element={<DetailMenuSoup/>}/>

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

        {/* All Menu page */}
        <Route path='/menu' element={<AllMenu/>}/>

        {/* About page */}
        <Route path='/about' element={<About/>}/>

        {/* Auth pages */}
        <Route path='/login' element={<Login/>}/>
        <Route path='/register' element={<Register/>}/>

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
