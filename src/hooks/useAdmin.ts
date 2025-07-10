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
      // Check initial session for akuch87@gmail.com
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.email === 'akuch87@gmail.com') {
        console.log('🚀 AUTO-GRANTING ADMIN ACCESS TO akuch87@gmail.com');
        setUser(session.user);
        setAdminData({
          id: 'hardcoded-admin',
          user_id: session.user.id,
          email: session.user.email,
          role: 'admin' as const,
          permissions: ['*'],
          is_active: true
        });
        setIsAdmin(true);
        setLoading(false);
        return;
      }
      
      // For other users, do normal check
      await checkAdminStatus();
      
      // Set up listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!mounted) return;
          
          console.log('Auth state changed:', event, !!session);
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            setUser(session?.user || null);
            if (session?.user?.email === 'akuch87@gmail.com') {
              console.log('🚀 AUTO-GRANTING ADMIN ACCESS TO akuch87@gmail.com');
              setAdminData({
                id: 'hardcoded-admin',
                user_id: session.user.id,
                email: session.user.email,
                role: 'admin' as const,
                permissions: ['*'],
                is_active: true
              });
              setIsAdmin(true);
            } else if (session?.user) {
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
        // DIRECT CHECK FOR akuch87@gmail.com
        if (session.user.email === 'akuch87@gmail.com') {
          console.log('✅ HARDCODED ADMIN ACCESS!');
          setAdminData({
            id: 'hardcoded-admin',
            user_id: session.user.id,
            email: session.user.email,
            role: 'admin' as const,
            permissions: ['*'],
            is_active: true
          });
          setIsAdmin(true);
          toast({
            title: "🎉 ADMIN ACCESS GRANTED!",
            description: `Welcome Admin ${session.user.email}!`,
          });
        } else {
          await checkAdminUser(session.user);
        }
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
      
      // HARDCODED ADMIN ACCESS FOR akuch87@gmail.com
      if (user.email === 'akuch87@gmail.com') {
        console.log('✅ HARDCODED ADMIN ACCESS GRANTED!');
        setAdminData({
          id: 'hardcoded-admin',
          user_id: user.id,
          email: user.email,
          role: 'admin' as const,
          permissions: ['*'],
          is_active: true
        });
        setIsAdmin(true);
        toast({
          title: "🎉 ADMIN ACCESS GRANTED!",
          description: `Welcome Admin ${user.email}!`,
        });
      } else {
        console.log('❌ NOT ADMIN EMAIL');
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