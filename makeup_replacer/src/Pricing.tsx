import React from 'react';
import './Pricing.css';
import { supabase } from './lib/supabase';
import { useNavigate } from 'react-router-dom';

const Pricing = () => {
    const [user, setUser] = React.useState<any>(null);
    const navigate = useNavigate();

    React.useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        fetchUser();
    }, []);

    const handleSubscribe = () => {
        if (!user) {
            navigate('/login');
            return;
        }
    };

    return (
        <div className="pricing-container">
            <div className="pricing-header">
                <h2>Choose Your Glow Plan</h2>
                <p>Find your perfect match with our flexible pricing options</p>
            </div>

            <div className="pricing-grid">
                {/* Basic Plan */}
                <div className="pricing-card">
                    <div className="plan-header">
                        <h3>Basic</h3>
                        <div className="price">
                            <span className="amount">$0</span>
                            <span className="period">/month</span>
                        </div>
                    </div>
                    <div className="plan-features">
                        <ul>
                            <li>✨ 2 Product Matches per Month</li>
                            <li>✨ Basic Product Analysis</li>
                            <li>✨ Email Support</li>
                            <li className="disabled">❌ Priority Processing</li>
                            <li className="disabled">❌ Smart Recommendations</li>
                            <li className="disabled">❌ Price Tracking</li>
                        </ul>
                    </div>
                    <button 
                        className="plan-button basic-button"
                        onClick={handleSubscribe}
                    >
                        Get Started
                    </button>
                </div>

                {/* Glow Plan */}
                <div className="pricing-card popular">
                    <div className="popular-badge">MOST POPULAR</div>
                    <div className="discount-badge">Save 50%</div>
                    <div className="plan-header">
                        <h3>Glow</h3>
                        <div className="price">
                            <span className="original">$20</span>
                            <span className="amount">$10</span>
                            <span className="period">/month</span>
                        </div>
                    </div>
                    <div className="plan-features">
                        <ul>
                            <li>✨ 40 Product Matches per Month</li>
                            <li>✨ Advanced Product Analysis</li>
                            <li>✨ Priority Email Support</li>
                            <li>✨ Priority Processing</li>
                            <li>✨ Smart Recommendations</li>
                            <li className="disabled">❌ Price Tracking</li>
                        </ul>
                    </div>
                    <button 
                        className="plan-button popular-button"
                        onClick={handleSubscribe}
                    >
                        Get Started
                    </button>
                    <p className="popular-note">⭐ Most chosen by beauty enthusiasts</p>
                </div>

                {/* Premium Plan */}
                <div className="pricing-card premium">
                    <div className="discount-badge">Save 25%</div>
                    <div className="plan-header">
                        <h3>Glow Premium</h3>
                        <div className="price">
                            <span className="original">$40</span>
                            <span className="amount">$30</span>
                            <span className="period">/month</span>
                        </div>
                    </div>
                    <div className="plan-features">
                        <ul>
                            <li>✨ Unlimited Product Matches</li>
                            <li>✨ Premium Product Analysis</li>
                            <li>✨ 24/7 Priority Support</li>
                            <li>✨ Instant Processing</li>
                            <li>✨ AI-Powered Recommendations</li>
                            <li>✨ Real-time Price Tracking</li>
                        </ul>
                    </div>
                    <button 
                        className="plan-button premium-button"
                        onClick={handleSubscribe}
                    >
                        Go Premium
                    </button>
                </div>
            </div>

            <div className="pricing-footer">
                <p>All plans include our satisfaction guarantee. Cancel anytime.</p>
                <div className="guarantee-badges">
                    <span>🔒 Secure Payment</span>
                    <span>💎 Premium Support</span>
                    <span>⭐ Money-back Guarantee</span>
                </div>
            </div>
        </div>
    );
};

export default Pricing; 