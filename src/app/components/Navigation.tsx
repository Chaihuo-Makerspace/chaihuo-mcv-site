import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import logoHorizontal from '@/assets/logo-horizontal.png';

const NAV_LINKS = [
  { to: '/', label: '首页' },
  { to: '/deconstruct', label: '解构基地车' },
  { to: '/documentation', label: '完整纪实' },
  { to: '/guide', label: '上车指南' },
  { to: '/about', label: '关于柴火' },
];

interface NavigationProps {
  pathname: string;
}

export default function Navigation({ pathname }: NavigationProps) {
  const isHome = pathname === '/';
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMenu(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeMenu]);

  // Dark text mode: scrolled on home, or any non-home page
  const isLight = !isHome || scrolled;

  const linkClass = (path: string, mobile = false) => {
    const isActive = pathname === path;
    if (mobile) {
      return `block py-3 px-4 text-lg transition-colors duration-200 ${
        isActive
          ? 'text-brand border-l-2 border-brand font-medium'
          : 'text-neutral-700 hover:text-neutral-900'
      }`;
    }
    if (isLight) {
      return `relative transition-colors duration-200 ${
        isActive ? 'text-brand font-medium' : 'text-neutral-500 hover:text-neutral-900'
      }`;
    }
    return `relative transition-colors duration-200 ${
      isActive ? 'text-brand' : 'text-white/80 hover:text-white'
    }`;
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isLight
          ? 'bg-white/95 backdrop-blur-md border-b border-neutral-300/50 shadow-sm'
          : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center">
            <img
              src={logoHorizontal}
              alt="柴火创客"
              className={`h-8 transition-all duration-500 ${isLight ? '' : 'brightness-0 invert'}`}
            />
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8 text-sm">
            {NAV_LINKS.map((link) => (
              <a key={link.to} href={link.to} className={linkClass(link.to)}>
                {link.label}
              </a>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden relative w-8 h-8 flex items-center justify-center cursor-pointer"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? '关闭菜单' : '打开菜单'}
          >
            <span className={`absolute h-0.5 w-5 rounded transition-all duration-300 ${isLight ? 'bg-neutral-900' : 'bg-white'} ${menuOpen ? 'rotate-45' : '-translate-y-1.5'}`} />
            <span className={`absolute h-0.5 w-5 rounded transition-all duration-300 ${isLight ? 'bg-neutral-900' : 'bg-white'} ${menuOpen ? 'opacity-0' : 'opacity-100'}`} />
            <span className={`absolute h-0.5 w-5 rounded transition-all duration-300 ${isLight ? 'bg-neutral-900' : 'bg-white'} ${menuOpen ? '-rotate-45' : 'translate-y-1.5'}`} />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[60] bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeMenu}
            />
            <motion.div
              className="fixed top-0 right-0 bottom-0 z-[70] w-72 bg-white shadow-2xl flex flex-col"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            >
              <div className="flex justify-end p-6 pb-2">
                <button
                  onClick={closeMenu}
                  className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
                  aria-label="关闭菜单"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="4" y1="4" x2="16" y2="16" />
                    <line x1="16" y1="4" x2="4" y2="16" />
                  </svg>
                </button>
              </div>
              <nav className="flex-1 px-4 py-4">
                {NAV_LINKS.map((link, i) => (
                  <motion.div
                    key={link.to}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, type: 'spring', damping: 25, stiffness: 200 }}
                  >
                    <a href={link.to} className={linkClass(link.to, true)} onClick={closeMenu}>
                      {link.label}
                    </a>
                  </motion.div>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Backwards-compatible named export for old SPA pages (remove in Task 4.1)
export { Navigation };
