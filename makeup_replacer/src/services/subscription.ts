import { supabase } from '../lib/supabase';

export type SubscriptionTier = 'Basic' | 'Glow' | 'Glow Premium';

export interface UserSubscription {
  id: string;
  user_id: string;
  subscription_tier: SubscriptionTier;
  monthly_usage: number;
  last_usage_reset: string;
  created_at: string;
  updated_at: string;
  stripe_subscription_id?: string;
}

export const getSubscription = async (userId: string): Promise<UserSubscription | null> => {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }

  return data;
};

export const createOrUpdateSubscription = async (
  userId: string,
  tier: SubscriptionTier
): Promise<UserSubscription | null> => {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('user_subscriptions')
    .upsert(
      {
        user_id: userId,
        subscription_tier: tier,
        monthly_usage: 0,
        last_usage_reset: now,
        created_at: now,
        updated_at: now,
      },
      { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Error updating subscription:', error);
    return null;
  }

  return data;
};

export const incrementUsage = async (userId: string): Promise<boolean> => {
  const subscription = await getSubscription(userId);
  if (!subscription) return false;

  // Get usage limit based on tier
  const usageLimit = getUsageLimit(subscription.subscription_tier);

  // Check if user has reached their limit
  if (subscription.monthly_usage >= usageLimit) {
    return false;
  }

  // Check if we need to reset monthly usage (new month)
  const lastReset = new Date(subscription.last_usage_reset);
  const currentDate = new Date();
  const shouldReset = lastReset.getMonth() !== currentDate.getMonth() ||
                     lastReset.getFullYear() !== currentDate.getFullYear();

  // Update the usage in Supabase
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      monthly_usage: shouldReset ? 1 : subscription.monthly_usage + 1,
      last_usage_reset: shouldReset ? currentDate.toISOString() : subscription.last_usage_reset,
      updated_at: currentDate.toISOString()
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating usage:', error);
    return false;
  }

  return true;
};

export const getUsageLimit = (tier: SubscriptionTier): number => {
  switch (tier) {
    case 'Basic':
      return 2;
    case 'Glow':
      return 30;
    case 'Glow Premium':
      return Infinity;
    default:
      return 0;
  }
};

export const getRemainingUsage = async (userId: string): Promise<number> => {
  const subscription = await getSubscription(userId);
  if (!subscription) return 0;

  const usageLimit = getUsageLimit(subscription.subscription_tier);
  if (usageLimit === Infinity) return Infinity;

  // Check if we need to reset monthly usage (new month)
  const lastReset = new Date(subscription.last_usage_reset);
  const currentDate = new Date();
  const shouldReset = lastReset.getMonth() !== currentDate.getMonth() ||
                     lastReset.getFullYear() !== currentDate.getFullYear();

  if (shouldReset) {
    // Reset the usage count in Supabase
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        monthly_usage: 0,
        last_usage_reset: currentDate.toISOString(),
        updated_at: currentDate.toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error resetting usage:', error);
      return Math.max(0, usageLimit - subscription.monthly_usage);
    }
    return usageLimit;
  }

  return Math.max(0, usageLimit - subscription.monthly_usage);
}; 