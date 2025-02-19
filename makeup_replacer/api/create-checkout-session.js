import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { priceId, userId, userEmail } = req.body;

        if (!priceId || !userId || !userEmail) {
            return res.status(400).json({ 
                error: 'Missing required parameters' 
            });
        }

        // Create a checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.VITE_CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.VITE_CLIENT_URL}/pricing`,
            customer_email: userEmail,
            metadata: {
                userId: userId
            },
            allow_promotion_codes: true,
            billing_address_collection: 'required',
        });

        return res.status(200).json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        return res.status(500).json({ 
            error: 'Failed to create checkout session' 
        });
    }
} 