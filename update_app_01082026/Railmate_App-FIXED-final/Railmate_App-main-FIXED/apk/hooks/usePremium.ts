import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';

/**
 * RevenueCat integration placeholder
 * TODO: Install @revenuecat/purchases-react-native and implement actual RevenueCat calls
 *
 * For now, this checks the database directly.
 * In production, RevenueCat would be the source of truth.
 */

/**
 * Check premium status from database
 */
async function checkPremiumStatus(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('is_premium, premium_expires_at')
    .eq('id', userId)
    .single();

  if (error) throw new Error(error.message);

  if (!data.is_premium) return false;

  // Check if premium has expired
  if (data.premium_expires_at) {
    const expiresAt = new Date(data.premium_expires_at);
    if (expiresAt < new Date()) {
      // Premium expired, update database
      await supabase
        .from('users')
        .update({ is_premium: false })
        .eq('id', userId);
      return false;
    }
  }

  return true;
}

/**
 * Hook to get current premium status
 * Syncs with authStore
 */
export function usePremiumStatus() {
  const { user } = useAuth();
  const { setPremium } = useAuthStore();

  return useQuery({
    queryKey: ['premium', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const isPremium = await checkPremiumStatus(user.id);
      setPremium(isPremium);
      return isPremium;
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 1 minute (check frequently for premium status)
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

/**
 * Purchase package (placeholder for RevenueCat integration)
 *
 * TODO: Implement actual RevenueCat purchase flow:
 * 1. import Purchases from '@revenuecat/purchases-react-native'
 * 2. Call Purchases.purchasePackage(packageToPurchase)
 * 3. On success, webhook will update Supabase via RevenueCat webhook
 * 4. Refresh premium status
 */
interface PurchaseResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

async function purchasePremium(userId: string): Promise<PurchaseResult> {
  // TODO: Replace with actual RevenueCat purchase
  console.warn('RevenueCat not implemented yet. Use manual database update for testing.');

  // For development/testing: manually set premium in database
  if (process.env.EXPO_PUBLIC_DEV_MODE === 'true') {
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year from now

    const { error } = await supabase
      .from('users')
      .update({
        is_premium: true,
        premium_expires_at: expiresAt.toISOString(),
      })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, transactionId: 'dev-test-purchase' };
  }

  return {
    success: false,
    error: 'RevenueCat not configured. Set EXPO_PUBLIC_DEV_MODE=true for testing.',
  };
}

/**
 * Hook to purchase premium
 */
export function usePurchase() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('No user logged in');
      return purchasePremium(user.id);
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['premium', user?.id] });
      }
    },
  });
}

/**
 * Restore purchases (for users who already purchased on another device)
 * TODO: Implement with RevenueCat.restorePurchases()
 */
export function useRestorePurchases() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('No user logged in');

      // TODO: Replace with Purchases.restorePurchases()
      console.warn('RevenueCat restore not implemented yet');

      // For now, just refresh from database
      queryClient.invalidateQueries({ queryKey: ['premium', user?.id] });

      return { success: true };
    },
  });
}
