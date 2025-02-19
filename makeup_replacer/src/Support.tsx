import { useState } from 'react';
import './Support.css';

interface FAQItem {
    question: string;
    answer: string;
}

const Support = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const faqs: FAQItem[] = [
        {
            question: "How does Glow 4 Less work?",
            answer: "Glow 4 Less uses AI technology to analyze beauty products and find affordable alternatives. Simply upload a photo of your desired product or search by name, and our system will suggest similar products available in your region."
        },
        {
            question: "What types of products can I search for?",
            answer: "You can search for a wide range of beauty products including makeup (foundations, lipsticks, mascaras, etc.), skincare products (serums, moisturizers, cleansers), and hair care items. Our database is constantly growing to include more products."
        },
        {
            question: "How accurate are the product matches?",
            answer: "Our AI system analyzes multiple factors including ingredients, product type, intended use, and user reviews to find the closest matches. While no alternative will be exactly identical, we strive to find products that offer similar benefits and quality."
        },
        {
            question: "What countries do you support?",
            answer: "The majority of countires should work, the majority of testing was done through New Zealand. If there any any issues please reach out!"
        },
        {
            question: "What's included in the free plan?",
            answer: "The free Basic Glow plan includes 3 product matches per month, basic product analysis, and email support. For more features, check out our premium plans on the Pricing page."
        },
        {
            question: "How do I cancel my subscription?",
            answer: "You can cancel your subscription at any time through your account Settings page. If you need assistance, please contact our support team."
        }
    ];

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="support-container">
            <div className="support-header">
                <h2>Support & FAQ</h2>
                <p>Find answers to commonly asked questions about Glow 4 Less</p>
            </div>

            <div className="faq-section">
                {faqs.map((faq, index) => (
                    <div key={index} className="faq-item">
                        <button 
                            className={`faq-question ${openIndex === index ? 'active' : ''}`}
                            onClick={() => toggleFAQ(index)}
                        >
                            {faq.question}
                            <span className="faq-icon">{openIndex === index ? '−' : '+'}</span>
                        </button>
                        <div className={`faq-answer ${openIndex === index ? 'active' : ''}`}>
                            {faq.answer}
                        </div>
                    </div>
                ))}
            </div>

            <div className="contact-section">
                <h3>Still Need Help?</h3>
                <p>Contact us at <a href="mailto:glow4less.ai@gmail.com">glow4less.ai@gmail.com</a></p>
                <p>We typically respond within 24 hours during business days.</p>
            </div>
        </div>
    );
};

export default Support; 