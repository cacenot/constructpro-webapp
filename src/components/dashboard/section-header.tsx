interface SectionHeaderProps {
  title: string
  href: string
  linkLabel: string
}

/**
 * Cabeçalho de seção do dashboard: rótulo uppercase + link de drill-down para a
 * página dedicada. `<a href>` simples — o client router do Vike intercepta.
 */
export function SectionHeader({ title, href, linkLabel }: SectionHeaderProps) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {title}
      </h2>
      <a href={href} className="text-xs font-medium text-primary hover:underline">
        {linkLabel} →
      </a>
    </div>
  )
}
