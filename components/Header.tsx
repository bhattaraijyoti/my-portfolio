'use client'

interface HeaderProps {
  menuOpen: boolean
  onMenuToggle: () => void
}

export default function Header({ menuOpen, onMenuToggle }: HeaderProps) {
  return (
    <header className="header">
      <div className="header__inner">
        <a href="#" className="header__logo">JYOTI</a>
        <div className="header__right">
          <div className="header__availability">
            <span className="header__dot" />
            Available 2026
          </div>
          <button
            className={`menu-trigger ${menuOpen ? 'is-open' : ''}`}
            onClick={onMenuToggle}
            aria-label="Toggle menu"
          >
            <span className="menu-trigger__line" />
            <span className="menu-trigger__line" />
          </button>
        </div>
      </div>
    </header>
  )
}
