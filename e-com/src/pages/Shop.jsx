import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatINR } from '../utils/format';
import { handleImgError } from '../utils/placeholder';
import groupImage from '../assets/group.webp';

const Shop = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [query, setQuery] = useState('');
    const { addToCart } = useCart();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

    useEffect(() => {
        fetch('/api/products')
            .then(res => {
                if (!res.ok) throw new Error('Failed to load products');
                return res.json();
            })
            .then(data => setProducts(data))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const scrollToProducts = () => {
        document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
    };

    const trimmedQuery = query.trim().toLowerCase();
    const filteredProducts = !trimmedQuery
        ? products
        : products.filter(p =>
            (p.name || '').toLowerCase().includes(trimmedQuery) ||
            (p.description || '').toLowerCase().includes(trimmedQuery)
        );

    return (
        <div className="pt-24 pb-20 font-body">
            {/* Hero Banner Section */}
            <section className="max-w-screen-2xl mx-auto px-6 mb-16">
                <div className="relative overflow-hidden rounded-3xl bg-surface-container-low min-h-[400px] flex items-center">
                    {/* Background decorative element */}
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-br from-[#4800b2] to-[#6200ee] opacity-10 blur-3xl rounded-full translate-x-1/4 -translate-y-1/4"></div>
                    <div className="relative z-10 w-full grid md:grid-cols-2 gap-12 items-center p-8 md:p-20">
                        <div className="space-y-6">
                            <span className="inline-block px-4 py-1.5 rounded-full bg-[#e8ddff] text-[#22005d] text-xs font-bold tracking-widest uppercase font-label">The Digital Curator</span>
                            <h1 className="text-5xl md:text-8xl font-black text-[#4800b2] leading-[0.9] font-headline tracking-tighter">
                                Shop <br/>Smarter <br/>Together
                            </h1>
                            <p className="text-lg text-gray-600 max-w-md font-body leading-relaxed">
                                Experience a boutique marketplace where curation meets community. Explore high-end essentials shared with those who matter most.
                            </p>
                            <div className="pt-4">
                                <button onClick={scrollToProducts} className="bg-gradient-to-br from-[#4800b2] to-[#6200ee] text-white px-10 py-5 rounded-xl font-bold text-lg hover:scale-105 active:scale-95 transition-transform">
                                    Explore Collection
                                </button>
                            </div>
                        </div>
                        <div className="block w-full">
                            <img alt="Luxury minimalist product staging" className="w-full h-[280px] md:h-[500px] object-cover rounded-2xl shadow-2xl shadow-primary/10 -rotate-3 hover:rotate-0 transition-transform duration-700" src={groupImage}/>
                        </div>
                    </div>
                </div>
            </section>

            {/* Product Listing Grid */}
            <section className="max-w-screen-2xl mx-auto px-6" id="products">
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-12">
                    <div className="space-y-2">
                        <h2 className="text-4xl font-bold font-headline text-gray-900 tracking-tight">Featured Exhibits</h2>
                        <p className="text-gray-500">{loading ? 'Loading products...' : `${filteredProducts.length} hand-picked selection${filteredProducts.length === 1 ? '' : 's'} for modern living.`}</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="relative w-full sm:w-64">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search products..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white text-gray-900 font-medium rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#4800b2] outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {error ? (
                    <div className="py-20 text-center">
                        <p className="text-lg text-gray-500 mb-4">Sorry, we couldn't load the products.</p>
                        <button onClick={() => { setLoading(true); setError(null); fetch('/api/products').then(r => r.json()).then(d => setProducts(d)).catch(e => setError(e.message)).finally(() => setLoading(false)); }} className="bg-[#4800b2] text-white px-6 py-3 rounded-lg font-bold">Try Again</button>
                    </div>
                ) : loading ? (
                    <div className="py-20 text-center">
                        <div className="animate-pulse space-y-4 max-w-md mx-auto">
                            <div className="h-64 bg-gray-200 rounded-xl"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                        </div>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="py-20 text-center">
                        <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">search_off</span>
                        <p className="text-lg text-gray-500 mb-2">No products match "{query}".</p>
                        <button onClick={() => setQuery('')} className="text-[#4800b2] font-bold hover:underline">Clear search</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
                        {filteredProducts.map((item, idx) => {
                            const isWishlisted = isInWishlist(item.id);
                            return (
                            <div key={idx} className="group flex flex-col">
                                <div className="relative mb-6 overflow-hidden rounded-lg bg-white border border-gray-100 aspect-[4/5]">
                                    <img alt={item.name} onError={handleImgError} className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105" src={item.image} />
                                    {item.badge && (
                                        <div className="absolute top-4 left-4">
                                            <span className={`${item.badgeClass} px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider font-label`}>{item.badge}</span>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => isWishlisted ? removeFromWishlist(item.id) : addToWishlist(item)}
                                        className="absolute bottom-4 right-4 bg-white/90 backdrop-blur p-3 rounded-full shadow-lg opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                        <span className="material-symbols-outlined text-[#4800b2]" style={isWishlisted ? {fontVariationSettings: "'FILL' 1", color: '#ff4444'} : {}}>
                                            favorite
                                        </span>
                                    </button>
                                </div>
                                <div className="flex flex-col flex-grow">
                                    <div className="flex justify-between items-start mb-2">
                                        <Link to={`/product/${item.id}`} className="text-xl font-bold font-headline text-gray-900 group-hover:text-[#4800b2] transition-colors line-clamp-1">{item.name}</Link>
                                        <div className="text-right">
                                            <span className="block text-xl font-bold text-[#4800b2]">{formatINR(item.price)}</span>
                                        </div>
                                    </div>
                                    <p className="text-gray-600 text-sm mb-6 leading-relaxed line-clamp-2">{item.description}</p>
                                    <button
                                        onClick={(e) => { e.preventDefault(); addToCart(item); }}
                                        className="mt-auto w-full bg-gradient-to-br from-[#4800b2] to-[#6200ee] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-all">
                                        <span className="material-symbols-outlined">shopping_bag</span>
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        )})}
                    </div>
                )}
            </section>

            {/* Newsletter Section */}
            <section className="max-w-screen-2xl mx-auto px-6 mt-32">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 bg-[#e8ddff] text-[#22005d] p-8 md:p-12 rounded-3xl flex flex-col justify-between">
                        <div>
                            <h2 className="text-4xl font-black font-headline tracking-tighter mb-4">Join the Nest Circle</h2>
                            <p className="text-lg opacity-80 max-w-md">Early access to limited drops, split-bill rewards, and member-only curation.</p>
                        </div>
                        <div className="mt-12 flex flex-col sm:flex-row gap-4">
                            <input className="flex-1 bg-white/50 border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-[#4800b2] text-gray-900 placeholder:text-gray-500" placeholder="Your premium email" type="email" />
                            <button className="bg-[#4800b2] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#4800b2]/90 transition-all">Subscribe</button>
                        </div>
                    </div>
                    <div className="bg-[#fdaa90] text-[#783c28] p-8 md:p-12 rounded-3xl relative overflow-hidden group">
                        <span className="material-symbols-outlined text-6xl opacity-20 absolute -right-4 -top-4 rotate-12 transition-transform group-hover:scale-125">groups</span>
                        <h3 className="text-2xl font-bold font-headline mb-4">Shop With Friends</h3>
                        <p className="mb-8 opacity-90">Start a group order and unlock exclusive bulk discounts and shared delivery.</p>
                        <a href="#products" onClick={scrollToProducts} className="inline-flex items-center gap-2 font-bold hover:gap-4 transition-all">
                            Learn More <span className="material-symbols-outlined">arrow_forward</span>
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Shop;
