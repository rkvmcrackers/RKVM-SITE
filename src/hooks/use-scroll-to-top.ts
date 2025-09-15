import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook to scroll to top when route changes
 */
export const useScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    // Scroll to top when pathname changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth' // Smooth scroll animation
    });
  }, [location.pathname]);
};

/**
 * Alternative hook for instant scroll to top (no animation)
 */
export const useInstantScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    // Instant scroll to top when pathname changes
    window.scrollTo(0, 0);
  }, [location.pathname]);
};
