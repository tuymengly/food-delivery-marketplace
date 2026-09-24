import { useEffect } from 'react';
import 'aos/dist/aos.css';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import Navbar from './components/Navbar';
import FoodDetail from './pages/FoodDetail';
import Favorites from './pages/Favorites';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import KhqrPayment from './pages/KhqrPayment';
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
import ShopDetail from './pages/ShopDetail';
import Profile from './pages/Profile';
import VerifyOtp from './pages/VerifyOtp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { bootstrapSessionFromUrlToken, hydrateAuthSession, redirectAwayIfNotCustomer } from './api/app';

// import { Contact } from 'lucide-react';
import AOS from "aos";
import "aos/dist/aos.css";


// The customer-facing list used to be called "Restaurants" and is now "Shop(s)".
// The singular /shop alias and the older /restaurants links (bookmarks, shared
// URLs) both resolve by redirecting to the canonical /shops routes, keeping any
// query string (e.g. ?type=pickup).
const ShopRedirect = () => {
  const { id } = useParams();
  const location = useLocation();
  const target = `/shops${id ? `/${id}` : ''}`;
  return <Navigate to={`${target}${location.search}`} replace />;
};

const App = () => {
    useEffect(() => {
    AOS.init({
      duration: 900,
      offset: 80,
      once: true,
    });
  }, []);

  // Re-establishes the session from Laravel on every app start/refresh:
  // picks up a ?token= handoff from the admin-restaurant app (verified against
  // GET /api/user) and otherwise re-reads the current user for the stored
  // token, so the cached user/role is always replaced by the database's
  // answer. An invalid/expired token clears the cache instead of leaving a
  // stale role behind.
  useEffect(() => {
    (async () => {
      const didBootstrap = await bootstrapSessionFromUrlToken();
      const user = await hydrateAuthSession();

      // A role change (or a session that only ever belonged on the other
      // portal) must not leave a non-customer role browsable here.
      if (user && redirectAwayIfNotCustomer(user)) return;

      if (didBootstrap) window.dispatchEvent(new Event('authChanged'));
    })();
  }, []);

  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Menu page is the default/first page customers see */}
        <Route path="/" element={<AllMenu />} />
        <Route path="/menu" element={<Navigate to="/" replace />} />

        {/* Food detail page (single page for every category - see FoodDetail.jsx) */}
        <Route path='/food/:id' element={<FoodDetail/>}/>

        {/* Favorites page */}
        <Route path='/favorites' element={<Favorites/>}/>

        {/* Cart page */}
        <Route path='/cart' element={<Cart/>}/>

        {/* Checkout page */}
        <Route path='/checkout' element={<Checkout/>}/>

        {/* KHQR payment - scan/poll page shown after placing a KHQR order */}
        <Route path='/payment/khqr/:paymentId' element={<KhqrPayment/>}/>

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
        <Route path='/shops/:id' element={<ShopDetail/>}/>

        {/* Renamed from /restaurants - /shop and old links keep working */}
        <Route path='/shop' element={<ShopRedirect/>}/>
        <Route path='/shop/:id' element={<ShopRedirect/>}/>
        <Route path='/restaurants' element={<ShopRedirect/>}/>
        <Route path='/restaurants/:id' element={<ShopRedirect/>}/>

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
