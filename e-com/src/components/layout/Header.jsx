import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';

const Header = ({ onOpenCart, cartCount = 0 }) => {
    const { currentUser, logout, isAdmin } = useAuth();
    const { wishlistItems, setIsWishlistOpen } = useWishlist();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-[#19191f]/95 backdrop-blur-sm border-b border-[#f1f2f4] dark:border-[#2a2a35] font-display">
            <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="flex items-center justify-between h-20">
                    
                    {/* Logo */}
                    <Link to="/" onClick={closeMobileMenu} className="flex items-center gap-2">
                        <div className="w-8 h-8 text-primary dark:text-white flex items-center justify-center">
                            <span className="material-symbols-outlined !text-[32px]">shopping_bag</span>
                        </div>
                        <span className="text-2xl font-extrabold tracking-tight text-primary dark:text-white">ShopNest</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        <Link to="/" className={`text-sm font-semibold transition-colors ${location.pathname === '/' ? 'text-warm-coral' : 'text-primary/80 dark:text-white/80 hover:text-warm-coral dark:hover:text-warm-coral'}`}>Home</Link>
                        <Link to="/shop" className={`text-sm font-semibold transition-colors ${location.pathname === '/shop' ? 'text-warm-coral' : 'text-primary/80 dark:text-white/80 hover:text-warm-coral dark:hover:text-warm-coral'}`}>Shop</Link>
                        <Link to="/about" className={`text-sm font-semibold transition-colors ${location.pathname === '/about' ? 'text-warm-coral' : 'text-primary/80 dark:text-white/80 hover:text-warm-coral dark:hover:text-warm-coral'}`}>Stories</Link>
                        <Link to="/contact" className={`text-sm font-semibold transition-colors ${location.pathname === '/contact' ? 'text-warm-coral' : 'text-primary/80 dark:text-white/80 hover:text-warm-coral dark:hover:text-warm-coral'}`}>Contact</Link>
                        {isAdmin && (
                            <Link to="/admin" className={`text-sm font-semibold transition-colors ${location.pathname.startsWith('/admin') ? 'text-warm-coral' : 'text-primary/80 dark:text-white/80 hover:text-warm-coral dark:hover:text-warm-coral'}`}>Admin</Link>
                        )}
                    </nav>

                    {/* Icons & Actions */}
                    <div className="flex items-center gap-4">
                        <button className="hidden sm:block p-2 text-primary dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                            <span className="material-symbols-outlined">search</span>
                        </button>

                        <button className="relative p-2 text-primary dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors" onClick={() => setIsWishlistOpen(true)}>
                            <span className="material-symbols-outlined">favorite</span>
                            {wishlistItems.length > 0 && (
                                <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white transform translate-x-1/4 -translate-y-1/4 bg-warm-coral rounded-full border border-white dark:border-[#19191f]">
                                    {wishlistItems.length}
                                </span>
                            )}
                        </button>

                        <div className="relative user-menu-container">
                            {currentUser ? (
                                <button className="p-2 text-primary dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors" onClick={() => setShowUserMenu(!showUserMenu)}>
                                    <span className="material-symbols-outlined">person</span>
                                </button>
                            ) : (
                                <Link to="/login" className="text-sm font-semibold text-primary dark:text-white px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                    Sign In
                                </Link>
                            )}

                            {showUserMenu && currentUser && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50 dark:bg-[#25252e] dark:border-gray-800">
                                    <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100 dark:border-gray-800">
                                        Hi, {currentUser.name.split(' ')[0]}
                                    </div>
                                    <button onClick={() => { logout(); setShowUserMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px]">logout</span> Logout
                                    </button>
                                </div>
                            )}
                        </div>

                        <button className="relative p-2 text-primary dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors group" onClick={onOpenCart}>
                            <span className="material-symbols-outlined">shopping_cart</span>
                            {cartCount > 0 && (
                                <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white transform translate-x-1/4 -translate-y-1/4 bg-warm-coral rounded-full border-2 border-white dark:border-[#19191f]">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                        
                        <button className="md:hidden p-2 text-primary dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors" onClick={toggleMobileMenu}>
                            <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden py-4 border-t border-[#f1f2f4] dark:border-[#2a2a35] flex flex-col gap-4">
                        <Link to="/" className="text-base font-semibold text-primary dark:text-white px-4" onClick={closeMobileMenu}>Home</Link>
                        <Link to="/shop" className="text-base font-semibold text-primary dark:text-white px-4" onClick={closeMobileMenu}>Shop</Link>
                        <Link to="/about" className="text-base font-semibold text-primary dark:text-white px-4" onClick={closeMobileMenu}>Stories</Link>
                        <Link to="/contact" className="text-base font-semibold text-primary dark:text-white px-4" onClick={closeMobileMenu}>Contact</Link>
                        {isAdmin && (
                            <Link to="/admin" className="text-base font-semibold text-primary dark:text-white px-4" onClick={closeMobileMenu}>Admin</Link>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
