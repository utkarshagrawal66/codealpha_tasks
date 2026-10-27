import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatINR } from '../utils/format';
import { handleImgError } from '../utils/placeholder';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { addToCart } = useCart();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

    useEffect(() => {
        fetch('/api/products')
            .then(res => {
                if (!res.ok) throw new Error('Failed to load products');
                return res.json();
            })
            .then(data => setProducts(data.slice(0, 3))) // Only show top 3 trending
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);
    return (
        <div className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 font-display">
            {/* Hero Section */}
            <section className="mt-8 mb-16 md:mt-12 md:mb-24">
                <div className="relative w-full h-[440px] md:h-[560px] rounded-2xl overflow-hidden shadow-soft group">
                    <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBFhpBobjv7VTWk3U6Ch2t78YswgS9Qz9Qx_tC3yUBM9hqxBQIRoEMdjTdLW9HDxNAOLaWUL4RU7hpfMhmZEuSiWWQmdETBZECtQRl3GTdAkGtXqWQ-AegZPzNTjB6FhNl57Yj0z2JaRIeQEJC-uQ_F-VYTBu9_pRCQHt0vLtMyMyeVg1oJgPz73RlPshVkIEFqL6dADqBga9i24YcdK0yKH3d5JmMuVJCDojbxL38XL66NnsaVYTpJ5AhXFlYdjCkp7ULLrCoW18w")'}}></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/40 to-transparent"></div>
                    <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-16 max-w-3xl text-white">
                        <span className="inline-block py-1 px-3 mb-4 text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md rounded-full w-fit border border-white/30">New Collection 2026</span>
                        <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight mb-6">
                            Smart Shopping<br/>Starts Here
                        </h1>
                        <p className="text-lg md:text-xl font-medium text-white/90 mb-8 max-w-lg leading-relaxed">
                            Discover a curated collection designed for modern living. Elevate your space with our premium selection.
                        </p>
                        <Link to="/shop" className="flex items-center justify-center gap-2 bg-warm-coral hover:bg-[#E07A66] text-white px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-warm-coral/40 transform hover:-translate-y-1 w-fit">
                            <span>Shop Now</span>
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* About / Mission Section */}
            <section className="mb-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-2 text-soft-teal font-bold uppercase tracking-widest text-sm">
                        <span className="w-8 h-[2px] bg-soft-teal"></span>
                        Our Mission
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-primary dark:text-white leading-tight">
                        Curated for You, <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-warm-coral to-soft-teal">Designed for Life.</span>
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                        ShopNest brings you the finest selection of goods with a focus on quality and sustainability. We believe in products that tell a story and last a lifetime.
                    </p>
                    <div className="grid grid-cols-2 gap-6 mt-4">
                        <div className="flex flex-col gap-2 p-4 bg-white dark:bg-[#25252e] rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-soft-teal/20 flex items-center justify-center text-soft-teal mb-1">
                                <span className="material-symbols-outlined">verified</span>
                            </div>
                            <h3 className="font-bold text-primary dark:text-white">Quality First</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Durable materials &amp; craftsmanship.</p>
                        </div>
                        <div className="flex flex-col gap-2 p-4 bg-white dark:bg-[#25252e] rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-soft-teal/20 flex items-center justify-center text-soft-teal mb-1">
                                <span className="material-symbols-outlined">eco</span>
                            </div>
                            <h3 className="font-bold text-primary dark:text-white">Sustainable</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Ethically sourced products.</p>
                        </div>
                    </div>
                </div>
                <div className="relative h-[500px] w-full bg-soft-teal/10 rounded-2xl overflow-hidden md:order-last order-first">
                    <div className="absolute inset-4 rounded-xl overflow-hidden shadow-lg">
                        <div className="w-full h-full bg-cover bg-center" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAxuaVJS5pYW9ypIL065-g3kcUeSsRy7hny0VM01hZb9AKHmBo7LbSKhRQ8uf8vdCI1KbTSnOcOhAVsRI38ppkpYrmxhwTY6xZkTcuwK0F2LLN4IG6QcW3K5hlGMWn2rtKLAG3_4Uz7qshDY7U_S505i-3-XqrZ9T6O8PWlm9qnbrPdH4qL9Xi6u4NUL4XSCPbD7lOLLDLG1NAMb39OaT8IS9UQBuN0F5RxeAWOmBoDfaE7Hms_5GpGMUEfBBMCHW1Rf4VagxYgBjI")'}}></div>
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-warm-coral rounded-full blur-3xl opacity-20"></div>
                </div>
            </section>

            {/* Trending Products Header */}
            <div className="flex items-end justify-between mb-10">
                <div>
                    <h2 className="text-3xl font-bold text-primary dark:text-white mb-2">Trending Now</h2>
                    <p className="text-gray-500 dark:text-gray-400">Top picks for your daily lifestyle.</p>
                </div>
                <Link to="/shop" className="hidden md:flex items-center gap-1 text-warm-coral font-bold hover:gap-2 transition-all">
                    View All Products <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
            </div>

            {/* Product Grid */}
            {error ? (
                <div className="py-16 text-center">
                    <p className="text-lg text-gray-500 mb-4">Sorry, we couldn't load the products.</p>
                    <Link to="/shop" className="text-warm-coral font-bold hover:underline">Browse the shop instead</Link>
                </div>
            ) : loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[0, 1, 2].map(i => (
                        <div key={i} className="animate-pulse rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800 aspect-[4/5]"></div>
                    ))}
                </div>
            ) : products.length === 0 ? (
                <div className="py-16 text-center">
                    <p className="text-lg text-gray-500">No products yet — check back soon.</p>
                </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map((item, idx) => {
                    const isWishlisted = isInWishlist(item.id);
                    return (
                    <div key={idx} className="group relative flex flex-col bg-white dark:bg-[#25252e] rounded-2xl shadow-sm hover:shadow-float transition-all duration-300 border border-gray-100 dark:border-gray-800 overflow-hidden">
                        <div className="relative aspect-[4/3] overflow-hidden bg-white dark:bg-gray-800">
                            <img src={item.image} alt={item.name} onError={handleImgError} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" />
                            <div className="absolute top-3 right-3">
                                <button 
                                    onClick={() => isWishlisted ? removeFromWishlist(item.id) : addToWishlist(item)}
                                    className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-900 rounded-full shadow-md text-gray-400 hover:text-warm-coral transition-colors">
                                    <span className="material-symbols-outlined text-[18px]" style={isWishlisted ? {fontVariationSettings: "'FILL' 1", color: '#ff4444'} : {}}>favorite</span>
                                </button>
                            </div>
                            {item.tag && (
                                <div className={`absolute top-3 left-3 ${item.color} text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide`}>
                                    {item.tag}
                                </div>
                            )}
                        </div>
                        <div className="p-5 flex flex-col flex-grow">
                            <div className="flex items-center gap-1 text-yellow-400 mb-2">
                                {[1,2,3,4,5].map(i => <span key={i} className="material-symbols-outlined text-[16px] fill-current">star</span>)}
                            </div>
                            <Link to={`/product/${item.id}`} className="text-lg font-bold text-primary dark:text-white mb-1 group-hover:text-warm-coral transition-colors line-clamp-1">{item.name}</Link>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{item.description}</p>
                            <div className="mt-auto flex items-center justify-between">
                                <span className="text-xl font-bold text-primary dark:text-white">{formatINR(item.price)}</span>
                                <button 
                                    onClick={(e) => { e.preventDefault(); addToCart(item); }}
                                    className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-2 bg-primary dark:bg-white text-white dark:text-primary px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:bg-warm-coral dark:hover:bg-warm-coral dark:hover:text-white">
                                    <span className="truncate">Add to Cart</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )})}
            </div>
            )}

            <div className="mt-12 text-center md:hidden">
                <Link to="/shop" className="inline-flex items-center justify-center gap-2 w-full bg-white dark:bg-[#25252e] border border-gray-200 dark:border-gray-700 text-primary dark:text-white font-bold py-3 rounded-lg">
                    <span>View All Products</span>
                    <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
            </div>
        </div>
    );
};

export default Home;
