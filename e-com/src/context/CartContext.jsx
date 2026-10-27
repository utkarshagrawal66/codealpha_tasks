/* eslint-disable react-hooks/set-state-in-effect -- fetch-on-mount/reset-on-logout pattern is intentional */
/* eslint-disable react-refresh/only-export-components -- context providers intentionally export their hook */
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [myGroups, setMyGroups] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [placingOrder, setPlacingOrder] = useState(false);
    const { currentUser } = useAuth();

    const authHeaders = () => ({ 'Authorization': `Bearer ${localStorage.getItem('token')}` });

    const refreshCart = useCallback(async () => {
        if (!currentUser) return;
        try {
            const res = await fetch('/api/cart', { headers: authHeaders() });
            const data = await res.json();
            setCartItems(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to load cart", err);
        }
    }, [currentUser]);

    const refreshGroups = useCallback(async () => {
        if (!currentUser) return;
        try {
            const res = await fetch('/api/groups/my', { headers: authHeaders() });
            const data = await res.json();
            setMyGroups(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to load groups", err);
        }
    }, [currentUser]);

    // Sync cart + groups when user changes
    useEffect(() => {
        if (currentUser) {
            refreshCart();
            refreshGroups();
        } else {
            setCartItems([]);
            setMyGroups([]);
        }
    }, [currentUser, refreshCart, refreshGroups]);

    const addToCart = (product) => {
        if (!currentUser) {
            alert('Please login to add items to cart');
            return false;
        }

        // Optimistic Update
        setCartItems(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        setIsCartOpen(true);

        fetch('/api/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ productId: product.id, quantity: 1 })
        })
            .catch(console.error)
            .finally(() => { refreshCart(); refreshGroups(); }); // re-sync so prices reflect current server state
    };

    const removeFromCart = (id) => {
        setCartItems(prev => prev.filter(item => item.id !== id));

        if (currentUser) {
            fetch(`/api/cart/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            }).catch(console.error);
        }
    };

    const updateQuantity = (id, delta) => {
        setCartItems(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);

                if (currentUser) {
                    fetch(`/api/cart/${id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({ quantity: newQty })
                    }).catch(console.error);
                }

                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    // The cart always shows the single-person (normal) price. Group discounts are not
    // reflected in the cart display — they are applied by the server only when the order
    // is placed (once per member; see group_order_usage in server.cjs).
    const itemPrice = (item) => Math.round(Number(item.price) || 0);

    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const cartTotal = cartItems.reduce((acc, item) => acc + (itemPrice(item) * item.quantity), 0);

    const createGroup = async (productId, size) => {
        if (!currentUser) return { ok: false, error: 'Please sign in to join a group order' };
        try {
            const res = await fetch('/api/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ productId, size })
            });
            const data = await res.json();
            if (!res.ok) return { ok: false, error: data.error || 'Failed to create group' };
            await refreshGroups();
            return { ok: true, group: data.group };
        } catch (err) {
            console.error('Failed to create group', err);
            return { ok: false, error: 'Something went wrong. Please try again.' };
        }
    };

    const joinGroup = async (code, productId) => {
        if (!currentUser) return { ok: false, error: 'Please sign in to join a group order' };
        try {
            const res = await fetch('/api/groups/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ code, productId })
            });
            const data = await res.json();
            if (!res.ok) return { ok: false, error: data.error || 'Failed to join group' };
            await refreshGroups();
            await refreshCart(); // joining may complete the group → prices change
            return { ok: true, group: data.group };
        } catch (err) {
            console.error('Failed to join group', err);
            return { ok: false, error: 'Something went wrong. Please try again.' };
        }
    };

    const leaveGroup = async (groupId) => {
        if (!currentUser) return { ok: false, error: 'Please sign in' };
        try {
            const res = await fetch('/api/groups/leave', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ groupId })
            });
            const data = await res.json();
            if (!res.ok) return { ok: false, error: data.error || 'Failed to leave group' };
            await refreshGroups();
            await refreshCart(); // prices may revert
            return { ok: true };
        } catch (err) {
            console.error('Failed to leave group', err);
            return { ok: false, error: 'Something went wrong. Please try again.' };
        }
    };

    // Place an order from the cart. Payment isn't integrated yet — this records the order
    // (with group discounts applied) so the flow works end-to-end before checkout is wired
    // to a payment gateway. Server clears the cart and consumes used group discounts.
    const placeOrder = async () => {
        if (!currentUser) return { ok: false, error: 'Please sign in to checkout' };
        setPlacingOrder(true);
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() }
            });
            const data = await res.json();
            if (!res.ok) return { ok: false, error: data.error || 'Failed to place order' };
            await refreshCart();   // order cleared the cart
            await refreshGroups(); // group discount consumed → future adds are full price
            return { ok: true, order: data.order };
        } catch (err) {
            console.error('Failed to place order', err);
            return { ok: false, error: 'Something went wrong. Please try again.' };
        } finally {
            setPlacingOrder(false);
        }
    };

    const value = {
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        cartCount,
        cartTotal,
        isCartOpen,
        setIsCartOpen,
        myGroups,
        itemPrice,
        createGroup,
        joinGroup,
        leaveGroup,
        placeOrder,
        placingOrder
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};
