'use client'

import { motion } from 'framer-motion'
import { ChevronDown, Github, Linkedin, Twitter } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { ScrollProgress } from '@/components/scroll-progress'


const projects = [
  {
    title: 'Treatss',

    description: 'Treatss is a digital food-delivery service in Tulsipur.It made ordering food easier for local residents and helped local restaurants get more customers by bringing convenience, choice, and faster delivery to Tulsipur’s food ecosystem.',
    link: 'https://treatss.com',
    image: '/treatss.png',
  },
  {
    title: 'Tech Club',
    description: 'It centralizes tech learning resources and collaboration opportunities for students and creators, helping people learn new skills and connect with other tech enthusiasts instead of relying on fragmented communities.',
    link: 'https://techclubb.vercel.app',
    image: '/tech.png',
  },
  {
    title: 'Tulsipur Dang',
    description: 'It is a community-driven platform to transform Tulsipur into a tech hub.It brings together local events, tech news, and community projects in one place to help tech‑focused people in Tulsipur find resources, mentors, and collaborators more easily, supporting the growth of the local tech ecosystem.',
    link: 'https://tulsipurdang.com',
    image: '/tulsipurdang.png',
  },
]

const skills = [
  { name: 'Product Design', icon: '/icons/design.svg' },
  { name: 'UI/UX Design', icon: '/icons/uiux.svg' },
  { name: 'Animation', icon: '/icons/animation.svg' },
  { name: 'Interaction Design', icon: '/icons/interaction.svg' },
  { name: 'Icon Design', icon: '/icons/icon.svg' },
  { name: 'Design Systems', icon: '/icons/system.svg' },
  { name: 'Prototyping', icon: '/icons/proto.svg' },
  { name: 'User Research', icon: '/icons/research.svg' },
]

import { useRef, useState, useEffect, useMemo } from 'react'

// Simple scroll reveal using intersection observer
function useScrollReveal(ref: React.RefObject<HTMLElement>, offset: number = 100) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const obs = new window.IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.15, rootMargin: `0px 0px -${offset}px 0px` }
    )
    obs.observe(node)
    return () => obs.disconnect()
  }, [ref, offset])
  return {
    visible,
    style: {
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : 'translateY(20px)',
      transition: 'opacity 0.5s cubic-bezier(.4,0,.2,1), transform 0.5s cubic-bezier(.4,0,.2,1)',
      willChange: 'opacity, transform',
    }
  }
}

