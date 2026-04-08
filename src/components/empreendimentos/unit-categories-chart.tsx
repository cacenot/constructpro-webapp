import type { components } from '@cacenot/construct-pro-api-client'
import { translateUnitCategory } from '@cacenot/construct-pro-api-client'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { type ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'

type ProjectUnitCategoryBreakdown = components['schemas']['ProjectUnitCategoryBreakdown']

interface UnitCategoriesChartProps {
  data: ProjectUnitCategoryBreakdown[]
}

const chartConfig = {
  available: {
    label: 'Disponível',
    color: 'var(--color-emerald-500, #10b981)',
  },
  reserved: {
    label: 'Reservada',
    color: 'var(--color-blue-500, #3b82f6)',
  },
  sold: {
    label: 'Vendida',
    color: 'var(--color-emerald-600, #059669)',
  },
} satisfies ChartConfig

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{
    payload: { label: string; available: number; reserved: number; sold: number; total: number }
  }>
}) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  if (!entry) return null
  const data = entry.payload

  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="mb-1.5 font-medium">{data.label}</p>
      <div className="grid gap-1">
        <div className="flex justify-between gap-6">
          <span className="text-muted-foreground">Total</span>
          <span className="font-medium">{data.total}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-emerald-600 dark:text-emerald-400">Disponível</span>
          <span className="font-medium">{data.available}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-blue-600 dark:text-blue-400">Reservada</span>
          <span className="font-medium">{data.reserved}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-emerald-700 dark:text-emerald-500">Vendida</span>
          <span className="font-medium">{data.sold}</span>
        </div>
      </div>
    </div>
  )
}

export function UnitCategoriesChart({ data }: UnitCategoriesChartProps) {
  const chartData = data.map((cat) => ({
    label: translateUnitCategory(cat.category as never, 'pt-BR'),
    category: cat.category,
    available: cat.available_count,
    reserved: cat.reserved_count,
    sold: cat.sold_count,
    total: cat.total_count,
    totalPrice: cat.total_price_cents,
  }))

  const totals = data.reduce(
    (acc, cat) => ({
      total: acc.total + cat.total_count,
      available: acc.available + cat.available_count,
      sold: acc.sold + cat.sold_count,
      reserved: acc.reserved + cat.reserved_count,
      price: acc.price + cat.total_price_cents,
    }),
    { total: 0, available: 0, sold: 0, reserved: 0, price: 0 }
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Unidades por Categoria</CardTitle>
      </CardHeader>
      <div className="p-6 pt-0">
        <ChartContainer config={chartConfig} className="h-50 w-full">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              type="category"
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={100}
            />
            <ChartTooltip content={<CustomTooltip />} />
            <Bar
              dataKey="available"
              stackId="units"
              fill="var(--color-available)"
              radius={[4, 0, 0, 4]}
            />
            <Bar dataKey="reserved" stackId="units" fill="var(--color-reserved)" radius={0} />
            <Bar dataKey="sold" stackId="units" fill="var(--color-sold)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>

        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-full bg-emerald-500" />
            Disponível
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-full bg-blue-500" />
            Reservada
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-full bg-emerald-600" />
            Vendida
          </div>
        </div>
      </div>

      <div className="border-t">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6">Categoria</TableHead>
              <TableHead className="px-6 text-right">Total</TableHead>
              <TableHead className="hidden px-6 text-right sm:table-cell">Disp.</TableHead>
              <TableHead className="hidden px-6 text-right sm:table-cell">Vendidas</TableHead>
              <TableHead className="hidden px-6 text-right md:table-cell">Reserv.</TableHead>
              <TableHead className="px-6 text-right">VGV</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chartData.map((cat) => (
              <TableRow key={cat.category}>
                <TableCell className="px-6 font-medium">{cat.label}</TableCell>
                <TableCell className="px-6 text-right tabular-nums">{cat.total}</TableCell>
                <TableCell className="hidden px-6 text-right tabular-nums sm:table-cell">
                  {cat.available}
                </TableCell>
                <TableCell className="hidden px-6 text-right tabular-nums sm:table-cell">
                  {cat.sold}
                </TableCell>
                <TableCell className="hidden px-6 text-right tabular-nums md:table-cell">
                  {cat.reserved}
                </TableCell>
                <TableCell className="px-6 text-right tabular-nums">
                  {formatCurrency(cat.totalPrice / 100)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="px-6 font-semibold">Total</TableCell>
              <TableCell className="px-6 text-right tabular-nums font-semibold">
                {totals.total}
              </TableCell>
              <TableCell className="hidden px-6 text-right tabular-nums font-semibold sm:table-cell">
                {totals.available}
              </TableCell>
              <TableCell className="hidden px-6 text-right tabular-nums font-semibold sm:table-cell">
                {totals.sold}
              </TableCell>
              <TableCell className="hidden px-6 text-right tabular-nums font-semibold md:table-cell">
                {totals.reserved}
              </TableCell>
              <TableCell className="px-6 text-right tabular-nums font-semibold">
                {formatCurrency(totals.price / 100)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </Card>
  )
}
