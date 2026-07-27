'use client'

interface CTAButtonProps {
  href: string
  children: React.ReactNode
  className?: string
  target?: string
  rel?: string
}

export default function CTAButton({ href, children, className = '', target, rel }: CTAButtonProps) {
  return (
    <a
      href={href}
      className={`cta-link ${className}`}
      target={target}
      rel={rel}
    >
      <span className="cta-link__text">{children}</span>
      <span className="cta-link__arrow">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="7" y1="17" x2="17" y2="7" />
          <polyline points="7 7 17 7 17 17" />
        </svg>
      </span>
    </a>
  )
}
