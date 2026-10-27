import React from 'react';
import { ArrowRight } from 'lucide-react';
import './Hero.css';

const Hero = () => {
    return (
        <section className="hero">
            <div className="container hero-container">
                <div className="hero-content">
                    <span className="hero-badge">NEW COLLECTION 2024</span>
                    <h1 className="hero-title">
                        Smart Shopping <br /> Starts Here
                    </h1>
                    <p className="hero-text">
                        Discover a curated collection designed for modern living.
                        Elevate your space with our premium selection.
                    </p>
                    <button className="btn btn-primary hero-btn">
                        Shop Now <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </section>
    );
};

export default Hero;
