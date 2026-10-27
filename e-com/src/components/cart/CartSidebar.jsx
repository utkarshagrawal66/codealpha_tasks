import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../utils/format';
import { handleImgError } from '../../utils/placeholder';

const CartSidebar = ({ isOpen, onClose }) => {
    const { cartItems, removeFromCart, updateQuantity, cartTotal, cartCount, myGroups, placeOrder, placingOrder } = useCart();
    const { currentUser } = useAuth();
    const [orderResult, setOrderResult] = useState(null); // { type: 'success'|'error', order?|text }
    const hasPendingDiscount = myGroups.some(g => g.status === 'full' && !g.used);

    const handleCheckout = async () => {
        if (!currentUser) {
            alert("Please sign in to checkout!");
            return;
        }
        setOrderResult(null);
        const result = await placeOrder();
        if (result.ok) {
            setOrderResult({ type: 'success', order: result.order });
        } else {
            setOrderResult({ type: 'error', text: result.error });
        }
    };

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div className={`fixed inset-y-0 right-0 z-[60] w-full sm:w-[400px] bg-white dark:bg-[#19191f] shadow-2xl transform transition-transform duration-300 border-l border-gray-100 dark:border-gray-800 flex flex-col font-display ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-[#19191f]">
                    <h2 className="text-xl font-bold text-primary dark:text-white flex items-center gap-2">
                        Your Cart <span className="bg-warm-coral text-white text-xs px-2 py-0.5 rounded-full">{cartCount}</span>
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-warm-coral transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {orderResult && (
                    <div className={`p-4 border-b text-sm ${orderResult.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 border-red-100 dark:border-red-800'}`}>
                        {orderResult.type === 'success' ? (
                            <>
                                <p className="font-bold mb-1">Order #{orderResult.order.id} placed — thank you!</p>
                                <p className="opacity-80">Total {formatINR(orderResult.order.total)} (group discounts applied). Payment isn't charged yet — it's coming soon.</p>
                                <button onClick={() => setOrderResult(null)} className="mt-2 text-xs font-bold underline">Got it</button>
                            </>
                        ) : (
                            <>
                                <p className="font-bold mb-1">Couldn't place your order</p>
                                <p className="opacity-80">{orderResult.text}</p>
                                <button onClick={() => setOrderResult(null)} className="mt-2 text-xs font-bold underline">Dismiss</button>
                            </>
                        )}
                    </div>
                )}

                {cartItems.length === 0 ? (
                    <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
                        <span className="material-symbols-outlined text-[64px] text-gray-200 dark:text-gray-800 mb-4">shopping_bag</span>
                        <p className="text-gray-500 mb-6">Your cart is currently empty.</p>
                        <button onClick={onClose} className="bg-warm-coral hover:bg-[#E07A66] text-white px-6 py-3 rounded-lg font-bold transition-colors">
                            Start Shopping
                        </button>
                    </div>
                ) : (
                    <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-6">
                        {cartItems.map(item => {
                            return (
                            <div key={item.id} className="flex gap-4">
                                <div className="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden relative">
                                    <img src={item.image} alt={item.name} onError={handleImgError} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col flex-grow justify-between">
                                    <div>
                                        <h4 className="font-bold text-primary dark:text-white text-sm line-clamp-1">{item.name}</h4>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-md h-7">
                                            <button onClick={() => updateQuantity(item.id, -1)} className="px-2 text-gray-500 hover:text-primary dark:hover:text-white">-</button>
                                            <span className="text-xs font-semibold px-1 min-w-[20px] text-center">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, 1)} className="px-2 text-gray-500 hover:text-primary dark:hover:text-white">+</button>
                                        </div>
                                        <span className="font-bold text-sm text-primary dark:text-white">{formatINR(item.price)}</span>
                                    </div>
                                    <button onClick={() => removeFromCart(item.id)} className="text-xs text-warm-coral text-left mt-1 hover:underline">Remove</button>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                )}

                {cartItems.length > 0 && (
                    <div className="p-6 bg-gray-50 dark:bg-[#19191f] border-t border-gray-100 dark:border-gray-800">
                        {hasPendingDiscount && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-3 text-center font-semibold">Group discount will be applied when you place this order.</p>
                        )}
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-500 text-sm">Subtotal</span>
                            <span className="text-xl font-bold text-primary dark:text-white">{formatINR(cartTotal)}</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-4 text-center">Shipping &amp; taxes calculated at checkout</p>
                        <button onClick={handleCheckout} disabled={placingOrder} className="w-full bg-warm-coral hover:bg-[#E07A66] text-white font-bold py-3.5 rounded-lg shadow-lg hover:shadow-warm-coral/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                            {placingOrder ? (
                                <>Placing order...</>
                            ) : (
                                <><span className="material-symbols-outlined text-[18px]">lock</span> Place Order — {formatINR(cartTotal)}</>
                            )}
                        </button>
                        <p className="text-xs text-gray-400 mt-3 text-center">No payment is taken yet — payment integration is coming soon.</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default CartSidebar;
