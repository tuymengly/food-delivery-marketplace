import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { menu } from "../data";
import { IoSearch, IoCloseSharp } from "react-icons/io5";
import { FaRegHeart, FaRegUser, FaBars } from "react-icons/fa";
import { HiOutlineShoppingCart } from "react-icons/hi";
import LanguageSwitcher from "./LanguageSwitcher";
import { clearAuthSession, logoutUser } from "../api/app";

const Navbar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [openSidebar, setOpenSidebar] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchInput, setSearchInput] = useState("");

  const isActive = (path) => {
    // Don't highlight any menu when on favorites, cart, or order-related pages
    if (
      location.pathname === "/favorites" ||
      location.pathname === "/cart" ||
      location.pathname === "/checkout" ||
      location.pathname === "/order-success" ||
      location.pathname === "/order-history"
    ) {
      return false;
    }

    // Exact match for the path
    return location.pathname === path;
  };

  // Check user authentication
  useEffect(() => {
    const checkAuth = () => {
      const user =
        localStorage.getItem("currentUser") || localStorage.getItem("user");
      try {
        setCurrentUser(user ? JSON.parse(user) : null);
      } catch {
        setCurrentUser(null);
      }
    };

    checkAuth();

    // Listen for auth changes
    window.addEventListener("authChanged", checkAuth);
    return () => window.removeEventListener("authChanged", checkAuth);
  }, []);

  // Update favorites count on mount and listen for storage changes
  useEffect(() => {
    const updateFavoritesCount = () => {
      // Only show count if user is logged in
      const user =
        localStorage.getItem("currentUser") || localStorage.getItem("user");
      if (user) {
        const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
        setFavoritesCount(favorites.length);
      } else {
        setFavoritesCount(0);
      }
    };

    updateFavoritesCount();

    // Listen for storage changes (when favorites are updated)
    window.addEventListener("storage", updateFavoritesCount);

    // Custom event listener for same-window updates
    window.addEventListener("favoritesUpdated", updateFavoritesCount);

    return () => {
      window.removeEventListener("storage", updateFavoritesCount);
      window.removeEventListener("favoritesUpdated", updateFavoritesCount);
    };
  }, []);

  // Update cart count on mount and listen for storage changes
  useEffect(() => {
    const updateCartCount = async () => {
      // Only show count if user is logged in
      const user =
        localStorage.getItem("currentUser") || localStorage.getItem("user");
      if (!user || !localStorage.getItem("token")) {
        setCartCount(0);
        return;
      }

      try {
        const cart = await fetchCart();
        setCartCount(
          cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
        );
      } catch {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        setCartCount(
          cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
        );
      }
    };

    updateCartCount();

    window.addEventListener("storage", updateCartCount);
    window.addEventListener("cartUpdated", updateCartCount);

    return () => {
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("cartUpdated", updateCartCount);
    };
  }, []);

  return (
    <div className="w-full h-[80px] px-5 lg:px-14 shadow-lg sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-orange-100">
      {/* Navbar */}
      <div className="w-full h-full flex justify-between">
        {/* menu and logo */}
        <div className="lg:w-[55%] h-full flex justify-between items-center">
          {/* LEFT: LOGO */}
          <div className="flex items-center gap-3 flex-none pr-6">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-chef-hat w-6 h-6 text-white"
                >
                  <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"></path>
                  <line x1="6" x2="18" y1="17" y2="17"></line>
                </svg>
              </div>
              {/* //NAME  */}
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
                BiteRush
              </span>
            </Link>
          </div>

          {/* CENTER: MENU */}
          <ul className="hidden lg:flex flex-nowrap gap-8 flex-shrink justify-end pl-6 whitespace-nowrap overflow-hidden">
            {menu.map((u) => (
              <li className="group relative" key={u.id}>
                <Link
                  to={u.link}
                  className={`text-lg font-medium transition-all duration-300 ${
                    isActive(u.link)
                      ? "text-orange-600 font-semibold"
                      : "text-gray-700 hover:text-orange-600"
                  }`}
                >
                  {t(u.key)}
                  <span
                    className={`absolute left-0 -bottom-1 h-[3px] bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-300 ${
                      isActive(u.link) ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  ></span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* search & icons */}
        <div className="lg:w-[45%] h-full flex">
          {/* input search */}
          <div className="w-[75%] lg:flex hidden relative ps-24 p-5 h-full">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchInput.trim()) {
                  navigate(`/search?q=${encodeURIComponent(searchInput)}`);
                  setSearchInput("");
                }
              }}
              className="w-full h-full"
            >
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full h-full px-5 ps-12 rounded-full outline-0 shadow-md
                      border border-gray-200 text-gray-700 placeholder-gray-400
                      hover:border-orange-300 focus:border-orange-500 transition-all duration-300"
                placeholder={t("nav.search")}
              />
              <IoSearch className="absolute top-8 left-28 text-xl text-orange-500 pointer-events-none" />
            </form>
          </div>

          {/* icons */}
          <div className="lg:w-[30%] h-full flex items-center justify-around gap-2">
            <Link
              to="/favorites"
              className="relative group cursor-pointer lg:flex hidden"
            >
              <FaRegHeart
                className={`text-2xl group-hover:scale-110 transition-all duration-300 ${
                  location.pathname === "/favorites"
                    ? "text-red-500 scale-110"
                    : "text-gray-700 hover:text-red-500"
                }`}
              />
              {favoritesCount > 0 && (
                <div
                  className="w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 flex items-center
                    absolute -top-2 -right-2 text-xs font-bold justify-center text-white rounded-full 
                    shadow-lg group-hover:scale-110 transition-transform duration-300"
                >
                  {favoritesCount}
                </div>
              )}
            </Link>
            <IoSearch
              onClick={() => setOpenSearch(true)}
              className="text-2xl lg:text-xl lg:hidden flex text-gray-700 hover:text-orange-600 cursor-pointer"
            />

            <Link to="/cart" className="relative group cursor-pointer">
              <HiOutlineShoppingCart
                className={`text-2xl lg:text-2xl group-hover:scale-110 transition-all duration-300 ${
                  location.pathname === "/cart"
                    ? "text-orange-600 scale-110"
                    : "text-gray-700 hover:text-orange-600"
                }`}
              />
              {cartCount > 0 && (
                <div
                  className="w-5 h-5 bg-gradient-to-r
                    from-orange-500
                    to-red-500 flex items-center 
                    absolute -top-2 -right-2 text-xs 
                    font-bold justify-center text-white
                    rounded-full shadow-lg group-hover:scale-110 transition-transform duration-300"
                >
                  {cartCount}
                </div>
              )}
            </Link>

            {/* Language Switcher */}
            <div className="lg:flex hidden">
              <LanguageSwitcher />
            </div>

            <FaBars
              onClick={() => setOpenSidebar(!openSidebar)}
              className="text-2xl lg:text-xl lg:hidden flex cursor-pointer text-gray-700 hover:text-orange-600"
            />

            {/* User Icon / Login */}
            {currentUser ? (
              <div className="relative group lg:flex hidden">
                <div className="flex items-center gap-2 cursor-pointer">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                {/* Dropdown */}
                <div className="absolute right-0 top-12 bg-white rounded-xl shadow-2xl py-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 border border-gray-100">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="font-semibold text-gray-900 text-sm">
                      {currentUser.name}
                    </p>
                    <p className="text-xs text-gray-500">{currentUser.email}</p>
                  </div>
                  <Link
                    to="/favorites"
                    className="block px-4 py-2 text-gray-700 hover:bg-orange-50
                         hover:text-orange-600 transition-colors text-sm"
                  >
                    {t("nav.myFavorites")}
                  </Link>
                  <Link
                    to="/cart"
                    className="block px-4 py-2 text-gray-700
                         hover:bg-orange-50 hover:text-orange-600 transition-colors text-sm"
                  >
                    {t("nav.myCart")}
                  </Link>
                  <Link
                    to="/order-history"
                    className="block px-4 py-2 text-gray-700 hover:bg-orange-50
                       hover:text-orange-600 transition-colors text-sm"
                  >
                    {t("nav.orderHistory")}
                  </Link>
                  <button
                    onClick={async () => {
                      try {
                        await logoutUser();
                      } catch (requestError) {
                        console.error("Logout request failed:", requestError);
                      } finally {
                        clearAuthSession();
                        localStorage.removeItem("cart");
                        localStorage.removeItem("favorites");
                        setCurrentUser(null);
                        setCartCount(0);
                        setFavoritesCount(0);
                        window.dispatchEvent(new Event("authChanged"));
                        window.dispatchEvent(new Event("cartUpdated"));
                        window.dispatchEvent(new Event("favoritesUpdated"));
                        navigate("/home");
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-red-600
                     hover:bg-red-50 transition-colors text-sm border-t border-gray-100"
                  >
                    {t("nav.logout")}
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="lg:flex hidden items-center gap-2 px-4 py-2
                 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600
                 hover:to-red-600 text-white rounded-full font-semibold text-sm 
                 shadow-md hover:shadow-lg transition-all duration-300"
              >
                <FaRegUser />
                {t("nav.login")}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300
        ${openSidebar ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setOpenSidebar(false)}
      ></div>

      {/* Sidebar */}
      <div
        className={`w-[78%] max-w-[320px] h-screen fixed z-50 top-0 left-0
           bg-[linear-gradient(180deg,#ff5a00_0%,#ff5a00_72%,#ff3045_100%)] lg:hidden shadow-2xl
         ${openSidebar ? "translate-x-0" : "-translate-x-full"} transition-all duration-300 ease-in-out`}
      >
        {/* header */}
        <div className="w-full h-[80px] px-5 flex items-center justify-between border-b border-white/20">
          {/* logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6 text-white"
              >
                <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"></path>
                <line x1="6" x2="18" y1="17" y2="17"></line>
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">BiteRush</span>
          </Link>
          <IoCloseSharp
            className="text-white text-3xl md:text-4xl cursor-pointer hover:rotate-90 transition-transform duration-300"
            onClick={() => setOpenSidebar(false)}
          />
        </div>

        {/* menu */}
        <ul className="mt-5 px-3">
          {menu.map((u) => (
            <li
              className={`px-3 py-3.5 rounded-lg transition-all duration-300 ease-in-out ${
                isActive(u.link) ? "bg-white/20" : "hover:bg-white/15"
              }`}
              key={u.id}
            >
              <Link
                to={u.link}
                className={`text-base md:text-lg font-semibold transition-all duration-300 ease-in-out flex items-center ${
                  isActive(u.link)
                    ? "text-white"
                    : "text-white/95 hover:text-white"
                }`}
                onClick={() => setOpenSidebar(false)}
              >
                {t(u.key)}
              </Link>
            </li>
          ))}
        </ul>
        {/* button */}
        <div className="p-5 absolute bottom-6 left-0 right-0">
          <Link
            to="/menu"
            onClick={() => setOpenSidebar(false)}
            className="bg-white text-orange-600 w-full py-3 text-base md:text-lg font-bold
             rounded-xl shadow-lg hover:scale-[1.02] hover:shadow-xl transition-all duration-300 flex items-center justify-center"
          >
            {t("nav.orderNow")}
          </Link>
        </div>
      </div>

      {/* open search */}
      <div
        className={`w-full min-h-[180px] lg:min-h-[220px] z-50 absolute top-0 left-0
                   bg-white/98 backdrop-blur-md shadow-2xl border-b border-orange-200
                    ${openSearch ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}
                    transition-all duration-500 ease-in-out`}
      >
        <div className="w-full h-full px-6 md:px-14 lg:px-28 flex flex-col items-center relative pt-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchInput.trim()) {
                navigate(`/search?q=${encodeURIComponent(searchInput)}`);
                setSearchInput("");
                setOpenSearch(false);
              }
            }}
            className="relative w-full"
          >
            <IoSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl text-orange-500 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full h-[50px] md:h-[60px] border-2 border-orange-300 px-5 pl-14 md:px-10 md:pl-16 rounded-full 
                                      text-base md:text-lg text-gray-700 placeholder-gray-400 focus:border-orange-500
                                      shadow-lg transition-all outline-none"
              placeholder={t("nav.searchMobile")}
              autoFocus
            />
          </form>
          <IoCloseSharp
            onClick={() => setOpenSearch(false)}
            className="text-orange-600 absolute text-3xl md:text-4xl top-4 md:top-6 right-6 lg:right-14 cursor-pointer 
                                    hover:rotate-90 hover:scale-110 transition-all duration-300"
          />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
