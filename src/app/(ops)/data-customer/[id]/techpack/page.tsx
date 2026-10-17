'use client';

import { use } from 'react';
import { Printer } from 'lucide-react';
import { PageHeader, EyebrowBadge } from '@/components/layout/PageHeader';
import { OrderLoader } from '@/components/ops/data-customer/OrderLoader';
import { PaperViewport, PrintPortal, printWithTitle } from '@/components/legacy/PaperViewport';
import TechPackPaper from '@/components/legacy/TechPackPaper';
import { useOpsData } from '@/context/OpsDataContext';
import type { LegacyOrder } from '@/lib/legacy/types';

function TechpackView({ order }: { order: LegacyOrder }) {
  const { getSizeChart } = useOpsData();
  const sizeChart = getSizeChart(order.sizeChartId);
  return (
    <>
      <PageHeader
        backHref={`/data-customer/${order.id}`}
        backLabel="Detail Order"
        eyebrow={<EyebrowBadge>{order.noInv}</EyebrowBadge>}
        title="Tech Pack"
        subtitle={`Production sheet ${order.namaCustomer}${order.namaProject ? ` • ${order.namaProject}` : ''}. Tampilan kertas sama dengan VisualKainDB.`}
        actions={
          <button
            type="button"
            onClick={() => printWithTitle(`TechPack_${order.noInv}_${order.namaCustomer}`)}
            className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-teal-700 sm:h-10 sm:w-auto"
          >
            <Printer className="h-4 w-4" /> Cetak Tech Pack
          </button>
        }
      />
      <PaperViewport>
        <TechPackPaper order={order} sizeChart={sizeChart} />
      </PaperViewport>
      <PrintPortal>
        <TechPackPaper order={order} sizeChart={sizeChart} />
      </PrintPortal>
    </>
  );
}

export default function TechpackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <OrderLoader orderId={id}>{(order) => <TechpackView order={order} />}</OrderLoader>;
}
