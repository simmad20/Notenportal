import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user } = useAuth();
  const location = useLocation();
  const isEditor = location.pathname.startsWith('/editor/');

  return (
    <header className="header">
      <NavLink to="/" className="h-logo">
        <div className="h-logo-dot" />
        NotenPortal
      </NavLink>

      {!isEditor && (
        <nav className="h-nav">
          <NavLink to="/" end className={({ isActive }) => `h-nav-a ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={14} /> Übersicht
          </NavLink>
          <NavLink to="/templates" className={({ isActive }) => `h-nav-a ${isActive ? 'active' : ''}`}>
            <BookOpen size={14} /> Vorlagen
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `h-nav-a ${isActive ? 'active' : ''}`}>
            <Settings size={14} /> Einstellungen
          </NavLink>
        </nav>
      )}

      <div className="h-spacer" />

      <div className="user-pill">
        <div className="user-av">{user?.username?.[0]?.toUpperCase()}</div>
        <span className="user-name">{user?.username}</span>
        <span className="user-flag">
          {user?.country === 'AT' ? '🇦🇹' : user?.country === 'DE' ? '🇩🇪' : '🇨🇭'}
        </span>
      </div>
    </header>
  );
}
