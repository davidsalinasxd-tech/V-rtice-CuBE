import type { Metadata } from "next";
import Link from "next/link";
import { PublicNav } from "@/components/PublicNav";
import { SUSCRIPCION } from "@/lib/r2";
import { TELEGRAM_URL, linkTelegramSuscripcion } from "@/lib/telegram";

export const metadata: Metadata = {
  title: "Suscripción mensual",
  description:
    "Suscripción mensual Vértice Cube: descargas ilimitadas de diseños PRO para sublimación y cupo mensual de diseños de vendedores externos.",
};

const BENEFICIOS = [
  {
    titulo: "PRO ilimitado",
    detalle: "Descargá todos los diseños oficiales y PRO del catálogo, las veces que quieras, todo el mes.",
  },
  {
    titulo: `${SUSCRIPCION.MAX_DESCARGAS_EXTERNAS_POR_MES} descargas externas por mes`,
    detalle: `Diseños de vendedores externos incluidos en el plan, con un tope de ${SUSCRIPCION.MAX_DESCARGAS_EXTERNAS_POR_DIA} por día para evitar abusos.`,
  },
  {
    titulo: "Sin compromiso",
    detalle: "Es mes a mes. Si no renovás, dejás de ser suscriptor y podés seguir comprando diseños sueltos.",
  },
  {
    titulo: "Si se acaba el cupo",
    detalle: "Podés seguir comprando diseños individuales de vendedores externos al precio normal del catálogo.",
  },
];

export default function SuscripcionPage() {
  return (
    <>
      <PublicNav />

      <section className="relative overflow-hidden border-b border-line py-20">
        <div className="mx-auto max-w-3xl px-8 text-center">
          <span className="mb-4.5 block font-mono text-xs font-bold tracking-widest text-orange uppercase">
            Suscripción mensual
          </span>
          <h1 className="font-display mb-5.5 text-[40px] leading-tight text-navy sm:text-[52px]">
            Todo el catálogo PRO,
            <br />
            un solo pago al mes
          </h1>
          <p className="mx-auto mb-9 max-w-140 text-[17px] leading-relaxed text-text-dim">
            Dejá de coordinar transferencia por cada diseño. Con la suscripción tenés acceso ilimitado a los
            diseños PRO/oficiales y un cupo mensual de diseños de vendedores externos.
          </p>

          <div className="mx-auto mb-9 w-fit rounded-lg border-1.5 border-line-strong bg-white px-10 py-7 shadow-[0_20px_40px_rgba(0,47,89,0.08)]">
            <div className="font-mono text-[13px] tracking-wide text-text-dim uppercase">Precio</div>
            <div className="font-display my-1.5 text-[44px] text-navy">
              Gs. {SUSCRIPCION.PRECIO_MENSUAL.toLocaleString("es-PY")}
              <span className="text-[16px] font-normal text-text-dim"> /mes</span>
            </div>
          </div>

          <div>
            <a
              href={linkTelegramSuscripcion()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-[3px] bg-orange px-8 py-4.5 text-[16px] font-bold text-white transition-all hover:gap-3 hover:bg-orange-2"
            >
              Suscribirme por Telegram →
            </a>
            <p className="mt-3.5 text-xs text-text-dim">
              Coordinás el pago por Telegram y activamos tu suscripción en el momento que confirmamos la
              transferencia.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-line py-18">
        <div className="mx-auto max-w-6xl px-8">
          <div className="grid grid-cols-1 gap-px border border-line bg-line md:grid-cols-2">
            {BENEFICIOS.map((b) => (
              <div key={b.titulo} className="bg-white px-7 py-7">
                <h3 className="mb-2 text-[16px] text-navy">{b.titulo}</h3>
                <p className="text-[13px] leading-relaxed text-text-dim">{b.detalle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-18">
        <div className="mx-auto max-w-3xl px-8">
          <h2 className="font-display mb-8 text-[26px] text-navy">Preguntas frecuentes</h2>
          <div className="flex flex-col gap-6">
            <Faq pregunta="¿Cómo pago la suscripción?">
              Por ahora el pago es por transferencia bancaria manual, coordinada por Telegram — igual que la
              compra de un diseño individual. Todavía no hay cobro automático.
            </Faq>
            <Faq pregunta="¿Cuándo se activa?">
              En cuanto confirmamos la transferencia por Telegram, activamos tu suscripción desde el panel y
              queda vigente por 30 días.
            </Faq>
            <Faq pregunta="¿Qué pasa si se me acaba el cupo de diseños externos?">
              Podés seguir descargando diseños PRO/oficiales sin límite. Para diseños de vendedores externos que
              superen el cupo del mes, comprás esos puntuales al precio normal del catálogo.
            </Faq>
            <Faq pregunta="¿Puedo cancelar cuando quiera?">
              Sí, es mes a mes. Si no renovás, tu cuenta vuelve a comprador normal al vencer el período pagado.
            </Faq>
          </div>
        </div>
      </section>

      <footer className="border-t border-line bg-white py-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8">
          <span className="font-mono text-xs text-text-dim">VÉRTICE CUBE © 2026</span>
          <div className="flex gap-6">
            <Link href="/#catalogo" className="text-[13px] text-text-dim hover:text-navy">
              Catálogo
            </Link>
            <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-[13px] text-text-dim hover:text-navy">
              Contacto / Soporte
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}

function Faq({ pregunta, children }: { pregunta: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line pb-6">
      <h3 className="mb-1.5 text-[15px] font-semibold text-navy">{pregunta}</h3>
      <p className="text-[13px] leading-relaxed text-text-dim">{children}</p>
    </div>
  );
}
