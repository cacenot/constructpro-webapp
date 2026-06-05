import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function ProjectCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[2/1] w-full rounded-none" />
      <div className="space-y-2.5 p-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-14 w-full rounded-md" />
      </div>
    </Card>
  )
}
