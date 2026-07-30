import { Link } from "react-router-dom";
import { Mail } from "lucide-react";

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24s3.668-.014 4.948-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324A6.162 6.162 0 0012 5.838zm0 10.162a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);
const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 11.001-4.125 2.062 2.062 0 01-.001 4.125zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);
const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const footerLinks = {
  product: [
    { label: "Features", href: "/#features" },
    { label: "Tools", href: "/#tools" },
    { label: "Pricing", href: "/#pricing" },
    { label: "FAQ", href: "/#faq" },
  ],
  tools: [
    { label: "Caption Generator", href: "/dashboard/caption-generator" },
    { label: "Post Scheduler", href: "/dashboard/scheduler" },
    { label: "Engagement Bot", href: "/dashboard/engagement-bot" },
    { label: "Analytics", href: "/dashboard/analytics" },
  ],
  company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" },
  ],
  legal: [
    { label: "Privacy", href: "/legal/privacy" },
    { label: "Terms", href: "/legal/terms" },
    { label: "Cookies", href: "/legal/cookies" },
  ],
};

const socialLinks = [
  { icon: TwitterIcon, href: "#", label: "Twitter" },
  { icon: InstagramIcon, href: "#", label: "Instagram" },
  { icon: LinkedInIcon, href: "#", label: "LinkedIn" },
  { icon: YouTubeIcon, href: "#", label: "YouTube" },
];

export function Footer() {
  return (
    <footer className="bg-[hsl(var(--canvas))] text-[hsl(var(--canvas-ink))] border-t border-[hsl(var(--canvas-border))]">
      <div className="container mx-auto px-4 py-16 lg:py-20">
        {/* Top grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-14 border-b border-[hsl(var(--canvas-border))]">
          {Object.entries(footerLinks).map(([key, links]) => (
            <div key={key}>
              <h4 className="font-['Instrument_Serif'] text-2xl mb-5 capitalize">
                {key}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-[11px] uppercase tracking-[0.15em] text-[hsl(var(--canvas-muted))] hover:text-[hsl(var(--canvas-ink))] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom: wordmark + socials */}
        <div className="pt-10 grid gap-8 md:grid-cols-2 items-end">
          <div>
            <Link
              to="/"
              className="font-['Instrument_Serif'] text-6xl sm:text-7xl lg:text-8xl leading-none tracking-tight inline-block"
              aria-label="SMMSAAS home"
            >
              SMMSAAS<span className="italic">.</span>
            </Link>
            <p className="mt-4 text-sm text-[hsl(var(--canvas-muted))] max-w-md">
              Automate your social media growth with AI. Save time, ship consistently,
              and reach every audience that matters.
            </p>
          </div>

          <div className="flex flex-col md:items-end gap-4">
            <div className="flex gap-2">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-11 h-11 rounded-full border border-[hsl(var(--canvas-ink))]/25 flex items-center justify-center text-[hsl(var(--canvas-ink))] hover:bg-[hsl(var(--canvas-ink))] hover:text-[hsl(var(--canvas))] transition-colors"
                >
                  <s.icon />
                </a>
              ))}
            </div>
            <a
              href="mailto:support@smmsaas.com"
              className="flex items-center gap-2 text-sm text-[hsl(var(--canvas-muted))] hover:text-[hsl(var(--canvas-ink))] transition-colors"
            >
              <Mail className="w-4 h-4" />
              support@smmsaas.com
            </a>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[hsl(var(--canvas-border))] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[hsl(var(--canvas-muted))]">
          <p>© {new Date().getFullYear()} SMMSAAS. All rights reserved.</p>
          <p className="uppercase tracking-[0.2em]">Built for social teams</p>
        </div>
      </div>
    </footer>
  );
}
