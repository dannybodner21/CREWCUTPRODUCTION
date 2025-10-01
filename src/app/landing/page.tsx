'use client';

import { createStyles } from 'antd-style';
import Image from 'next/image';
import Link from 'next/link';

const useStyles = createStyles(({ css }) => ({
  // Resend exact styling
  page: css`
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    line-height: 1.6;
    color: #ffffff;
    background: #000000;
  `,

  header: css`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #000000;
    border-bottom: 1px solid #333333;
    z-index: 1000;
    padding: 0;
  `,

  nav: css`
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 24px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  `,

  logo: css`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 20px;
    font-weight: 600;
    color: #ffffff;
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
      color: #cccccc;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: color 0.2s;
      
      &:hover {
        color: #ffffff;
      }
    }
  `,

  navButtons: css`
    display: flex;
    align-items: center;
    gap: 16px;
    
    @media (max-width: 768px) {
      display: none;
    }
  `,

  signInBtn: css`
    background: none;
    border: none;
    color: #cccccc;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    padding: 8px 16px;
    border-radius: 6px;
    transition: all 0.2s;
    
    &:hover {
      background: #333333;
      color: #ffffff;
    }
  `,

  getStartedBtn: css`
    background: #111827;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      background: #374151;
    }
  `,

  hero: css`
    background: linear-gradient(135deg, #000000 0%, #111111 100%);
    padding: 120px 0 80px;
    text-align: center;
    position: relative;
    overflow: hidden;
  `,

  heroContent: css`
    max-width: 800px;
    margin: 0 auto;
    padding: 0 24px;
    position: relative;
    z-index: 1;
  `,

  heroTitle: css`
    font-size: 64px;
    font-weight: 800;
    line-height: 1.1;
    margin-bottom: 24px;
    color: #ffffff;
    
    @media (max-width: 768px) {
      font-size: 48px;
    }
  `,

  heroSubtitle: css`
    font-size: 20px;
    color: #cccccc;
    margin-bottom: 40px;
    line-height: 1.5;
    
    @media (max-width: 768px) {
      font-size: 18px;
    }
  `,

  heroButtons: css`
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
  `,

  primaryBtn: css`
    background: #111827;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    
    &:hover {
      background: #374151;
    }
  `,

  secondaryBtn: css`
    background: #000000;
    color: #ffffff;
    border: 1px solid #d1d5db;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    
    &:hover {
      background: #333333;
      border-color: #666666;
    }
  `,

  // Floor background pattern
  floorPattern: css`
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 200px;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="floor" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="%23f1f5f9"/><path d="M0 20L20 0M20 20L40 0M40 20L60 0M60 20L80 0M80 20L100 0" stroke="%23e2e8f0" stroke-width="0.5" fill="none"/></pattern></defs><rect width="100" height="100" fill="url(%23floor)"/></svg>') repeat;
    opacity: 0.3;
  `,

  // Light ray background
  lightRay: css`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(ellipse at center, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
    pointer-events: none;
  `,

  section: css`
    padding: 80px 0;
  `,

  container: css`
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 24px;
  `,

  // Trust banner
  trustBanner: css`
    background: #000000;
    padding: 40px 0;
    text-align: center;
    border-bottom: 1px solid #333333;
  `,

  trustText: css`
    font-size: 16px;
    color: #cccccc;
    margin: 0;
  `,

  // Features section
  features: css`
    background: #000000;
  `,

  sectionTitle: css`
    font-size: 48px;
    font-weight: 700;
    text-align: center;
    margin-bottom: 16px;
    color: #ffffff;
    
    @media (max-width: 768px) {
      font-size: 36px;
    }
  `,

  sectionSubtitle: css`
    font-size: 20px;
    color: #cccccc;
    text-align: center;
    margin-bottom: 60px;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  `,

  // Code example section
  codeSection: css`
    background: #000000;
  `,

  codeBlock: css`
    background: #1f2937;
    color: #f9fafb;
    padding: 40px;
    border-radius: 12px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 14px;
    line-height: 1.6;
    overflow-x: auto;
    margin: 40px 0;
    border: 1px solid #374151;
  `,

  // Testimonials
  testimonials: css`
    background: #000000;
  `,

  testimonialGrid: css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 40px;
    margin-top: 60px;
  `,

  testimonial: css`
    background: #000000;
    padding: 32px;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
  `,

  testimonialQuote: css`
    font-size: 16px;
    line-height: 1.6;
    color: #ffffff;
    margin-bottom: 24px;
    font-style: italic;
  `,

  testimonialAuthor: css`
    display: flex;
    align-items: center;
    gap: 12px;
  `,

  authorAvatar: css`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #3b82f6;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 14px;
  `,

  authorInfo: css`
    h4 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #ffffff;
    }
    
    p {
      margin: 0;
      font-size: 14px;
      color: #cccccc;
    }
  `,

  // Footer
  footer: css`
    background: #111827;
    color: white;
    padding: 60px 0 40px;
  `,

  footerContent: css`
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 24px;
    text-align: center;
  `,

  footerLogo: css`
    margin-bottom: 40px;
  `,

  footerLinks: css`
    display: flex;
    justify-content: center;
    gap: 40px;
    margin-bottom: 40px;
    flex-wrap: wrap;
    
    a {
      color: #666666;
      text-decoration: none;
      font-size: 14px;
      transition: color 0.2s;
      
      &:hover {
        color: white;
      }
    }
  `,

  footerBottom: css`
    color: #cccccc;
    font-size: 14px;
    margin-top: 40px;
    padding-top: 40px;
    border-top: 1px solid #374151;
  `,
}));

export default function LandingPage() {
  const { styles } = useStyles();

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.logo}>
            <Image
              src="/images/logo/crewcut_logo.png?v=123"
              alt="CREW CUT"
              width={24}
              height={24}
            />
            CREW CUT
          </Link>

          <div className={styles.navLinks}>
            <a href="#features">Features</a>
            <a href="#company">Company</a>
            <a href="#resources">Resources</a>
            <a href="#help">Help</a>
            <a href="#docs">Docs</a>
            <a href="#pricing">Pricing</a>
          </div>

          <div className={styles.navButtons}>
            <button className={styles.signInBtn}>Sign in</button>
            <Link href="/chat" className={styles.getStartedBtn}>Get Started</Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.lightRay} />
        <div className={styles.floorPattern} />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Email for<br />
            <span style={{ color: '#3b82f6' }}>developers</span>
          </h1>
          <p className={styles.heroSubtitle}>
            The best way to reach humans instead of spam folders. Deliver transactional and marketing emails at scale.
          </p>
          <div className={styles.heroButtons}>
            <Link href="/chat" className={styles.primaryBtn}>Get Started</Link>
            <Link href="#docs" className={styles.secondaryBtn}>Documentation</Link>
          </div>
        </div>
      </section>

      {/* Trust Banner */}
      <section className={styles.trustBanner}>
        <div className={styles.container}>
          <p className={styles.trustText}>
            Companies of all sizes trust Resend to deliver their most important emails.
          </p>
        </div>
      </section>

      {/* Integrate Section */}
      <section className={`${styles.section} ${styles.features}`}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Integrate</h2>
          <p className={styles.sectionSubtitle}>
            A simple, elegant interface so you can start sending emails in minutes. It fits right into your code with SDKs for your favorite programming languages.
          </p>

          <div className={styles.codeBlock}>
            {`import { Resend } from 'resend';

const resend = new Resend('re_xxxxxxxxx');

(async function() {
  const { data, error } = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: 'delivered@resend.dev',
    subject: 'Hello World',
    html: '<strong>it works!</strong>'
  });

  if (error) {
    return console.log(error);
  }

  console.log(data);
})();`}
          </div>
        </div>
      </section>

      {/* First-class developer experience */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>First-class developer experience</h2>
          <p className={styles.sectionSubtitle}>
            We are a team of engineers who love building tools for other engineers. Our goal is to create the email platform we've always wished we had — one that just works.
          </p>
        </div>
      </section>

      {/* Test Mode */}
      <section className={`${styles.section} ${styles.codeSection}`}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Test Mode</h2>
          <p className={styles.sectionSubtitle}>
            Simulate events and experiment with our API without the risk of accidentally sending real emails to real people.
          </p>
        </div>
      </section>

      {/* Modular Webhooks */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Modular Webhooks</h2>
          <p className={styles.sectionSubtitle}>
            Receive real-time notifications directly to your server. Every time an email is delivered, opened, bounces, or a link is clicked.
          </p>
        </div>
      </section>

      {/* Write using a delightful editor */}
      <section className={`${styles.section} ${styles.codeSection}`}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Write using a delightful editor</h2>
          <p className={styles.sectionSubtitle}>
            A modern editor that makes it easy for anyone to write, format, and send emails. Visually build your email and change the design by adding custom styles.
          </p>
        </div>
      </section>

      {/* Go beyond editing */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Go beyond editing</h2>
          <p className={styles.sectionSubtitle}>
            Group and control your contacts in a simple and intuitive way. Straightforward analytics and reporting tools that will help you send better emails.
          </p>
        </div>
      </section>

      {/* Develop emails using React */}
      <section className={`${styles.section} ${styles.codeSection}`}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Develop emails using React</h2>
          <p className={styles.sectionSubtitle}>
            Create beautiful templates without having to deal with table layouts and HTML. Powered by react-email, our open source component library.
          </p>
        </div>
      </section>

      {/* Reach humans, not spam folders */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Reach humans, not spam folders</h2>
          <p className={styles.sectionSubtitle}>
            Proactive blocklist tracking, faster time to inbox, build confidence with BIMI, managed dedicated IPs, dynamic suppression list, IP and domain monitoring, verify DNS records, battle-tested infrastructure, prevent spoofing with DMARC.
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section className={`${styles.section} ${styles.testimonials}`}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Trusted by developers worldwide</h2>
          <div className={styles.testimonialGrid}>
            <div className={styles.testimonial}>
              <p className={styles.testimonialQuote}>
                "I've used Mailgun, Sendgrid, and Mandrill and they don't come close to providing the quality of developer experience you get with Resend."
              </p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.authorAvatar}>VM</div>
                <div className={styles.authorInfo}>
                  <h4>Vlad Matsiiako</h4>
                  <p>Co-founder of Infisical</p>
                </div>
              </div>
            </div>

            <div className={styles.testimonial}>
              <p className={styles.testimonialQuote}>
                "Resend is an amazing product. It was so easy to switch over. I feel confident knowing that our important emails are in good hands with Resend. Everyone should be using this."
              </p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.authorAvatar}>BS</div>
                <div className={styles.authorInfo}>
                  <h4>Brandon Strittmatter</h4>
                  <p>Co-founder of Outerbase</p>
                </div>
              </div>
            </div>

            <div className={styles.testimonial}>
              <p className={styles.testimonialQuote}>
                "All of our customers are located in South America, so having a solution that could send emails from the region closest to our users is very important. Resend's multi-region feature is a game-changer for us."
              </p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.authorAvatar}>SK</div>
                <div className={styles.authorInfo}>
                  <h4>Shariar Kabir</h4>
                  <p>Founder at Ruby Card</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={styles.section} style={{ background: '#000000' }}>
        <div className={styles.container} style={{ textAlign: 'center' }}>
          <h2 className={styles.sectionTitle}>Email reimagined.<br />Available today.</h2>
          <div className={styles.heroButtons}>
            <Link href="/chat" className={styles.primaryBtn}>Get Started</Link>
            <Link href="#contact" className={styles.secondaryBtn}>Contact Us</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerLogo}>
            <Image
              src="/images/logo/crewcut_logo.png?v=123"
              alt="CREW CUT"
              width={120}
              height={40}
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>

          <div className={styles.footerLinks}>
            <a href="#documentation">Documentation</a>
            <a href="#pricing">Pricing</a>
            <a href="#security">Security</a>
            <a href="#soc2">SOC 2</a>
            <a href="#gdpr">GDPR</a>
            <a href="#brand">Brand</a>
            <a href="#about">About</a>
            <a href="#blog">Blog</a>
            <a href="#careers">Careers</a>
            <a href="#customers">Customers</a>
            <a href="#humans">Humans</a>
            <a href="#philosophy">Philosophy</a>
            <a href="#contact">Contact</a>
            <a href="#support">Support</a>
            <a href="#status">Status</a>
            <a href="#migrate">Migrate</a>
            <a href="#knowledge-base">Knowledge Base</a>
          </div>

          <div className={styles.footerBottom}>
            <p>© 2024 CREW CUT. All rights reserved.</p>
            <p>2261 Market Street #5039<br />San Francisco, CA 94114</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
