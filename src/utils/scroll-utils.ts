/**
 * Scroll utility functions
 */

/**
 * Scroll to top of the page with smooth animation
 */
export const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'smooth'
  });
};

/**
 * Scroll to top of the page instantly (no animation)
 */
export const scrollToTopInstant = () => {
  window.scrollTo(0, 0);
};

/**
 * Scroll to a specific element by ID
 */
export const scrollToElement = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
};

/**
 * Scroll to a specific position
 */
export const scrollToPosition = (x: number, y: number, smooth: boolean = true) => {
  window.scrollTo({
    top: y,
    left: x,
    behavior: smooth ? 'smooth' : 'auto'
  });
};
