import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  role: 'admin' | 'user';
  permissions: string[];
  is_active: boolean;
}

export const useAdmin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [adminData, setAdminData] = useState<AdminUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      // Check initial session and admin status through database
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await checkAdminUser(session.user);
      }
      
      // Set up listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!mounted) return;
          
          console.log('Auth state changed:', event, !!session);
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            setUser(session?.user || null);
            if (session?.user) {
              await checkAdminUser(session.user);
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setAdminData(null);
            setIsAdmin(false);
          }
          setLoading(false);
        }
      );
      
      return subscription;
    };

    const subscription = initializeAuth();

    return () => {
      mounted = false;
      subscription.then(sub => sub?.unsubscribe());
    };
  }, []);

  const checkAdminStatus = async () => {
    try {
      console.log('=== ADMIN STATUS CHECK STARTED ===');
      setLoading(true);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        return;
      }
      
      setUser(session?.user || null);
      console.log('Current session user:', {
        id: session?.user?.id,
        email: session?.user?.email,
        hasSession: !!session
      });
      
      if (session?.user) {
        await checkAdminUser(session.user);
      } else {
        console.log('No session found');
        toast({
          title: "No User Session",
          description: "Please sign in again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      toast({
        title: "Error",
        description: "Failed to check admin status.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log('=== ADMIN STATUS CHECK ENDED ===');
    }
  };

  const checkAdminUser = async (user: User) => {
    try {
      console.log('🔍 CHECKING ADMIN FOR:', user.email);
      
      // Check admin status through database
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking admin user:', error);
        throw error;
      }

      if (adminUser) {
        console.log('✅ ADMIN ACCESS GRANTED!');
        setAdminData({
          id: adminUser.id,
          user_id: adminUser.user_id,
          email: adminUser.email,
          role: adminUser.role,
          permissions: adminUser.permissions || [],
          is_active: adminUser.is_active
        });
        setIsAdmin(true);
        toast({
          title: "🎉 ADMIN ACCESS GRANTED!",
          description: `Welcome Admin ${user.email}!`,
        });
      } else {
        console.log('❌ NOT ADMIN USER');
        setAdminData(null);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('💥 ADMIN CHECK ERROR:', error);
      setAdminData(null);
      setIsAdmin(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!adminData) return false;
    // Handle null permissions array
    if (!adminData.permissions) return false;
    return adminData.permissions.includes(permission) || adminData.permissions.includes('*');
  };

  return {
    user,
    adminData,
    isAdmin,
    loading,
    hasPermission,
    checkAdminStatus,
  };
};