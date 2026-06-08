import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer'
import type { InstallmentDetailResponse } from '@/hooks/use-installments'
import { InstallmentDetailPanel } from './installment-detail-panel'

interface InstallmentDetailDrawerProps {
  installmentId: string
  open: boolean
  onClose: () => void
  onSelectInstallment: (id: string) => void
  onPayInstallment: (installment: InstallmentDetailResponse) => void
  onIssueBoleto: (installment: InstallmentDetailResponse) => void
}

/**
 * Container overlay (mobile/tablet) para o painel da parcela. Em telas largas o
 * mesmo `InstallmentDetailPanel` é renderizado inline (master-detail) — ver
 * pages/financeiro/+Page.tsx. O conteúdo (header, agenda, seções) mora no painel.
 */
export function InstallmentDetailDrawer({
  installmentId,
  open,
  onClose,
  onSelectInstallment,
  onPayInstallment,
  onIssueBoleto,
}: InstallmentDetailDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={(value) => !value && onClose()} direction="right">
      <DrawerContent className="flex flex-col sm:max-w-xl" aria-describedby={undefined}>
        <DrawerTitle className="sr-only">Detalhes da parcela</DrawerTitle>
        {open && installmentId ? (
          <InstallmentDetailPanel
            installmentId={installmentId}
            onClose={onClose}
            onSelectInstallment={onSelectInstallment}
            onPayInstallment={onPayInstallment}
            onIssueBoleto={onIssueBoleto}
          />
        ) : null}
      </DrawerContent>
    </Drawer>
  )
}
