import React from 'react';

const About = () => {
    return (
        <div className="about-page container" style={{ padding: '4rem 1rem' }}>
            <h1 className="section-title" style={{ marginBottom: '3rem' }}>About ShopNest</h1>

            <div className="blog-posts" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <article className="blog-post" style={{ marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#333' }}>Our Journey: Crafting Quality for the Modern Home</h2>
                    <p style={{ color: '#666', lineHeight: '1.8', marginBottom: '1rem' }}>
                        It started with a simple idea: that everyday objects should be beautiful, functional, and built to last.
                        In 2023, ShopNest was born out of a small studio with just a handful of curated items.
                        We believed that the things we surround ourselves with act as the backdrop to our lives, influencing our mood and creativity.
                    </p>
                    <p style={{ color: '#666', lineHeight: '1.8' }}>
                        Today, we work with artisans from around the globe to bring you a collection that speaks to specific aesthetic sensibilities
                        without compromising on utility. Whether it's the lamp on your desk or the bag on your shoulder, we ensure every stitch and circuit is intentional.
                    </p>
                </article>

                <article className="blog-post">
                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#333' }}>Sustainability: A Core Promise</h2>
                    <p style={{ color: '#666', lineHeight: '1.8', marginBottom: '1rem' }}>
                        In an era of fast fashion and disposable tech, we choose to slow down.
                        Our commitment to sustainability isn't just a buzzword—it's woven into our business model.
                        We prioritize materials that are ethically sourced and packaging that is 100% recyclable.
                    </p>
                    <p style={{ color: '#666', lineHeight: '1.8' }}>
                        By designing products that endure styles and wear, we reduce waste.
                        We believe the most sustainable product is the one you don't have to replace.
                        Join us in our mission to create a more mindful, beautiful world, one purchase at a time.
                    </p>
                </article>
            </div>
        </div>
    );
};

export default About;
