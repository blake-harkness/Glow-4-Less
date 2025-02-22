import './Home.css';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import makeupImage from './images/makeup-cosmetics.png';
import skincareImage from './images/hikoco_blog_skincare.png';
import haircareImage from './images/banner__78148.original.png';
import quote1 from './images/quote1.jpg';
import quote2 from './images/quote2.jpg';

const Home = () => {
    const navigate = useNavigate();
    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    return (
        <div className="home-container">
            {/* Hero Section */}
            <motion.header 
                className="hero-section"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
            >
                <div className="hero-content">
                    <h1 className="hero-title">
                        Find Affordable Beauty Alternatives
                        <span className="hero-subtitle">Smart Beauty Shopping Made Simple</span>
                    </h1>
                    <p className="hero-description">
                        Upload a photo of any beauty product and instantly discover budget-friendly alternatives 
                        available in your region. Powered by AI to find the perfect match for your beauty needs.
                    </p>
                    <div className="hero-cta">
                        <button className="primary-button" onClick={() => navigate('/give-it-a-go')}>Try It Now</button>
                        <button className="secondary-button" onClick={() => navigate('/pricing')}>View Plans</button>
                    </div>
                </div>

            </motion.header>

            {/* Features Section */}
            <section className="features-section">
                <motion.h2 
                    className="section-title"
                    {...fadeIn}
                >
                    How It Works
                </motion.h2>
                <div className="features-grid">
                    {[
                        {
                            icon: '📸',
                            title: 'Upload Your Product',
                            description: 'Simply take a photo of any beauty product you love or want to try'
                        },
                        {
                            icon: '🔍',
                            title: 'AI Analysis',
                            description: 'Our AI analyzes the product and finds similar alternatives in your region'
                        },
                        {
                            icon: '💰',
                            title: 'Compare Prices',
                            description: 'Get detailed comparisons and find the best deals available'
                        },
                        {
                            icon: '🌍',
                            title: 'Local Availability',
                            description: 'Find products available in your country with local pricing'
                        }
                    ].map((feature, index) => (
                        <motion.div 
                            className="feature-card"
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <span className="feature-icon">{feature.icon}</span>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Product Categories Section */}
            <section className="featured-deals">
                <motion.h2 
                    className="section-title"
                    {...fadeIn}
                >
                    Find Alternatives For
                </motion.h2>
                <div className="deals-grid">
                    {[
                        {
                            image: makeupImage,
                            title: 'Makeup Products',
                            description: 'Foundations, lipsticks, mascaras, and more',
                            category: 'Makeup'
                        },
                        {
                            image: skincareImage,
                            title: 'Skincare Items',
                            description: 'Serums, moisturizers, cleansers, and treatments',
                            category: 'Skincare'
                        },
                        {
                            image: haircareImage,
                            title: 'Hair Care',
                            description: 'Shampoos, conditioners, and styling products',
                            category: 'Hair Care'
                        }
                    ].map((category, index) => (
                        <motion.div 
                            className="deal-card"
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.2 }}
                            onClick={() => navigate('/give-it-a-go')}
                            style={{ marginBottom: '20px' }}
                        >
                            <div className="deal-image">
                                <img src={category.image} alt={category.title} />
                                <span className="deal-category">{category.category}</span>
                            </div>
                            <div className="deal-content">
                                <h3>{category.title}</h3>
                                <p>{category.description}</p>
                                <button className="try-button">Find Alternatives</button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="testimonials-section">
                <motion.h2 
                    className="section-title"
                    {...fadeIn}
                >
                    What Our Users Say
                </motion.h2>
                <div className="testimonials-grid">
                    {[
                        {
                            avatar: quote1,
                            name: 'Dannielle Innes',
                            role: 'University Student',
                            quote: '"As a student, finding alternative products has helped me save money"',
                            rating: 5
                        },
                        {
                            avatar: quote2,
                            name: 'Brittany Brand',
                            role: 'Beauty Enthusiast',
                            quote: '"I found dupes for all of my expensive skin care"',
                            rating: 5
                        }
                    ].map((testimonial, index) => (
                        <motion.div 
                            className="testimonial-card"
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.3 }}
                        >
                            <div className="testimonial-header">
                                <img src={testimonial.avatar} alt={testimonial.name} />
                                <div>
                                    <h4>{testimonial.name}</h4>
                                    <p>{testimonial.role}</p>
                                </div>
                            </div>
                            <p className="testimonial-quote">{testimonial.quote}</p>
                            <div className="testimonial-rating">
                                {'⭐'.repeat(testimonial.rating)}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <motion.section 
                className="cta-section"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <div className="cta-content">
                    <h2>Ready to Find Your Perfect Match?</h2>
                    <p>Start discovering affordable alternatives to your favorite beauty products today.</p>
                    <button className="primary-button" onClick={() => navigate('/give-it-a-go')}>Try It Now</button>
                </div>
            </motion.section>
        </div>
    );
};

export default Home; 