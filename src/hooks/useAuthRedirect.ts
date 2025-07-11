import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const useAuthRedirect = (allowLandingPage = false) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showContinue, setShowContinue] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    // Set a timeout to show continue button if auth check takes too long
    const authTimeout = setTimeout(() => {
      console.log('Landing: Auth check timeout, showing continue button');
      setShowContinue(true);
      setLoading(false);
    }, 5000); // 5 second timeout

    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        console.log('Landing: Checking auth status...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Landing: Session found:', !!session?.user);
        
        // Only auto-redirect if we're not explicitly allowing the landing page
        if (session?.user && !allowLandingPage) {
          console.log('Landing: User authenticated, redirecting to dashboard...');
          clearTimeout(authTimeout);
          navigate('/dashboard', { replace: true });
          return;
        }
        console.log('Landing: Showing landing page');
        clearTimeout(authTimeout);
        setLoading(false);
      } catch (error) {
        console.error('Landing: Error checking auth:', error);
        clearTimeout(authTimeout);
        setLoading(false);
      }
    };

    checkAuth();

    return () => {
      clearTimeout(authTimeout);
    };
  }, [navigate, allowLandingPage]);

  const handleContinue = () => {
    console.log('Landing: User clicked continue, proceeding to landing page');
    setLoading(false);
    setShowContinue(false);
  };

  return { loading, showContinue, handleContinue };
};