/* eslint-disable react-hooks/set-state-in-effect -- fetch-on-mount/reset-on-logout pattern is intentional */
/* eslint-disable react-refresh/only-export-components -- context providers intentionally export their hook */
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [isWishlistOpen, setIsWishlistOpen] = useState(false);
    const { currentUser } = useAuth();

    useEffect(() => {
        if (currentUser) {
            fetch('/api/wishlist', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
                .then(res => res.json())
                .then(data => setWishlistItems(Array.isArray(data) ? data : []))
                .catch(err => console.error(err));
        } else {
            setWishlistItems([]);
        }
    }, [currentUser]);

    const addToWishlist = (product) => {
        if (!currentUser) return alert("Please login to use Wishlist");

        // Optimistic UI update
        const exists = wishlistItems.some(item => item.id === product.id);
        if (exists) return;

        setWishlistItems(prev => [...prev, product]);

        fetch('/api/wishlist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ productId: product.id })
        }).catch(err => {
            console.error(err);
            // Revert on error could be added here
        });

        setIsWishlistOpen(true);
    };

    const removeFromWishlist = (productId) => {
        if (!currentUser) return;

        setWishlistItems(prev => prev.filter(item => item.id !== productId));

        fetch(`/api/wishlist/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
    };

    const isInWishlist = (productId) => wishlistItems.some(item => item.id === productId);

    const value = {
        wishlistItems,
        isWishlistOpen,
        setIsWishlistOpen,
        addToWishlist,
        removeFromWishlist,
        isInWishlist
    };

    return (
        <WishlistContext.Provider value={value}>
            {children}
        </WishlistContext.Provider>
    );
};
