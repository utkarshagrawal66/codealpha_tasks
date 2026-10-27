import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatINR, formatOrderCount } from '../utils/format';
import { handleImgError } from '../utils/placeholder';

const ProductDetails = () => {
    const { id } = useParams();
    // Remount on id change so switching products never shows stale data.
    return <ProductDetailView key={id} id={id} />;
};

const ProductDetailView = ({ id }) => {
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [error, setError] = useState(null);
    const [activeImage, setActiveImage] = useState(null);
    const [groupOption, setGroupOption] = useState('none'); // 'none', '2', '5'
    const [groupCodeInput, setGroupCodeInput] = useState('');
    const [groupBusy, setGroupBusy] = useState(false);
    const [groupMsg, setGroupMsg] = useState(null); // { type: 'error'|'success', text }
    const { currentUser } = useAuth();
    const { addToCart, myGroups, createGroup, joinGroup, leaveGroup } = useCart();

    useEffect(() => {
        let cancelled = false;

        fetch(`/api/products/${id}`)
            .then(res => {
                if (res.status === 404) {
                    navigate('/shop');
                    return null;
                }
                if (!res.ok) throw new Error('Failed to load product');
                return res.json();
            })
            .then(data => {
                if (cancelled) return;
                if (data) {
                    setProduct(data);
                    setActiveImage(data.image);
                }
            })
            .catch(err => {
                if (!cancelled) setError(err.message);
            });

        return () => { cancelled = true; };
    }, [id, navigate]);

    if (error) {
        return (
            <div className="pt-32 pb-16 text-center font-body">
                <p className="text-lg text-gray-500 mb-4">{error}</p>
                <Link to="/shop" className="text-[#4800b2] font-bold hover:underline">Back to Curated Living</Link>
            </div>
        );
    }

    if (!product) return <div className="pt-32 text-center">Loading product...</div>;

    let imageList = [];
    try {
        imageList = product.images ? JSON.parse(product.images) : [];
    } catch {
        imageList = [];
    }
    if (!Array.isArray(imageList) || imageList.length === 0) {
        imageList = product.image ? [product.image] : [];
    }

    const orderCount = Number(product.total_orders) || 0;

    // Group membership for this product (drives the discount). A group the user has already
    // used (placed an order with the discount) is treated as finished: its code disappears
    // and the page goes back to the "have a code / generate a code" panel.
    const myGroup = myGroups.find(g => g.product_id === Number(product.id) && !g.used);
    const myGroupDiscount = myGroup && myGroup.status === 'full' ? Number(myGroup.discount_percent) || 0 : 0;
    const previewDiscount = groupOption === '2' ? 5 : groupOption === '5' ? 10 : 0;

    // Add to cart is ALWAYS the single-person price. Group discounts are applied
    // automatically in the cart once the group is complete (see CartContext).
    const handleAddToCart = (e) => {
        e.preventDefault();
        addToCart(product);
    };

    const handleGenerateCode = async () => {
        if (groupOption === 'none') {
            setGroupMsg({ type: 'error', text: 'Select a 2-People or 5-People group option first' });
            return;
        }
        setGroupBusy(true);
        setGroupMsg(null);
        // Switching sizes (e.g. 2 People → 5 People): discard the current code first so the
        // new size can be started fresh (or a friend's code of that size can be pasted).
        const active = myGroups.find(g => g.product_id === Number(product.id) && !g.used);
        if (active && Number(active.size) !== Number(groupOption)) {
            const left = await leaveGroup(active.group_id);
            if (!left.ok) {
                setGroupBusy(false);
                setGroupMsg({ type: 'error', text: left.error });
                return;
            }
        }
        const result = await createGroup(product.id, Number(groupOption));
        setGroupBusy(false);
        if (result.ok) {
            const friendsNeeded = Number(groupOption) - 1;
            setGroupMsg({ type: 'success', text: `Group created! Share your code with ${friendsNeeded} friend${friendsNeeded === 1 ? '' : 's'} to unlock the discount.` });
        } else {
            setGroupMsg({ type: 'error', text: result.error });
        }
    };

    const handleJoinWithCode = async () => {
        const code = groupCodeInput.trim();
        if (!code) {
            setGroupMsg({ type: 'error', text: 'Please paste a reference code' });
            return;
        }
        setGroupBusy(true);
        setGroupMsg(null);
        // Switching sizes: discard the current code before pasting a friend's code of the new size.
        const active = myGroups.find(g => g.product_id === Number(product.id) && !g.used);
        if (active && Number(active.size) !== Number(groupOption)) {
            const left = await leaveGroup(active.group_id);
            if (!left.ok) {
                setGroupBusy(false);
                setGroupMsg({ type: 'error', text: left.error });
                return;
            }
        }
        const result = await joinGroup(code, product.id);
        setGroupBusy(false);
        if (result.ok) {
            setGroupMsg({
                type: 'success',
                text: result.group.status === 'full'
                    ? 'Group complete — your discount will be applied when you place your order!'
                    : 'Joined! The discount unlocks once the group is complete.'
            });
            setGroupCodeInput('');
        } else {
            setGroupMsg({ type: 'error', text: result.error });
        }
    };

    const handleLeaveGroup = async () => {
        if (!myGroup) return;
        setGroupBusy(true);
        const result = await leaveGroup(myGroup.group_id);
        setGroupBusy(false);
        if (!result.ok) setGroupMsg({ type: 'error', text: result.error });
    };

    const handleCopyCode = () => {
        if (!myGroup) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(myGroup.code)
                .then(() => setGroupMsg({ type: 'success', text: 'Code copied to clipboard' }))
                .catch(() => setGroupMsg({ type: 'success', text: `Your code: ${myGroup.code}` }));
        } else {
            setGroupMsg({ type: 'success', text: `Your code: ${myGroup.code}` });
        }
    };

    return (
        <div className="pt-24 pb-12 max-w-screen-2xl mx-auto px-6 font-body">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 mb-8 text-sm text-gray-500">
                <Link to="/" className="hover:text-[#4800b2]">Home</Link>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
                <Link to="/shop" className="hover:text-[#4800b2]">Curated Living</Link>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
                <span className="text-gray-900 font-medium truncate max-w-[40vw]">{product.name}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Left: Product Media */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                    <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden bg-white shadow-sm relative group border border-gray-100">
                        <img className="w-full h-full object-contain transition-all duration-300" onError={handleImgError} src={activeImage || product.image} alt={product.name} />
                    </div>
                    {imageList.length > 1 && (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                            {imageList.map((url, index) => {
                                const isActive = activeImage === url;
                                return (
                                    <button
                                        key={index}
                                        onClick={() => setActiveImage(url)}
                                        className={`aspect-square rounded-xl overflow-hidden bg-white border-2 transition-all ${
                                            isActive ? 'border-[#4800b2] ring-2 ring-[#4800b2]/20 scale-105' : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <img className="w-full h-full object-contain p-1" onError={handleImgError} src={url} alt={`detail ${index}`} />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right: Product Information */}
                <div className="lg:col-span-5 flex flex-col gap-8">
                    <section>
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            <span className="bg-[#fdaa90] text-[#783c28] text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full">Editor's Choice</span>
                            {orderCount > 0 ? (
                                <span className="inline-flex items-center gap-1.5 bg-[#e8ddff] text-[#4800b2] text-xs font-bold px-3 py-1.5 rounded-full">
                                    <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
                                    {formatOrderCount(orderCount)}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1.5 rounded-full">
                                    No orders yet — be the first
                                </span>
                            )}
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-headline font-extrabold text-gray-900 tracking-tight mb-2">{product.name}</h1>
                        <p className="text-gray-500 text-lg leading-relaxed mb-6">{product.description}</p>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-end gap-4">
                                <span className="text-5xl font-headline font-black text-[#4800b2] tracking-tighter">{formatINR(product.price)}</span>
                            </div>

                            {/* Real popularity block */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Popularity</span>
                                    <span className="text-[10px] text-[#4800b2] font-bold">Live from orders</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-[#e8ddff] rounded-xl text-[#4800b2]">
                                        <span className="material-symbols-outlined">shopping_bag</span>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-headline font-extrabold text-gray-900 leading-none">{orderCount.toLocaleString('en-IN')}</p>
                                        <p className="text-xs text-gray-500 mt-1">times ordered</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Group Buying Section */}
                    <section className="bg-white p-6 rounded-xl shadow-sm ring-1 ring-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-[#e8ddff] rounded-lg text-[#4800b2]">
                                <span className="material-symbols-outlined">groups</span>
                            </div>
                            <div>
                                <h3 className="font-headline font-bold text-lg text-gray-900">Buying Options</h3>
                                <p className="text-xs text-gray-500">Add to cart is always the single price — the group discount is applied when you place your order once everyone joins with the same code.</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {/* Standard Option */}
                            <div
                                onClick={() => setGroupOption('none')}
                                className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-all border ${
                                    groupOption === 'none'
                                        ? 'bg-purple-50/50 border-[#4800b2] ring-1 ring-[#4800b2]/20'
                                        : 'bg-gray-50 border-transparent hover:bg-gray-100/75'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[18px] text-gray-500">person</span>
                                    <div>
                                        <span className="text-sm font-bold text-gray-900 block">Single Purchase</span>
                                        <span className="text-[10px] text-gray-500">Standard checkout price</span>
                                    </div>
                                </div>
                                <span className="text-gray-900 font-bold">{formatINR(product.price)}</span>
                            </div>

                            {/* 2 People Option */}
                            <div
                                onClick={() => setGroupOption('2')}
                                className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-all border ${
                                    groupOption === '2'
                                        ? 'bg-purple-50/50 border-[#4800b2] ring-1 ring-[#4800b2]/20'
                                        : 'bg-gray-50 border-transparent hover:bg-gray-100/75'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[18px] text-[#4800b2]">group</span>
                                    <div>
                                        <span className="text-sm font-bold text-gray-900 block">2 People Group</span>
                                        <span className="text-[10px] text-gray-500">Save 5% when a friend joins with your code</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-[#4800b2] font-black">{formatINR(product.price * 0.95)}</span>
                                    <span className="text-[9px] line-through text-gray-400">{formatINR(product.price)}</span>
                                </div>
                            </div>

                            {/* 5 People Option */}
                            <div
                                onClick={() => setGroupOption('5')}
                                className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-all border ${
                                    groupOption === '5'
                                        ? 'bg-purple-50/50 border-[#4800b2] ring-1 ring-[#4800b2]/20'
                                        : 'bg-gray-50 border-transparent hover:bg-gray-100/75'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[18px] text-[#4800b2]">groups</span>
                                    <div>
                                        <span className="text-sm font-bold text-[#4800b2] block">5 People Group</span>
                                        <span className="text-[10px] text-gray-500">Save 10% when 4 friends join with your code</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-[#4800b2] font-black">{formatINR(product.price * 0.90)}</span>
                                    <span className="text-[9px] line-through text-gray-400">{formatINR(product.price)}</span>
                                </div>
                            </div>

                            {/* Group offer sub-panel (only when a group option is selected) */}
                            {groupOption !== 'none' && (
                                <div className="p-4 rounded-lg border border-[#4800b2]/20 bg-purple-50/40 space-y-4">
                                    <p className="text-[11px] leading-relaxed text-gray-600 bg-white/70 rounded-lg px-3 py-2">
                                        <span className="material-symbols-outlined text-[14px] align-middle mr-1 text-[#4800b2]">info</span>
                                        <span className="font-bold">How group pricing works:</span> your cart always shows the single-person price — the group discount is applied automatically <span className="font-bold">when you place your order</span>.
                                    </p>
                                    {!currentUser ? (
                                        <p className="text-sm text-gray-600">
                                            <Link to="/login" className="text-[#4800b2] font-bold underline">Sign in</Link> to join a group order and get your reference code.
                                        </p>
                                    ) : myGroup && Number(myGroup.size) === Number(groupOption) ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Your group code</p>
                                                    <button onClick={handleCopyCode} className="text-2xl font-headline font-black text-[#4800b2] tracking-wider hover:opacity-80">
                                                        {myGroup.code}
                                                        <span className="material-symbols-outlined text-[16px] align-middle ml-1">content_copy</span>
                                                    </button>
                                                </div>
                                                <button onClick={handleLeaveGroup} disabled={groupBusy} className="text-xs text-gray-500 border border-gray-300 rounded-lg px-3 py-1.5 hover:text-red-600 hover:border-red-300 transition-colors disabled:opacity-50">
                                                    {Number(myGroup.created_by) === Number(currentUser?.id) ? 'Discard code' : 'Leave group'}
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                                                    <span className="block h-full bg-[#4800b2] transition-all duration-500" style={{ width: `${Math.min(100, (myGroup.member_count / myGroup.size) * 100)}%` }}></span>
                                                </span>
                                                <span className="text-xs font-bold text-gray-600 whitespace-nowrap">{myGroup.member_count}/{myGroup.size} joined</span>
                                            </div>
                                            {myGroup.status === 'full' ? (
                                                <p className="text-sm font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">✓ Group complete — {myGroupDiscount}% off will be applied when you place your order</p>
                                            ) : (
                                                <p className="text-xs text-gray-500">Share this code with {myGroup.size - myGroup.member_count} more friend{myGroup.size - myGroup.member_count === 1 ? '' : 's'}. The discount is applied when you place your order once everyone joins.</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1 block">Have a reference code from a friend?</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        value={groupCodeInput}
                                                        onChange={(e) => setGroupCodeInput(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleJoinWithCode()}
                                                        placeholder="e.g. LAMP-LUMEN-847"
                                                        className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium uppercase tracking-wide focus:ring-2 focus:ring-[#4800b2] outline-none min-w-0"
                                                    />
                                                    <button onClick={handleJoinWithCode} disabled={groupBusy} className="bg-[#4800b2] text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all whitespace-nowrap">
                                                        Join
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="flex-1 h-px bg-gray-200"></span>
                                                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">or</span>
                                                <span className="flex-1 h-px bg-gray-200"></span>
                                            </div>
                                            <button onClick={handleGenerateCode} disabled={groupBusy} className="w-full border-2 border-dashed border-[#4800b2]/40 text-[#4800b2] rounded-lg py-3 text-sm font-bold hover:bg-[#4800b2]/5 transition-colors disabled:opacity-50">
                                                {groupBusy ? 'Working...' : `Generate new code for ${previewDiscount}% off`}
                                            </button>
                                        </div>
                                    )}
                                    {groupMsg && (
                                        <p className={`text-xs font-bold ${groupMsg.type === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>{groupMsg.text}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Actions */}
                    <div className="flex flex-col gap-4 mt-2">
                        <button
                            onClick={handleAddToCart}
                            className="bg-gradient-to-br from-[#4800b2] to-[#6200ee] text-white py-5 rounded-xl font-headline font-bold text-lg flex items-center justify-center gap-2 shadow-xl hover:opacity-90 active:scale-95 transition-all">
                            <span className="material-symbols-outlined">add_shopping_cart</span>
                            Add to Cart — {formatINR(product.price)}
                        </button>
                        <p className="text-xs text-gray-500 text-center leading-relaxed">
                            Group discounts are applied when you place your order once all members have joined with the same code.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
