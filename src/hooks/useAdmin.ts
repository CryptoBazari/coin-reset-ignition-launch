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
      console.log('Checking admin status for user:', user.id, user.email);
      
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      console.log('Admin query result:', { data, error });

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching admin data:', error);
        return;
      }

      if (data) {
        console.log('Admin data found:', data);
        setAdminData(data);
        setIsAdmin(true);
        console.log('Set isAdmin to true for user:', user.email);
        toast({
          title: "Admin Access Granted",
          description: "You now have admin privileges!",
        });
      } else {
        console.log('No admin data found for user:', user.email);
        // Let's also check if user exists in admin table but with wrong user_id
        const { data: allAdminUsers } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', user.email);
        
        console.log('All admin users with this email:', allAdminUsers);
        setAdminData(null);
        setIsAdmin(false);
        toast({
          title: "No Admin Access",
          description: "Your account does not have admin privileges.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error checking admin user:', error);
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