import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../utils/format';
import { handleImgError } from '../../utils/placeholder';

const AdminDashboard = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products');
            const data = await res.json();
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/products/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                setProducts(products.filter(p => p.id !== id));
            } else {
                alert('Failed to delete product');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center">
            <div className="text-xl font-bold text-gray-500">Loading inventory...</div>
        </div>
    );

    return (
        <div className="bg-[#f9f9f9] text-[#1a1c1c] font-body min-h-screen flex w-full relative z-50">
            {/* Mobile top bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 bg-zinc-900 text-white flex items-center justify-between px-4 py-3 z-50">
                <div className="flex items-center gap-3">
                    <span className="text-lg font-bold tracking-tighter">ShopNest</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium">
                    <Link to="/admin" className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700">Inventory</Link>
                    <Link to="/admin/add" className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500">Add</Link>
                    <Link to="/" className="px-3 py-1.5 rounded-lg hover:bg-zinc-800">Store</Link>
                </div>
            </div>

            {/* SideNavBar */}
            <aside className="hidden lg:flex h-full w-64 fixed left-0 top-0 bg-zinc-900 flex-col py-6 z-50 shadow-2xl shadow-violet-900/20">
                <div className="text-xl font-bold text-white mb-8 px-6 tracking-tighter">ShopNest</div>
                <div className="px-4 mb-4">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-zinc-500 font-bold px-2 mb-4">Main Menu</p>
                    <nav className="space-y-1">
                        {/* Dashboard */}
                        <a className="flex items-center text-zinc-400 hover:text-white mx-2 my-1 px-4 py-3 hover:bg-zinc-800 transition-all duration-200 rounded-xl group" href="#">
                            <span className="material-symbols-outlined mr-3">dashboard</span>
                            <span className="font-['Inter'] text-sm tracking-wide">Dashboard</span>
                        </a>
                        {/* Inventory */}
                        <Link to="/admin" className="bg-violet-600/20 text-violet-300 rounded-xl mx-2 my-1 px-4 py-3 border-l-4 border-violet-500 flex items-center group">
                            <span className="material-symbols-outlined mr-3" style={{fontVariationSettings: "'FILL' 1"}}>inventory_2</span>
                            <span className="font-['Inter'] text-sm tracking-wide font-bold">Inventory</span>
                        </Link>
                        {/* Go back */}
                        <Link to="/" className="flex items-center text-zinc-400 hover:text-white mx-2 my-1 px-4 py-3 hover:bg-zinc-800 transition-all duration-200 rounded-xl group">
                            <span className="material-symbols-outlined mr-3">store</span>
                            <span className="font-['Inter'] text-sm tracking-wide">Return to Store</span>
                        </Link>
                    </nav>
                </div>
                <div className="mt-auto px-4">
                    <div className="flex items-center p-4 bg-zinc-800/50 rounded-2xl mb-4">
                        <div className="w-10 h-10 rounded-full bg-violet-500/30 flex items-center justify-center mr-3 text-white font-bold">
                            {currentUser?.email?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-white text-sm font-bold truncate">Admin Portal</p>
                            <p className="text-zinc-500 text-[10px] truncate">{currentUser?.email || 'Admin user'}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-grow min-h-screen bg-[#f9f9f9] transition-all w-full p-0 m-0 lg:ml-64 pt-16 lg:pt-0">
                <header className="flex justify-between items-center px-4 md:px-10 py-8">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-[#1a1c1c] font-headline">Inventory Management</h1>
                        <p className="text-gray-500 font-medium mt-1">Manage your boutique's curated selection and stock levels.</p>
                    </div>
                    <Link to="/admin/add" className="flex items-center gap-2 bg-gradient-to-br from-[#4800b2] to-[#6200ee] text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-[#4800b2]/20 hover:scale-[1.02] active:scale-95 transition-all">
                        <span className="material-symbols-outlined">add</span>
                        <span>Add Product</span>
                    </Link>
                </header>

                <section className="px-4 md:px-10 mb-8">
                    <div className="bg-[#f3f3f4] rounded-2xl p-4 flex gap-4">
                        <div className="flex-1 relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                            <input className="w-full pl-12 pr-4 py-3 bg-white border-none rounded-xl focus:ring-2 focus:ring-[#4800b2] text-sm font-medium placeholder:text-gray-400" placeholder="Search inventory by name, SKU or category..." type="text" />
                        </div>
                    </div>
                </section>

                <section className="px-4 md:px-10 pb-12">
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                        {products.length === 0 ? (
                            <div className="p-10 text-center flex flex-col items-center">
                                <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">inventory_2</span>
                                <h3 className="text-xl font-bold text-gray-700 mb-2">No products found</h3>
                                <p className="text-gray-500 mb-6">Your inventory is currently empty. Start by adding some products.</p>
                                <Link to="/admin/add" className="text-[#4800b2] font-bold hover:underline">Add your first product &rarr;</Link>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left min-w-[640px]">
                                <thead>
                                    <tr className="bg-[#f3f3f4]">
                                        <th className="px-6 py-5 text-[11px] font-extrabold uppercase tracking-widest text-gray-500">Product Name</th>
                                        <th className="px-6 py-5 text-[11px] font-extrabold uppercase tracking-widest text-gray-500">Price</th>
                                        <th className="px-6 py-5 text-[11px] font-extrabold uppercase tracking-widest text-gray-500 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#f3f3f4]">
                                    {products.map(product => (
                                        <tr key={product.id} className="hover:bg-[#f9f9f9] transition-colors group">
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                                        <img src={product.image} alt={product.name} onError={handleImgError} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-[#1a1c1c] font-headline">{product.name}</div>
                                                        <div className="text-xs text-gray-400 font-medium truncate max-w-xs">{product.description}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 font-bold text-[#1a1c1c]">{formatINR(product.price)}</td>
                                            <td className="px-6 py-6 text-right">
                                                <div className="flex justify-end gap-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link to={`/admin/edit/${product.id}`} className="hover:text-[#4800b2] transition-colors"><span className="material-symbols-outlined">edit</span></Link>
                                                    <button onClick={() => handleDelete(product.id)} className="hover:text-red-600 transition-colors"><span className="material-symbols-outlined">delete</span></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default AdminDashboard;
