import React from 'react';
import { X, ShoppingBag, Trash2 } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { formatINR } from '../../utils/format';
import { handleImgError } from '../../utils/placeholder';
import './WishlistSidebar.css';

const WishlistSidebar = () => {
    const { isWishlistOpen, setIsWishlistOpen, wishlistItems, removeFromWishlist } = useWishlist();
    const { addToCart } = useCart();

    const handleMoveToCart = (item) => {
        addToCart(item);
        removeFromWishlist(item.id);
    };

    return (
        <>
            <div className={`wishlist-overlay ${isWishlistOpen ? 'open' : ''}`} onClick={() => setIsWishlistOpen(false)} />
            <div className={`wishlist-sidebar ${isWishlistOpen ? 'open' : ''}`}>
                <div className="wishlist-header">
                    <h3>Your Wishlist ({wishlistItems.length})</h3>
                    <button onClick={() => setIsWishlistOpen(false)} className="close-btn">
                        <X size={24} />
                    </button>
                </div>

                <div className="wishlist-items">
                    {wishlistItems.length === 0 ? (
                        <div className="empty-wishlist">
                            <p>Your wishlist is empty</p>
                        </div>
                    ) : (
                        wishlistItems.map(item => (
                            <div key={item.id} className="wishlist-item">
                                <img src={item.image} alt={item.name} onError={handleImgError} className="wishlist-item-image" />
                                <div className="wishlist-item-details">
                                    <h4>{item.name}</h4>
                                    <p>{formatINR(item.price)}</p>
                                    <div className="wishlist-actions">
                                        <button
                                            className="move-to-cart-btn"
                                            onClick={() => handleMoveToCart(item)}
                                        >
                                            <ShoppingBag size={16} /> Move to Cart
                                        </button>
                                        <button
                                            className="remove-btn"
                                            onClick={() => removeFromWishlist(item.id)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

export default WishlistSidebar;
