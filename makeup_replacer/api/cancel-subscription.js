import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { subscriptionId } = req.body;

        if (!subscriptionId) {
            return res.status(400).json({ error: 'Subscription ID is required' });
        }

        await stripe.subscriptions.cancel(subscriptionId);
        return res.status(200).json({ status: 'success' });
    } catch (error) {
        console.error('Error canceling subscription:', error);
        return res.status(500).json({ error: error.message });
    }
} 