export default function Home() {
  // For image parallax - removed
  const projectsSectionRef = useRef<HTMLDivElement>(null)
  // const { scrollY } = useScroll()
  // const getParallax = (index: number) => useTransform(scrollY, [0, 600 + index * 200], [0, (index % 2 === 0 ? -8 : 8)])
  const heroRef = useRef<HTMLDivElement>(null)
  // const heroParallax = useTransform(scrollY, [0, 320], [0, 32])

  // === Scroll-based animation refs ===
  const projectsHeaderRef = useRef<HTMLDivElement>(null)
  const skillsHeaderRef = useRef<HTMLDivElement>(null)
  const aboutHeaderRef = useRef<HTMLDivElement>(null)
  const projectsReveal = useScrollReveal(projectsHeaderRef, 120)
  const skillsReveal = useScrollReveal(skillsHeaderRef, 120)
  const aboutReveal = useScrollReveal(aboutHeaderRef, 120)

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 relative overflow-x-clip" style={{ scrollBehavior: 'smooth' }}>
      <ScrollProgress />
      {/* Minimal nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/70 dark:bg-background/60 border-b border-border/30 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <span className="font-semibold tracking-tight text-lg md:text-xl text-foreground dark:text-foreground-light select-none">
            Jyoti Bhattarai
          </span>
          <div className="flex items-center gap-6">
            <a href="#projects" className="text-base font-medium text-foreground dark:text-foreground-light hover:text-blue-500 transition-colors hidden sm:block">Projects</a>
            <a href="#about" className="text-base font-medium text-foreground dark:text-foreground-light hover:text-blue-500 transition-colors hidden sm:block">About</a>
            <a href="#contact" className="text-base font-medium text-foreground dark:text-foreground-light hover:text-blue-500 transition-colors hidden sm:block">Contact</a>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-[90vh] flex items-center justify-center pt-28 px-4 md:px-0 overflow-hidden">
        <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center text-center gap-10">
          {/* Large hero text with gradient */}
          <motion.h1
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22,1,0.36,1] }}
            className="text-[2.6rem] sm:text-6xl md:text-7xl font-bold leading-tight tracking-tight"
          >
            <span className="block">
              <span className="text-foreground dark:text-foreground-light">Designing with</span>
            </span>
            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400">
              Motion &amp; Purpose
            </span>
          </motion.h1>
          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.12, ease: [0.22,1,0.36,1] }}
            className="text-lg md:text-2xl text-muted-foreground dark:text-muted-foreground-light max-w-2xl mx-auto font-normal"
          >
            Product designer &amp; developer crafting clean, intuitive, and animated digital experiences.
          </motion.p>
          {/* CTA Buttons */}
          <motion.div className="flex flex-col sm:flex-row gap-4 justify-center mt-1">
            <motion.a
              href="#projects"
              className="px-8 py-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-lg shadow-[0_0_0_0_rgba(99,102,241,0)] hover:shadow-[0_10px_40px_rgba(99,102,241,0.25)] transition-all duration-300"
            >
              View Projects
            </motion.a>
            <motion.a
              href="#contact"
              className="px-8 py-3 rounded-full border border-border font-semibold text-lg hover:bg-muted transition-colors"
            >
              Get in touch
            </motion.a>
          </motion.div>
          {/* Socials */}
          <div className="flex gap-6 justify-center pt-4">
            <motion.a
              href="https://github.com/bhattaraijyoti/my-portfolio"
              whileHover={{ scale: 1.15, y: -6 }}
              className="text-muted-foreground dark:text-muted-foreground-light hover:text-blue-500 transition-colors"
              aria-label="GitHub"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="w-6 h-6" />
            </motion.a>
          </div>
        </div>
        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ChevronDown className="w-7 h-7 text-muted-foreground dark:text-muted-foreground-light" />
        </motion.div>
      </section>

      {/* Projects Section */}
      <section
        id="projects"
        ref={projectsSectionRef}
        className="relative py-24 md:py-36 px-4 md:px-0 max-w-5xl mx-auto border-t border-border/30"
      >
        <div ref={projectsHeaderRef} style={projectsReveal.style} className="mb-16">
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-2 text-foreground dark:text-foreground-light">Featured Projects</h2>
          <p className="text-lg text-muted-foreground dark:text-muted-foreground-light max-w-2xl">
            A selection of my work in digital product design, UX, and animation.
          </p>
        </div>
        <div className="flex flex-col gap-24">
          {projects.map((project, index) => {
            const cardRef = useRef<HTMLDivElement>(null)
            const cardReveal = useScrollReveal(cardRef, 120)
            return (
              <div
                key={index}
                ref={cardRef}
                style={cardReveal.style}
                className="flex flex-col md:flex-row gap-8 md:gap-16 items-center group"
              >
                {/* Project Number */}
                <motion.span
                  initial={{ opacity: 0, x: -18 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.16 + 0.07 }}
                  className="text-lg md:text-2xl font-semibold text-muted-foreground dark:text-muted-foreground-light flex-shrink-0"
                  style={{
                    fontVariantNumeric: 'tabular-nums',
                    minWidth: 36,
                  }}
                >
                  {`0${index + 1}`}
                </motion.span>
                {/* Project Image */}
                {project.image && (
                  <div
                    className="group relative w-full md:w-[420px] aspect-[4/3] rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-border/40 bg-background transition-shadow duration-300"
                  >
                    <img
                      src={project.image}
                      alt={project.title}
                      loading="lazy"
                      decoding="async"
                      className="object-cover w-full h-full transition-transform duration-300 will-change-transform group-hover:scale-[1.03]"
                      draggable={false}
                      style={{ contentVisibility: 'auto' }}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                )}
                {/* Project Content */}
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.14 + 0.18, ease: [0.22,1,0.36,1] }}
                  className="flex-1 min-w-0 mt-6 md:mt-0"
                >
                  <h3 className="text-xl md:text-2xl font-bold mb-2 text-foreground dark:text-foreground-light">{project.title}</h3>
                  <p className="text-base md:text-lg text-muted-foreground dark:text-muted-foreground-light mb-3">{project.description}</p>
                  {project.link && (
                    <a
                      href={project.link}
                      className="inline-block text-blue-500 font-medium hover:underline text-base"
                      target="_blank" rel="noopener noreferrer"
                    >
                      View Project
                    </a>
                  )}
                </motion.div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Skills / Expertise Section */}
      <section id="about" className="relative py-20 md:py-32 px-4 md:px-0 bg-muted/40 dark:bg-muted/20 border-t border-border/30 transition-colors">
        <div className="max-w-5xl mx-auto">
          <div ref={skillsHeaderRef} style={skillsReveal.style} className="mb-14">
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-2 text-foreground dark:text-foreground-light">Skills &amp; Expertise</h2>
            <p className="text-lg text-muted-foreground dark:text-muted-foreground-light max-w-2xl">
              Tools &amp; methods I use to craft digital experiences.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 md:gap-8">
            {skills.map((skill, idx) => {
              const skillRef = useRef<HTMLDivElement>(null)
              const skillReveal = useScrollReveal(skillRef, 80)
              return (
                <motion.div
                  key={skill.name}
                  ref={skillRef}
                  style={skillReveal.style}
                  whileHover={{ scale:1.08, rotate:1, backgroundColor: "rgba(59,130,246,0.08)", y: -4 }}
                  className="group flex flex-col items-center justify-center gap-2 px-4 py-6 bg-background border border-border/40 rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  
                  <span className="text-base md:text-lg font-medium text-foreground dark:text-foreground-light">{skill.name}</span>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="relative py-20 md:py-32 px-4 md:px-0 border-t border-border/30">
        <div className="max-w-3xl mx-auto">
          <div ref={aboutHeaderRef} style={aboutReveal.style} className="mb-10">
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-6 text-foreground dark:text-foreground-light">About Me</h2>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22,1,0.36,1] }}
            viewport={{ once: true }}
            style={{ willChange: 'transform, opacity' }}
            className="space-y-6 text-lg text-muted-foreground dark:text-muted-foreground-light leading-relaxed"
          >
            A creative and curious designer with a passion for building websites and apps that are both functional and visually engaging. Skilled in UI/UX design, React, Next.js, and Tailwind CSS, with a focus on clean layouts, smooth interactions, and intuitive user experiences.

Always exploring new ideas and technologies, constantly experimenting with animations, effects, and design details to make digital experiences feel lively and enjoyable. Enjoys turning concepts into real projects that are both useful and beautiful.
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative py-20 md:py-32 px-4 md:px-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-500/5 dark:to-cyan-500/5 transition-colors">
        <div className="max-w-2xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-2xl md:text-4xl font-bold tracking-tight mb-4 text-foreground dark:text-foreground-light"
          >
            Let&apos;s Work Together
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-lg text-muted-foreground dark:text-muted-foreground-light mb-8"
          >
            Have a project in mind? I&apos;d love to hear about it. Get in touch and let&apos;s create something amazing.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.a
              href="mailto:jyotibhattarai010@gmail.com"
              whileHover={{ scale: 1.05, boxShadow: "0 8px 24px 0 rgba(80,80,200,0.13)" }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-lg shadow-none transition-all"
            >
              Send Me an Email
            </motion.a>
           
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background/60 dark:bg-background/50 backdrop-blur-md py-7 px-4 md:px-0 transition-colors">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground dark:text-muted-foreground-light">© 2026 Jyoti Bhattarai</span>
          <div className="flex gap-6">
            <a
              href="https://github.com/bhattaraijyoti/my-portfolio"
              className="text-sm text-muted-foreground dark:text-muted-foreground-light hover:text-blue-500 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
      {/* Subtle noise overlay for premium feel */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.01] mix-blend-overlay" style={{backgroundImage:'url(/noise.png)'}} />
    </div>
  )
}
