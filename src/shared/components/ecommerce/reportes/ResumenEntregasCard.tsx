import { Icon } from '@iconify/react';
import Cardx from '@/shared/common/Cards';

type Props = {
  totalPedidos: number;
  ecommerce?: string[];     // ['woocommerce', 'shopify', 'vtex']
  motorizados?: string[];   // ['Nombre 1', 'Nombre 2']
};

const ecommerceIcons: Record<string, string> = {
  woocommerce: 'logos:woocommerce',
  shopify: 'logos:shopify',
  vtex: 'simple-icons:vtex',
};

export default function ResumenEntregasCard({
  totalPedidos,
  ecommerce = [],
  motorizados = [],
}: Props) {
  return (
    <Cardx className="flex flex-col items-center gap-4 py-4">

      {/* TOTAL */}
      <div className="w-full bg-gray70 text-white text-sm rounded px-4 py-1 text-center">
        Total Pedidos: <span className="font-semibold">{totalPedidos}</span>
      </div>

      {/* ECOMMERCE */}
      {ecommerce.length > 0 && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-gray60">Ecommerce:</p>

          <div className="flex gap-3">
            {ecommerce.map((e) => (
              <div
                key={e}
                className="flex items-center gap-1 px-3 py-1 bg-gray10 rounded-full border text-sm"
              >
                {ecommerceIcons[e] && (
                  <Icon icon={ecommerceIcons[e]} className="text-lg" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MOTORIZADOS */}
      {motorizados.length > 0 && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-gray60">Motorizado:</p>

          <div className="flex flex-wrap justify-center gap-2">
            {motorizados.map((m, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-gray20 rounded-full text-xs font-medium"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      )}
    </Cardx>
  );
}
