"use client";

// Animation variants for reuse across components
export const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 30 },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const slideDown = {
  initial: { opacity: 0, y: -10, scaleY: 0.95 },
  animate: { opacity: 1, y: 0, scaleY: 1 },
  exit: { opacity: 0, y: -10, scaleY: 0.95 },
};

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const cardHover = {
  rest: { y: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  hover: { 
    y: -4, 
    boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
    transition: { duration: 0.3, ease: "easeOut" }
  },
};

export const buttonHover = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.02,
    transition: { duration: 0.2, ease: "easeOut" }
  },
  tap: { scale: 0.98 },
};

export const transition = {
  duration: 0.5,
  ease: [0.22, 1, 0.36, 1] as const,
};

export const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};
