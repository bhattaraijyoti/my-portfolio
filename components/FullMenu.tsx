'use client'

interface FullMenuProps {
  isOpen: boolean
  onClose: () => void
}

const links = [
  { label: 'Work', href: '#work' },
  { label: 'Services', href: '#services' },
  { label: 'About', href: '#about' },
  { label: 'Process', href: '#process' },
  { label: 'Contact', href: '#contact' },
]

export default function FullMenu({ isOpen, onClose }: FullMenuProps) {
  const handleClick = (href: string) => {
    onClose()
    setTimeout(() => {
      const scrollEl = document.querySelector('.scroll-wrap')
      const target = document.querySelector(href)
      if (scrollEl && target) {
        const top = (target as HTMLElement).offsetTop
        scrollEl.scrollTo({ top, behavior: 'smooth' })
      }
    }, 600)
  }

  return (
    <div className={`menu-overlay ${isOpen ? 'is-open' : ''}`}>
      <div className="menu-overlay__links">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="menu-overlay__link"
            onClick={(e) => {
              e.preventDefault()
              handleClick(link.href)
            }}
          >
            {link.label}
          </a>
        ))}
      </div>
      <div className="menu-overlay__bottom">
        <div className="menu-overlay__social">
          <a href="https://twitter.com/bhattaraijyoti" target="_blank" rel="noopener noreferrer">Twitter</a>
          <a href="https://github.com/bhattaraijyoti" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://linkedin.com/in/bhattaraijyoti" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        </div>
        <div className="menu-overlay__contact">
          jyotibhattarai010@gmail.com
        </div>
      </div>
    </div>
  )
}
