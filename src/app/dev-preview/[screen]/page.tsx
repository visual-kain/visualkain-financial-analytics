'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { OpsDataFixtureProvider } from '@/context/OpsDataContext';
import { OrderDetailView } from '@/components/ops/data-customer/OrderDetailView';
import { OrderForm } from '@/components/ops/data-customer/OrderForm';
import DataCustomerPage from '@/app/(ops)/data-customer/page';
import InvoicePage from '@/app/(ops)/invoice/page';
import SizeChartPage from '@/app/(ops)/size-chart/page';
import TechpackPage from '@/app/(ops)/data-customer/[id]/techpack/page';
import KerjasamaListPage from '@/app/(ops)/kerjasama/page';
import KerjasamaNewPage from '@/app/(ops)/kerjasama/new/page';
import PenawaranNewPage from '@/app/(ops)/penawaran/new/page';
import PurchaseOrderPage from '@/app/(ops)/purchase-order/page';
import { fixtureKategori, fixtureOrders, fixtureSizeCharts, fixtureVendors } from '@/test/fixtures/ops-fixtures';

// Promise dibuat sekali; `use()` dengan promise baru tiap render akan suspend terus-menerus.
const TECHPACK_PARAMS = Promise.resolve({ id: 'fx-1' });
const DATA = { orders: fixtureOrders, sizeCharts: fixtureSizeCharts, kategoriList: fixtureKategori, vendors: fixtureVendors };

/**
 * Pratinjau layar operasional dengan data fiktif untuk QA visual tanpa login (hanya `next dev`).
 * Contoh: /dev-preview/data-customer, /dev-preview/detail, /dev-preview/form, /dev-preview/invoice?order=fx-1.
 */
export default function DevPreviewPage({ params }: { params: Promise<{ screen: string }> }) {
  const { screen } = use(params);
  if (process.env.NODE_ENV !== 'development') notFound();

  const screens: Record<string, React.ReactNode> = {
    'data-customer': <DataCustomerPage />,
    detail: <OrderDetailView order={fixtureOrders[0]} />,
    'detail-minus': <OrderDetailView order={fixtureOrders[1]} />,
    form: <OrderForm mode="edit" order={fixtureOrders[0]} />,
    'form-new': <OrderForm mode="create" />,
    techpack: <TechpackPage params={TECHPACK_PARAMS} />,
    invoice: <InvoicePage />,
    'size-chart': <SizeChartPage />,
    kerjasama: <KerjasamaListPage />,
    'kerjasama-new': <KerjasamaNewPage />,
    'penawaran-new': <PenawaranNewPage />,
    'purchase-order': <PurchaseOrderPage />,
  };
  const content = screens[screen];
  if (!content) notFound();

  return (
    <OpsDataFixtureProvider data={DATA}>
      <AppShell>{content}</AppShell>
    </OpsDataFixtureProvider>
  );
}
