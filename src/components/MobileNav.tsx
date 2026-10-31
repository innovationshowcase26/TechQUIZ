export type NavItem = 'home' | 'passport' | 'scan' | 'profile' | 'booths' | 'faqs';

interface MobileNavProps {
  activeItem?: NavItem;
  onHome?: () => void;
  onPassport?: () => void;
  onScan?: () => void;
  onProfile?: () => void;
  onBooths?: () => void;
  onFaqs?: () => void;
}

export function MobileNav({
  activeItem = 'home',
  onHome,
  onPassport,
  onScan,
  onProfile,
  onBooths,
  onFaqs: _onFaqs,
}: MobileNavProps) {
  const isHomeActive = activeItem === 'home' || activeItem === 'booths';
  const isPassportActive = activeItem === 'passport';
  const isScanActive = activeItem === 'scan';
  const isProfileActive = activeItem === 'profile';

  return (
    <nav className="app-nav-dock" aria-label="Bottom Navigation">
      <button
        type="button"
        className={`app-nav-tab ${isHomeActive ? 'app-nav-tab--active' : ''}`}
        onClick={onHome || onBooths}
        aria-label="Home"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span>Home</span>
        {isHomeActive && <span className="app-nav-tab__indicator" />}
      </button>

      <button
        type="button"
        className={`app-nav-tab ${isPassportActive ? 'app-nav-tab--active' : ''}`}
        onClick={onPassport}
        aria-label="Passport"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
        </svg>
        <span>Passport</span>
        {isPassportActive && <span className="app-nav-tab__indicator" />}
      </button>

      <button
        type="button"
        className={`app-nav-tab ${isScanActive ? 'app-nav-tab--active' : ''}`}
        onClick={onScan}
        aria-label="Scan QR Code"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 7V5a2 2 0 0 1 2-2h2" />
          <path d="M17 3h2a2 2 0 0 1 2 2v2" />
          <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
          <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
          <line x1="7" y1="12" x2="17" y2="12" />
        </svg>
        <span>Scan QR</span>
        {isScanActive && <span className="app-nav-tab__indicator" />}
      </button>

      <button
        type="button"
        className={`app-nav-tab ${isProfileActive ? 'app-nav-tab--active' : ''}`}
        onClick={onProfile}
        aria-label="Profile"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span>Profile</span>
        {isProfileActive && <span className="app-nav-tab__indicator" />}
      </button>
    </nav>
  );
}
