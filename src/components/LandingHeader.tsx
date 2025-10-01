'use client';

import { Button } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Flexbox } from 'react-layout-kit';

const useStyles = createStyles(({ css, token }) => ({
  header: css`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    z-index: 1000;
    padding: 16px 0;
  `,

  nav: css`
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  `,

  logo: css`
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 1.5rem;
    font-weight: 700;
    color: #333;
    text-decoration: none;
  `,

  navLinks: css`
    display: flex;
    align-items: center;
    gap: 32px;
    
    @media (max-width: 768px) {
      display: none;
    }
    
    a {
      color: #666;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.3s ease;
      
      &:hover {
        color: #667eea;
      }
    }
  `,

  ctaButtons: css`
    display: flex;
    align-items: center;
    gap: 16px;
    
    @media (max-width: 768px) {
      display: none;
    }
  `,

  mobileMenuButton: css`
    display: none;
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    
    @media (max-width: 768px) {
      display: block;
    }
  `,

  mobileMenu: css`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: white;
    z-index: 1001;
    padding: 20px;
    display: none;
    
    &.open {
      display: block;
    }
    
    @media (min-width: 769px) {
      display: none !important;
    }
  `,

  mobileMenuHeader: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40px;
  `,

  mobileMenuLinks: css`
    display: flex;
    flex-direction: column;
    gap: 24px;
    
    a {
      color: #333;
      text-decoration: none;
      font-size: 1.2rem;
      font-weight: 500;
    }
  `,

  mobileMenuButtons: css`
    margin-top: 40px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  `,
}));

export default function LandingHeader() {
  const { styles } = useStyles();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.logo}>
            <Image
              src="/images/logo/crewcut_logo.png?v=123"
              alt="CREW CUT"
              width={32}
              height={32}
            />
            CREW CUT
          </Link>

          <div className={styles.navLinks}>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#docs">Documentation</a>
            <a href="#api">API</a>
            <a href="#support">Support</a>
          </div>

          <div className={styles.ctaButtons}>
            <Link href="/chat">
              <Button type="text">Sign In</Button>
            </Link>
            <Link href="/chat">
              <Button type="primary" style={{ background: '#667eea' }}>
                Get Started
              </Button>
            </Link>
          </div>

          <button
            className={styles.mobileMenuButton}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>
      </header>

      <div className={`${styles.mobileMenu} ${mobileMenuOpen ? 'open' : ''}`}>
        <div className={styles.mobileMenuHeader}>
          <Link href="/" className={styles.logo} onClick={() => setMobileMenuOpen(false)}>
            <Image
              src="/images/logo/crewcut_logo.png?v=123"
              alt="CREW CUT"
              width={32}
              height={32}
            />
            CREW CUT
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X size={24} />
          </button>
        </div>

        <div className={styles.mobileMenuLinks}>
          <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
          <a href="#docs" onClick={() => setMobileMenuOpen(false)}>Documentation</a>
          <a href="#api" onClick={() => setMobileMenuOpen(false)}>API</a>
          <a href="#support" onClick={() => setMobileMenuOpen(false)}>Support</a>
        </div>

        <div className={styles.mobileMenuButtons}>
          <Link href="/chat" onClick={() => setMobileMenuOpen(false)}>
            <Button type="text" style={{ width: '100%' }}>Sign In</Button>
          </Link>
          <Link href="/chat" onClick={() => setMobileMenuOpen(false)}>
            <Button type="primary" style={{ width: '100%', background: '#667eea' }}>
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
