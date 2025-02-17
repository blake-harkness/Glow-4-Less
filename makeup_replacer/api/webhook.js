import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // Get the subscription tier from the price ID
        let tier = 'Basic';
        if (session.metadata.priceId === process.env.VITE_STRIPE_GLOW_PRICE_ID) {
          tier = 'Glow';
        } else if (session.metadata.priceId === process.env.VITE_STRIPE_PREMIUM_PRICE_ID) {
          tier = 'Glow Premium';
        }

        // Update user's subscription in Supabase
        const { error } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: session.metadata.userId,
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
        
        // Find user by subscription ID
        const { data: userData, error: fetchError } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (fetchError) {
          console.error('Error fetching user:', fetchError);
          return res.status(500).json({ error: 'Failed to fetch user' });
        }

        // Downgrade user to Basic plan
        const { error } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: userData.user_id,
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

    res.json({ received: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
} 