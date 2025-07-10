import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

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
    checkAdminStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      
      if (session?.user) {
        await checkAdminUser(session.user);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAdminUser = async (user: User) => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching admin data:', error);
        return;
      }

      if (data) {
        console.log('Admin data found:', data);
        setAdminData(data);
        setIsAdmin(true);
        console.log('Set isAdmin to true');
      } else {
        console.log('No admin data found for user:', user.email);
        setAdminData(null);
        setIsAdmin(false);
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