import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { menu } from "../data";
import { IoSearch, IoCloseSharp } from "react-icons/io5";
import { MdOutlineFavoriteBorder } from "react-icons/md";
import { FaBars } from "react-icons/fa";
import { HiOutlineShoppingCart } from "react-icons/hi";
import LanguageSwitcher from "./LanguageSwitcher";
import LocationSelector from "./LocationSelector";
import { endSession } from "../api/app";
import { fetchCart } from "../api/foodApi";
import brandLogo from "../assets/icon/logo_no_bg.png";

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
    if (
      location.pathname === "/favorites" ||
      location.pathname === "/cart" ||
      location.pathname === "/checkout" ||
      location.pathname === "/order-success" ||
      location.pathname === "/order-history"
    ) {
      return false;
    }
    return location.pathname === path;
  };

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
    window.addEventListener("authChanged", checkAuth);
    return () => window.removeEventListener("authChanged", checkAuth);
  }, []);

  useEffect(() => {
    const updateFavoritesCount = () => {
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
    window.addEventListener("storage", updateFavoritesCount);
    window.addEventListener("favoritesUpdated", updateFavoritesCount);
    return () => {
      window.removeEventListener("storage", updateFavoritesCount);
      window.removeEventListener("favoritesUpdated", updateFavoritesCount);
    };
  }, []);

  useEffect(() => {
    const updateCartCount = async () => {
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

  // The Profile page saves the uploaded photo under "profile_image".
  // Checked first so the navbar picks up whatever the user uploaded there.
  const avatarUrl =
    currentUser?.profile_image ||
    currentUser?.avatar ||
    currentUser?.profileImage ||
    currentUser?.photoUrl ||
    "";

  return (
    <div className="w-full shadow-sm sticky top-0 z-50 bg-white border-b border-slate-200">
      {/* TOP ROW */}
      <div className="w-full h-[84px] px-5 lg:px-14">
        <div className="w-full h-full flex items-center justify-between gap-3">
          {/* LEFT: LOGO + DELIVERY ADDRESS */}
          <div className="flex items-center gap-4 flex-1 lg:flex-none min-w-0">
            <Link
              to="/"
              className="flex items-center space-x-2 group flex-none"
            >
              <div className="w-20 h-20 rounded-md flex items-center justify-center overflow-hidden">
                <img
                  src={brandLogo}
                  alt="24-hour food logo"
                  className="w-full h-full object-contain "
                />
              </div>
              <span className="hidden sm:inline text-2xl font-bold text-[#0B1F3A]">
                24-Hour Food
              </span>
            </Link>

            <div className="hidden lg:block w-px h-8 bg-gray-200 flex-none" />

            <LocationSelector />
          </div>

          {/* CENTER: SEARCH ONLY */}
          <div className="hidden lg:flex flex-1 items-center justify-center px-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchInput.trim()) {
                  navigate(`/search?q=${encodeURIComponent(searchInput)}`);
                  setSearchInput("");
                }
              }}
              onReset={() => setSearchInput("")}
              className="relative flex h-11 w-full items-center rounded-md border border-slate-300 bg-white px-3 shadow-sm transition-colors focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-blue-100"
            >
              <button
                type="submit"
                aria-label={t("nav.search")}
                className="flex shrink-0 items-center justify-center text-slate-500 transition-colors hover:text-[#2563EB]"
              >
                <IoSearch className="text-lg" />
              </button>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="input h-full min-w-0 w-full border-0 bg-transparent px-1 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                placeholder="Search your favorite food ..."
              />
              <button
                type="reset"
                aria-label="Clear search"
                className={`shrink-0 text-slate-400 transition-colors hover:text-slate-700 ${searchInput ? "visible opacity-100" : "invisible opacity-0"}`}
              >
                <IoCloseSharp className="text-lg" />
              </button>
            </form>
          </div>

          {/* RIGHT: ICONS */}
          <div className="flex items-center gap-3 lg:gap-4 flex-none">
            <Link
              to="/favorites"
              className="relative group cursor-pointer lg:flex hidden"
            >
              <MdOutlineFavoriteBorder
                className={`text-2xl group-hover:scale-110 transition-all duration-300 ${
                  location.pathname === "/favorites"
                    ? "text-black-500 scale-110"
                    : "text-gray-700 hover:text-black-500"
                }`}
              />
              {favoritesCount > 0 && (
                <div
                  className="w-3 h-3 bg-gradient-to-r
                    from-red-500
                    to-red-500 flex items-center
                    absolute -top-2 -right-2 text-xs
                    font-bold justify-center text-white
                    rounded-full shadow-lg group-hover:scale-110 transition-transform duration-300"
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
                    ? "text-black-600 scale-110"
                    : "text-gray-700 hover:text-black-600"
                }`}
              />
              {cartCount > 0 && (
                <div
                  className="w-3 h-3 bg-gradient-to-r
                    from-red-500
                    to-red-500 flex items-center
                    absolute -top-2 -right-2 text-xs
                    font-bold justify-center text-white
                    rounded-full shadow-lg group-hover:scale-110 transition-transform duration-300"
                >
                  {cartCount}
                </div>
              )}
            </Link>

            <div className="lg:flex hidden">
              <LanguageSwitcher />
            </div>

            <FaBars
              onClick={() => setOpenSidebar(!openSidebar)}
              className="text-2xl lg:text-xl lg:hidden flex cursor-pointer text-gray-700 hover:text-orange-600"
            />

            {currentUser ? (
              <div className="relative group lg:flex hidden">
                <div className="flex items-center gap-2 cursor-pointer">
                  <div className="w-9 h-9 rounded-3xl border overflow-hidden flex items-center justify-center transition-colors">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={currentUser.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="text-white font-bold text-sm uppercase">
                        {currentUser.name.charAt(0)}
                      </span>
                    )}
                  </div>

                  <div className="absolute right-0 top-12 bg-white rounded-none shadow-xl py-1 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-slate-300">
                    {/* Dropdown Header */}
                    <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-3xl border border-blue-950 overflow-hidden flex items-center justify-center bg-blue-900 shrink-0">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={currentUser.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <span className="text-white font-bold text-sm uppercase">
                            {currentUser.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-xs uppercase tracking-wide truncate">
                          {currentUser.name}
                        </p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate mt-0.5">
                          {currentUser.email}
                        </p>
                      </div>
                    </div>

                    {/* Dropdown Links */}
                    <Link
                      to="/profile"
                      className="block px-4 py-2.5 text-slate-700 hover:bg-slate-100 hover:text-blue-900 transition-colors text-[11px] font-bold uppercase tracking-wider"
                    >
                      Profile
                    </Link>
                    <Link
                      to="/favorites"
                      className="block px-4 py-2.5 text-slate-700 hover:bg-slate-100 hover:text-blue-900 transition-colors text-[11px] font-bold uppercase tracking-wider"
                    >
                      {t("nav.myFavorites")}
                    </Link>
                    <Link
                      to="/cart"
                      className="block px-4 py-2.5 text-slate-700 hover:bg-slate-100 hover:text-blue-900 transition-colors text-[11px] font-bold uppercase tracking-wider"
                    >
                      {t("nav.myCart")}
                    </Link>
                    <Link
                      to="/order-history"
                      className="block px-4 py-2.5 text-slate-700 hover:bg-slate-100 hover:text-blue-900 transition-colors text-[11px] font-bold uppercase tracking-wider"
                    >
                      {t("nav.orderHistory")}
                    </Link>

                    {/* Logout Button */}
                    <button
                      onClick={async () => {
                        // Revokes the token in Laravel (so the admin portal's
                        // copy of it dies too) and clears every cached auth
                        // key - no role survives for the next sign-in.
                        await endSession();
                        localStorage.removeItem("cart");
                        localStorage.removeItem("favorites");
                        localStorage.removeItem("deliveryLocation");
                        localStorage.removeItem("deliveryAddress");
                        localStorage.removeItem("deliveryCoords");
                        setCurrentUser(null);
                        setCartCount(0);
                        setFavoritesCount(0);
                        window.dispatchEvent(new Event("authChanged"));
                        window.dispatchEvent(new Event("cartUpdated"));
                        window.dispatchEvent(new Event("favoritesUpdated"));
                        navigate("/");
                      }}
                      className="w-full text-left px-4 py-2.5 text-rose-700 hover:bg-rose-50 hover:text-rose-800 transition-colors text-[11px] font-bold uppercase tracking-wider border-t border-slate-200"
                    >
                      {t("nav.logout")}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                aria-label="User Login Button"
                className="group relative hidden h-[35px] w-[90px] items-center justify-center rounded-[15px] bg-[linear-gradient(to_bottom_right,#2e8eff_0%,rgba(46,142,255,0)_30%)] bg-[rgb(2,17,34)] transition duration-300 ease-in-out hover:bg-blue hover:shadow-[0_0_10px_rgba(46,142,255,0.5)] focus:outline-none focus:ring-2 focus:ring-blue-900 lg:flex"
              >
                <span className="flex h-[35px] w-[110px] items-center justify-center gap-[8px] rounded-[15px] bg-[#1a1a1a] text-white">
                  <svg
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="h-[20px] w-[20px] fill-white"
                  >
                    <g data-name="Layer 2" id="Layer_2">
                      <path d="m15.626 11.769a6 6 0 1 0 -7.252 0 9.008 9.008 0 0 0 -5.374 8.231 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 9.008 9.008 0 0 0 -5.374-8.231zm-7.626-4.769a4 4 0 1 1 4 4 4 4 0 0 1 -4-4zm10 14h-12a1 1 0 0 1 -1-1 7 7 0 0 1 14 0 1 1 0 0 1 -1 1z" />
                    </g>
                  </svg>
                  <span className="font-semibold">Log In</span>
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* SECOND ROW: NAV LINKS UNDER THE LOGO */}
      <nav
        aria-label="Primary navigation"
        className="hidden lg:flex items-center justify-center gap-10 px-3 lg:px-14 h-10 border-t border-slate-300 bg-white"
      >
        <Link
          to="/menu"
          className={`text-sm font-semibold transition-colors ${isActive("/menu") ? "text-[#0B1F3A]" : "text-slate-600 hover:text-[#2563EB]"}`}
        >
          Delivery
        </Link>
        <Link
          to="/pickup"
          className={`text-sm font-semibold transition-colors ${isActive("/pickup") ? "text-[#0B1F3A]" : "text-slate-600 hover:text-[#2563EB]"}`}
        >
          Pick-up
        </Link>
        <Link
          to="/shops"
          className={`text-sm font-semibold transition-colors ${isActive("/shops") ? "text-[#0B1F3A]" : "text-slate-600 hover:text-[#2563EB]"}`}
        >
          Shop
        </Link>
      </nav>

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
        <div className="w-full h-[88px] px-5 flex items-center justify-between border-b border-white/20">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-20 h-20 rounded-md flex items-center justify-center overflow-hidden">
              <img
                src={brandLogo}
                alt="BiteRush logo"
                className="w-full h-full object-contain"
              />
            </div>
          </Link>
          <IoCloseSharp
            className="text-white text-3xl md:text-4xl cursor-pointer hover:rotate-90 transition-transform duration-300"
            onClick={() => setOpenSidebar(false)}
          />
        </div>

        <div className="px-6 pt-4">
          <div className="w-full bg-white/15 rounded-lg px-3 py-2.5 text-left text-white">
            <LocationSelector />
          </div>
        </div>

        <ul className="mt-3 px-3">
          <li
            className={`rounded-lg px-3 py-3.5 transition-colors ${isActive("/menu") ? "bg-white/20" : "hover:bg-white/15"}`}
          >
            <Link
              to="/menu"
              className="flex text-base font-semibold text-white"
              onClick={() => setOpenSidebar(false)}
            >
              Delivery
            </Link>
          </li>
          <li
            className={`rounded-lg px-3 py-3.5 transition-colors ${isActive("/pickup") ? "bg-white/20" : "hover:bg-white/15"}`}
          >
            <Link
              to="/pickup"
              className="flex text-base font-semibold text-white"
              onClick={() => setOpenSidebar(false)}
            >
              Pick-up
            </Link>
          </li>
          <li
            className={`rounded-lg px-3 py-3.5 transition-colors ${isActive("/shops") ? "bg-white/20" : "hover:bg-white/15"}`}
          >
            <Link
              to="/shops"
              className="flex text-base font-semibold text-white"
              onClick={() => setOpenSidebar(false)}
            >
              Shop
            </Link>
          </li>
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
            onReset={() => setSearchInput("")}
            className="relative flex h-12 w-full items-center rounded-md border border-slate-300 bg-white px-4 shadow-sm focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-blue-100 md:h-14"
          >
            <button
              type="submit"
              aria-label={t("nav.searchMobile")}
              className="flex shrink-0 items-center justify-center text-slate-500 transition-colors hover:text-[#2563EB]"
            >
              <IoSearch className="text-xl" />
            </button>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-full min-w-0 w-full border-0 bg-transparent px-3 text-base text-slate-700 outline-none placeholder:text-slate-400 md:text-lg"
              placeholder={t("nav.searchMobile")}
              autoFocus
            />
            <button
              type="reset"
              aria-label="Clear search"
              className={`shrink-0 text-slate-400 transition-colors hover:text-slate-700 ${searchInput ? "visible opacity-100" : "invisible opacity-0"}`}
            >
              <IoCloseSharp className="text-xl" />
            </button>
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