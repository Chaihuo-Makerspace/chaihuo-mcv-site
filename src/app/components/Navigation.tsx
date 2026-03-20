import { Link, useLocation } from 'react-router';

export function Navigation() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 ${isHome ? 'bg-black/80 backdrop-blur-sm' : 'bg-white border-b border-gray-200'}`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className={`px-3 py-1.5 font-bold text-lg ${isHome ? 'bg-white text-black' : 'bg-black text-white'}`}>CH</div>
          {!isHome && null}
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm">
          <Link to="/" className={`transition ${isHome ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-600 hover:text-black'}`}>首页</Link>
          <Link to="/deconstruct" className={`transition ${isHome ? 'text-white hover:text-gray-300' : 'text-gray-600 hover:text-black'}`}>解构基地车</Link>
          <Link to="/documentation" className={`transition ${isHome ? 'text-white hover:text-gray-300' : 'text-gray-600 hover:text-black'}`}>完整纪实</Link>
          <Link to="/guide" className={`transition ${isHome ? 'text-white hover:text-gray-300' : 'text-gray-600 hover:text-black'}`}>上车指南</Link>
          <Link to="#" className={`transition ${isHome ? 'text-white hover:text-gray-300' : 'text-gray-600 hover:text-black'}`}>关于柴火</Link>
        </div>
      </div>
    </nav>
  );
}