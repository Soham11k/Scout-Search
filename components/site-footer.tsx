import Link from 'next/link'
import { Logo } from '@/components/logo'

export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-24 bg-[color:var(--paper-raised)]">
      <div className="container-editorial grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-muted-foreground leading-relaxed">
            A quieter way to search the web. Scout is a small, self-funded
            project built for people who want their tools to feel considered.
          </p>
          <p className="mt-6 text-xs text-muted-foreground">
            Crafted in a tiny room with too much coffee.
          </p>
        </div>

        <FooterCol
          title="Product"
          links={[
            { href: '/#features', label: 'Features' },
            { href: '/#how', label: 'How it works' },
            { href: '/app', label: 'Open Scout' },
            { href: '/#faq', label: 'FAQ' },
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            { href: '/#words', label: 'Our notes' },
            { href: 'mailto:hello@scout.example', label: 'Contact' },
            { href: '#', label: 'Changelog' },
            { href: '#', label: 'Status' },
          ]}
        />
        <FooterCol
          title="Legal"
          links={[
            { href: '#', label: 'Privacy' },
            { href: '#', label: 'Terms' },
            { href: '#', label: 'Security' },
            { href: '#', label: 'Cookies' },
          ]}
        />
      </div>
      <div className="border-t border-border">
        <div className="container-editorial flex flex-col gap-2 py-6 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-muted-foreground">
            © 2026 Scout Labs · Made for humans.
          </p>
          <p className="font-serif italic text-sm text-muted-foreground">
            “Small tools, made carefully.”
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({
  title,
  links,
}: {
  title: string
  links: { href: string; label: string }[]
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </h4>
      <ul className="mt-4 space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-sm text-foreground/85 link-underline"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
