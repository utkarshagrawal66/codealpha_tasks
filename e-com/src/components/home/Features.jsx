import React from 'react';
import { ShieldCheck, Leaf } from 'lucide-react';
import featureArt from '../../assets/feature-art.png';
import './Features.css';

const Features = () => {
    return (
        <section className="features-section">
            <div className="container features-container">
                <div className="features-content">
                    <span className="section-label">OUR MISSION</span>
                    <h2 className="features-title">
                        Curated for You, <br />
                        <span className="highlight">Designed</span> for <span className="highlight-green">Life</span>.
                    </h2>
                    <p className="features-text">
                        ShopNest brings you the finest selection of goods with a focus on
                        quality and sustainability. We believe in products that tell a story and
                        last a lifetime.
                    </p>

                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon-wrapper">
                                <ShieldCheck className="feature-icon" size={24} />
                            </div>
                            <h3 className="feature-name">Quality First</h3>
                            <p className="feature-desc">Durable materials & craftsmanship.</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon-wrapper highlight-green-bg">
                                <Leaf className="feature-icon highlight-green-text" size={24} />
                            </div>
                            <h3 className="feature-name">Sustainable</h3>
                            <p className="feature-desc">Ethically sourced products.</p>
                        </div>
                    </div>
                </div>

                <div className="features-image-wrapper">
                    <img src={featureArt} alt="Abstract Art" className="features-image" />
                </div>
            </div>
        </section>
    );
};

export default Features;
