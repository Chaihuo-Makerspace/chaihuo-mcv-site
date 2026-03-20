import { useLocation, Outlet } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Navigation } from './Navigation';

export function Layout() {
  const location = useLocation();

  return (
    <>
      <Navigation />
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </>
  );
}
