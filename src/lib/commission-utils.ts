export function buildCommissionRate(percent: number) {
  return {
    ppm: Math.round(percent * 10000),
    percentage: percent.toFixed(4),
    decimal: (percent / 100).toFixed(6),
    basis_points: Math.round(percent * 100),
    formatted: `${percent.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`,
  }
}
