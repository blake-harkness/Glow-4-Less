import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();
const port = process.env.PORT || 3001;

// Initialize Supabase client
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY // Use service key for admin privileges
);

// Middleware
app.use(cors());
app.use(express.static('public'));

// For Stripe webhook, we need the raw body
app.use('/stripe-webhook', express.raw({ type: 'application/json' }));
// For other routes, use JSON parsing
app.use(express.json());

app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { priceId, userId, userEmail } = req.body;

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
            client_reference_id: userId,
            metadata: {
                userId: userId // Add userId to metadata for webhook
            }
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Handle subscription cancellations
app.post('/api/cancel-subscription', async (req, res) => {
    try {
        const { subscriptionId } = req.body;
        const subscription = await stripe.subscriptions.cancel(subscriptionId);
        res.json({ status: 'success' });
    } catch (error) {
        console.error('Error canceling subscription:', error);
        res.status(500).json({ error: error.message });
    }
});

// Stripe webhook handler
app.post('/stripe-webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const userId = session.client_reference_id;
                const priceId = session.line_items?.data[0]?.price?.id;

                let tier = 'Basic';
                if (priceId === process.env.STRIPE_GLOW_PRICE_ID) {
                    tier = 'Glow';
                } else if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) {
                    tier = 'Glow Premium';
                }

                // Update user's subscription in Supabase
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

                // Downgrade user to Basic plan
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

        res.json({ received: true });
    } catch (err) {
        console.error('Error processing webhook:', err);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 