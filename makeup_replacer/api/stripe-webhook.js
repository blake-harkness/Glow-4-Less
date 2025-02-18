import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

export const config = {
    api: {
        bodyParser: false, // Disable body parsing, need raw body for Stripe webhook
    },
};

// Helper to get raw body for Stripe webhook
const getRawBody = async (readable) => {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const rawBody = await getRawBody(req);
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            rawBody,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const userId = session.metadata.userId;
                const priceId = session.line_items?.data[0]?.price?.id;

                let tier = 'Basic';
                if (priceId === process.env.VITE_STRIPE_GLOW_PRICE_ID) {
                    tier = 'Glow';
                } else if (priceId === process.env.VITE_STRIPE_PREMIUM_PRICE_ID) {
                    tier = 'Glow Premium';
                }

                const { error } = await supabase
                    .from('user_subscriptions')
                    .upsert({
                        user_id: userId,
                        subscription_tier: tier,
                        updated_at: new Date().toISOString(),
                    }, {
                        onConflict: 'user_id'
                    });

                if (error) {
                    console.error('Error updating subscription:', error);
                    return res.status(500).json({ error: 'Failed to update subscription' });
                }
                break;
            }

            case 'customer.subscription.deleted':
            case 'customer.subscription.canceled': {
                const subscription = event.data.object;
                const userId = subscription.metadata.userId;

                const { error } = await supabase
                    .from('user_subscriptions')
                    .upsert({
                        user_id: userId,
                        subscription_tier: 'Basic',
                        updated_at: new Date().toISOString(),
                    }, {
                        onConflict: 'user_id'
                    });

                if (error) {
                    console.error('Error downgrading subscription:', error);
                    return res.status(500).json({ error: 'Failed to downgrade subscription' });
                }
                break;
            }
        }

        res.status(200).json({ received: true });
    } catch (err) {
        console.error('Error processing webhook:', err);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
} 