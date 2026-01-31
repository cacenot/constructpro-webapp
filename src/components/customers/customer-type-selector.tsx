import { Building2, User } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export type CustomerTypeOption = 'individual' | 'company'

interface CustomerTypeSelectorProps {
  onSelect: (type: CustomerTypeOption) => void
}

/**
 * Component to select between Pessoa Física (individual) or Pessoa Jurídica (company)
 * before showing the customer form.
 */
export function CustomerTypeSelector({ onSelect }: CustomerTypeSelectorProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <CustomerTypeCard
        type="individual"
        title="Pessoa Física"
        description="Cliente individual (CPF)"
        icon={User}
        onClick={() => onSelect('individual')}
      />
      <CustomerTypeCard
        type="company"
        title="Pessoa Jurídica"
        description="Empresa ou organização (CNPJ)"
        icon={Building2}
        onClick={() => onSelect('company')}
      />
    </div>
  )
}

interface CustomerTypeCardProps {
  type: CustomerTypeOption
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
}

function CustomerTypeCard({ title, description, icon: Icon, onClick }: CustomerTypeCardProps) {
  return (
    <Card
      className="cursor-pointer transition-all hover:border-primary hover:shadow-sm"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <CardHeader className="p-8">
        <div className="flex items-center gap-5">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="size-6 text-primary" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-xl font-semibold">{title}</CardTitle>
            <CardDescription className="text-sm font-medium">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}
