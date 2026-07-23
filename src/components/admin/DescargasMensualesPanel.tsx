import type { DescargasPorVendedor } from "@/lib/supabase/admin-queries";

export function DescargasMensualesPanel({ filas }: { filas: DescargasPorVendedor[] }) {
  if (filas.length === 0) {
    return <p className="text-sm text-text-dim">No hay descargas registradas en este período.</p>;
  }

  const totalGeneral = filas.reduce((acc, f) => acc + f.total, 0);

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <Th>Vendedor</Th>
          <Th align="right">Total descargas</Th>
          <Th align="right">Cuentan para pago</Th>
          <Th align="right">Vía suscripción</Th>
        </tr>
      </thead>
      <tbody>
        {filas.map((f) => (
          <tr key={f.vendedorId} className="border-t border-line">
            <td className="py-3.5 pr-3 text-sm text-ink">{f.vendedorNombre}</td>
            <td className="py-3.5 text-right font-mono text-sm">{f.total}</td>
            <td className="py-3.5 text-right font-mono text-sm text-navy-2">{f.cuentanParaPago}</td>
            <td className="py-3.5 text-right font-mono text-sm text-orange">{f.viaSuscripcion}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="border-t border-line-strong">
          <td className="py-3.5 pr-3 text-sm font-semibold text-ink">Total</td>
          <td className="py-3.5 text-right font-mono text-sm font-semibold">{totalGeneral}</td>
          <td colSpan={2} />
        </tr>
      </tfoot>
    </table>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th className={`pb-3 text-[11px] font-medium tracking-wide text-text-dim uppercase ${align === "right" ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}
