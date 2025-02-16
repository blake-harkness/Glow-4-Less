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

  const usageKey = `${userId}_monthly_usage`;
  const resetKey = `${userId}_last_usage_reset`;

  // Get usage count and last reset date from localStorage
  let monthlyUsage = parseInt(localStorage.getItem(usageKey) || '0', 10);
  const lastReset = new Date(localStorage.getItem(resetKey) || '1970-01-01T00:00:00Z');
  const currentDate = new Date();

  // Determine if we should reset the usage count
  const shouldReset = lastReset.getMonth() !== currentDate.getMonth() ||
                      lastReset.getFullYear() !== currentDate.getFullYear();

  if (shouldReset) {
    monthlyUsage = 0;
    localStorage.setItem(resetKey, currentDate.toISOString());
  }

  // Get usage limit based on tier
  const usageLimit = getUsageLimit(subscription.subscription_tier);

  // Check if user has reached their limit
  if (monthlyUsage >= usageLimit) {
    return false;
  }

  // Increment usage count and update localStorage
  monthlyUsage += 1;
  localStorage.setItem(usageKey, monthlyUsage.toString());

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

  const usageKey = `${userId}_monthly_usage`;
  const resetKey = `${userId}_last_usage_reset`;

  // Get usage count and last reset date from localStorage
  let monthlyUsage = parseInt(localStorage.getItem(usageKey) || '0', 10);
  const lastReset = new Date(localStorage.getItem(resetKey) || '1970-01-01T00:00:00Z');
  const currentDate = new Date();

  // Determine if we should reset the usage count
  const shouldReset = lastReset.getMonth() !== currentDate.getMonth() ||
                      lastReset.getFullYear() !== currentDate.getFullYear();

  const usageLimit = getUsageLimit(subscription.subscription_tier);
  if (usageLimit === Infinity) return Infinity;

  if (shouldReset) {
    monthlyUsage = 0;
    localStorage.setItem(resetKey, currentDate.toISOString());
  }

  return Math.max(0, usageLimit - monthlyUsage);
}; 