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
      console.log('🔍 ADMIN CHECK - User:', user.email, 'ID:', user.id);
      
      // SIMPLIFIED ADMIN CHECK - just check if user exists in admin table
      const { data: adminUsers, error } = await supabase
        .from('admin_users')
        .select('*')
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .eq('is_active', true);

      console.log('🔍 Admin query result:', adminUsers);

      if (error) {
        console.error('❌ Admin query error:', error);
        setIsAdmin(false);
        return;
      }

      if (adminUsers && adminUsers.length > 0) {
        const adminData = adminUsers[0];
        console.log('✅ ADMIN FOUND!', adminData);
        setAdminData(adminData);
        setIsAdmin(true);
        toast({
          title: "🎉 ADMIN ACCESS ACTIVATED!",
          description: `Welcome Admin ${user.email}!`,
        });
      } else {
        console.log('❌ NO ADMIN RECORD FOUND');
        setAdminData(null);
        setIsAdmin(false);
        toast({
          title: "❌ Access Denied",
          description: "Not an admin user",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('💥 ADMIN CHECK ERROR:', error);
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