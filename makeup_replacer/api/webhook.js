import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { buffer } from 'micro';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase client
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            buf,
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
                const userId = session.client_reference_id;
                const subscription = await stripe.subscriptions.retrieve(session.subscription);
                const priceId = subscription.items.data[0].price.id;

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
                        stripe_subscription_id: session.subscription,
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
                        stripe_subscription_id: null,
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

        return res.status(200).json({ received: true });
    } catch (err) {
        console.error('Error processing webhook:', err);
        return res.status(500).json({ error: 'Webhook processing failed' });
    }
} 