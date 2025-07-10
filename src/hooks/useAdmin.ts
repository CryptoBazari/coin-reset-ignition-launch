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
      // First check initial session
      await checkAdminStatus();
      
      // Then set up listener
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
      
      toast({
        title: "Checking Admin Status",
        description: "Refreshing your admin permissions...",
      });
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        toast({
          title: "Session Error",
          description: sessionError.message,
          variant: "destructive",
        });
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
      console.log('=== CHECKING ADMIN USER ===');
      console.log('User ID:', user.id);
      console.log('User Email:', user.email);
      
      // First check: exact user_id match
      const { data: exactMatch, error: exactError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      console.log('Exact match query result:', { exactMatch, exactError });

      // Second check: email match (in case user_id is wrong)
      const { data: emailMatch, error: emailError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', user.email)
        .eq('is_active', true);

      console.log('Email match query result:', { emailMatch, emailError });

      // Use email match if exact match fails but email match exists
      const adminData = exactMatch?.[0] || emailMatch?.[0];

      if (adminData) {
        console.log('✅ ADMIN ACCESS GRANTED - Data:', adminData);
        setAdminData(adminData);
        setIsAdmin(true);
        toast({
          title: "✅ Admin Access Granted!",
          description: `Welcome Admin ${user.email}! You now have admin privileges.`,
        });
      } else {
        console.log('❌ NO ADMIN ACCESS - No matching records found');
        setAdminData(null);
        setIsAdmin(false);
        toast({
          title: "❌ No Admin Access",
          description: "Your account does not have admin privileges.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('💥 Error checking admin user:', error);
      setAdminData(null);
      setIsAdmin(false);
      toast({
        title: "Error",
        description: "Failed to check admin status.",
        variant: "destructive",
      });
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