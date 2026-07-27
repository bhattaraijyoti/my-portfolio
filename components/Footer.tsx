'use client'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__logo">JB</div>
        <div className="footer__links">
          <a href="https://twitter.com/bhattaraijyoti" target="_blank" rel="noopener noreferrer" className="footer__link">Twitter</a>
          <a href="https://github.com/bhattaraijyoti" target="_blank" rel="noopener noreferrer" className="footer__link">GitHub</a>
          <a href="https://linkedin.com/in/bhattaraijyoti" target="_blank" rel="noopener noreferrer" className="footer__link">LinkedIn</a>
          <a href="mailto:jyotibhattarai010@gmail.com" className="footer__link">Email</a>
        </div>
      </div>
      <div className="footer__bottom">
        <span>&copy; 2026 Jyoti Bhattarai</span>
        <span>Tulsipur, Nepal</span>
        <span>Design &amp; Development</span>
      </div>
    </footer>
  )
}
