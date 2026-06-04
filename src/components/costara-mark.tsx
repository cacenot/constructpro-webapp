import type { SVGProps } from 'react'

// Símbolo da marca Costara (mono, currentColor). Decorativo: nome acessível
// vem do elemento que o envolve. Aspecto 480:526, dimensione pela altura.
export function CostaraMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 480 526"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <rect x="86" y="0" width="178" height="76" rx="7" />
      <rect x="278" y="0" width="66" height="76" rx="7" />
      <rect x="358" y="0" width="122" height="76" rx="7" />
      <rect x="0" y="90" width="72" height="76" rx="7" />
      <rect x="86" y="90" width="178" height="76" rx="7" />
      <rect x="278" y="90" width="202" height="76" rx="7" />
      <rect x="0" y="180" width="72" height="256" rx="7" />
      <rect x="86" y="180" width="72" height="256" rx="7" />
      <rect x="172" y="360" width="92" height="76" rx="7" />
      <rect x="278" y="360" width="66" height="76" rx="7" />
      <rect x="358" y="360" width="122" height="76" rx="7" />
      <rect x="86" y="450" width="178" height="76" rx="7" />
      <rect x="278" y="450" width="202" height="76" rx="7" />
    </svg>
  )
}
