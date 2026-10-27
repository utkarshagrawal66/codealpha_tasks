import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProductForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        image: '',
        images: []
    });
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditMode);
    const [newUrl, setNewUrl] = useState('');
    const { currentUser } = useAuth();

    useEffect(() => {
        if (isEditMode) {
            fetch('/api/products')
                .then(res => res.json())
                .then(products => {
                    const product = products.find(p => p.id === parseInt(id));
                    if (product) {
                        let parsedImages = [];
                        try {
                            parsedImages = product.images ? JSON.parse(product.images) : [];
                        } catch {
                            parsedImages = [];
                        }
                        if (!Array.isArray(parsedImages) || parsedImages.length === 0) {
                            parsedImages = product.image ? [product.image] : [];
                        }
                        setFormData({
                            name: product.name,
                            description: product.description,
                            price: product.price,
                            image: product.image || '',
                            images: parsedImages
                        });
                    }
                    setInitialLoading(false);
                })
                .catch(err => {
                    console.error("Failed to load product", err);
                    setInitialLoading(false);
                });
        }
    }, [id, isEditMode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const token = localStorage.getItem('token');
        setLoading(true);

        const uploadedUrls = [];
        try {
            for (const file of files) {
                const uploadData = new FormData();
                uploadData.append('image', file);

                const res = await fetch('/api/upload', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: uploadData
                });

                if (res.ok) {
                    const data = await res.json();
                    uploadedUrls.push(data.url);
                } else {
                    const data = await res.json();
                    alert(data.error || `Upload failed for ${file.name}`);
                }
            }

            if (uploadedUrls.length > 0) {
                setFormData(prev => {
                    const updatedImages = [...prev.images];
                    uploadedUrls.forEach(url => {
                        if (!updatedImages.includes(url)) {
                            updatedImages.push(url);
                        }
                    });
                    return {
                        ...prev,
                        images: updatedImages,
                        image: prev.image || updatedImages[0] || ''
                    };
                });
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Upload failed');
        } finally {
            setLoading(false);
        }
    };

    const handleAddUrl = (e) => {
        e.preventDefault();
        if (!newUrl.trim()) return;
        if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
            alert('Please enter a valid URL starting with http:// or https://');
            return;
        }

        setFormData(prev => {
            const updatedImages = [...prev.images];
            if (!updatedImages.includes(newUrl)) {
                updatedImages.push(newUrl);
            }
            return {
                ...prev,
                images: updatedImages,
                image: prev.image || newUrl
            };
        });
        setNewUrl('');
    };

    const handleRemoveImage = (indexToRemove) => {
        setFormData(prev => {
            const updatedImages = prev.images.filter((_, idx) => idx !== indexToRemove);
            let nextPrimary = prev.image;
            // If the deleted image was primary, pick the first remaining or empty
            if (prev.image === prev.images[indexToRemove]) {
                nextPrimary = updatedImages[0] || '';
            }
            return {
                ...prev,
                images: updatedImages,
                image: nextPrimary
            };
        });
    };

    const handleSetPrimary = (url) => {
        setFormData(prev => ({
            ...prev,
            image: url
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem('token');

        try {
            const url = isEditMode ? `/api/products/${id}` : '/api/products';
            const method = isEditMode ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                navigate('/admin');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to save product');
            }
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Error saving product');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) return (
        <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center">
            <div className="text-xl font-bold text-gray-500">Loading product details...</div>
        </div>
    );

    return (
        <div className="bg-[#f9f9f9] text-[#1a1c1c] font-body min-h-screen flex w-full relative z-50">
            {/* Mobile top bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 bg-zinc-900 text-white flex items-center justify-between px-4 py-3 z-50">
                <span className="text-lg font-bold tracking-tighter">ShopNest</span>
                <div className="flex items-center gap-3 text-sm font-medium">
                    <Link to="/admin" className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700">Inventory</Link>
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
                        <Link to="/admin" className="text-zinc-400 hover:text-white mx-2 my-1 px-4 py-3 hover:bg-zinc-800 transition-all duration-200 rounded-xl flex items-center group">
                            <span className="material-symbols-outlined mr-3">inventory_2</span>
                            <span className="font-['Inter'] text-sm tracking-wide font-bold">Inventory</span>
                        </Link>
                        <Link to="/admin" className="bg-violet-600/20 text-violet-300 rounded-xl mx-2 my-1 px-4 py-3 border-l-4 border-violet-500 flex items-center group">
                            <span className="material-symbols-outlined mr-3" style={{fontVariationSettings: "'FILL' 1"}}>payments</span>
                            <span className="font-['Inter'] text-sm tracking-wide font-bold">{isEditMode ? 'Edit Product' : 'Add Product'}</span>
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

            {/* Main Content Area */}
            <main className="flex-grow min-h-screen bg-[#f9f9f9] transition-all w-full p-0 m-0 lg:ml-64 pt-16 lg:pt-0">
                <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl px-4 md:px-10 py-8 flex items-center gap-4 border-b border-gray-100">
                    <button onClick={() => navigate('/admin')} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <span className="material-symbols-outlined text-gray-500">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-3xl font-headline font-extrabold tracking-tight text-[#1a1c1c]">
                            {isEditMode ? 'Edit Product Configuration' : 'New Product Configuration'}
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">Configure pricing, details, and dynamic settings below</p>
                    </div>
                </header>

                <div className="p-4 md:p-10 max-w-4xl">
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden p-8 border border-gray-100">
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-2">Product Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g. Premium Leather Bag"
                                        className="w-full bg-[#f3f3f4] border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#4800b2] transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-2">Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        required
                                        rows={4}
                                        placeholder="Describe the product..."
                                        className="w-full bg-[#f3f3f4] border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#4800b2] transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-2">Price (₹)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                        <input
                                            type="number"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleChange}
                                            required
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                            className="w-full bg-[#f3f3f4] border-none rounded-lg pl-8 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#4800b2] transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-2">Product Images (Add Multiple)</label>
                                    
                                    {/* Upload and URL input */}
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <div className="flex-1 flex gap-2">
                                            <input
                                                type="url"
                                                value={newUrl}
                                                onChange={(e) => setNewUrl(e.target.value)}
                                                placeholder="Enter image URL..."
                                                className="flex-1 bg-[#f3f3f4] border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#4800b2] transition-all"
                                            />
                                            <button 
                                                type="button"
                                                onClick={handleAddUrl}
                                                className="bg-zinc-800 text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-zinc-700 transition-colors"
                                            >
                                                Add URL
                                            </button>
                                        </div>
                                        <div className="relative overflow-hidden w-auto flex-shrink-0 cursor-pointer text-[#4800b2] font-semibold flex items-center justify-center px-4 py-3 bg-[#e8ddff] rounded-lg cursor-pointer">
                                            <span>Upload Image File(s)</span>
                                            <input 
                                                type="file" 
                                                multiple
                                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                    
                                    {loading && (
                                        <div className="flex items-center gap-2 mb-4 text-sm text-gray-500 font-semibold">
                                            <span className="animate-spin material-symbols-outlined text-[16px]">sync</span> Uploading...
                                        </div>
                                    )}

                                    {/* Primary/Thumbnail Selection Instructions */}
                                    {formData.images.length > 0 && (
                                        <p className="text-xs text-gray-400 mb-3">
                                            * Click on any image's star to set it as the primary thumbnail.
                                        </p>
                                    )}

                                    {/* Images Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                        {formData.images.map((url, index) => {
                                            const isPrimary = formData.image === url;
                                            return (
                                                <div 
                                                    key={index} 
                                                    className={`relative aspect-square rounded-xl overflow-hidden border-2 bg-gray-50 flex flex-col justify-between group transition-all ${
                                                        isPrimary ? 'border-[#4800b2] ring-2 ring-[#4800b2]/20' : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <img src={url} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                                                    
                                                    {/* Controls overlay */}
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                        <button 
                                                            type="button"
                                                            title="Set as primary thumbnail"
                                                            onClick={() => handleSetPrimary(url)}
                                                            className={`p-2 rounded-full transition-colors ${
                                                                isPrimary ? 'bg-[#fbbf24] text-white' : 'bg-white hover:bg-amber-50 text-amber-500'
                                                            }`}
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: isPrimary ? "'FILL' 1" : "'FILL' 0"}}>star</span>
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            title="Remove image"
                                                            onClick={() => handleRemoveImage(index)}
                                                            className="p-2 bg-white hover:bg-red-50 text-red-500 rounded-full transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                                        </button>
                                                    </div>

                                                    {/* Badges */}
                                                    {isPrimary && (
                                                        <div className="absolute top-2 left-2 bg-[#4800b2] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                                            Primary
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 pt-6 border-t border-gray-100 flex justify-end">
                                <button type="submit" disabled={loading} className="bg-gradient-to-br from-[#4800b2] to-[#6200ee] text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:shadow-[#4800b2]/30 active:scale-95 transition-all flex items-center gap-2">
                                    <span className="material-symbols-outlined">save</span>
                                    {loading ? 'Saving...' : (isEditMode ? 'Update Product' : 'Create Product')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProductForm;
