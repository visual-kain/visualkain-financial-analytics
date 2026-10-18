'use client';

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
import ProduksiPage from '@/app/(ops)/produksi/page';
import CostProfitPage from '@/app/(ops)/cost-profit/page';
import KalenderPage from '@/app/(ops)/kalender/page';
import VendorPage from '@/app/(ops)/vendor/page';
import { FinanceReportView } from '@/components/finance/FinanceReportView';
import { mapFinanceOrderDoc } from '@/lib/finance-order-mapper';
import { fixtureKategori, fixtureOrders, fixtureSizeCharts, fixtureVendors } from '@/test/fixtures/ops-fixtures';

// Promise dibuat sekali; `use()` dengan promise baru tiap render akan suspend terus-menerus.
const TECHPACK_PARAMS = Promise.resolve({ id: 'fx-1' });
const DATA = { orders: fixtureOrders, sizeCharts: fixtureSizeCharts, kategoriList: fixtureKategori, vendors: fixtureVendors };

/**
 * Pratinjau layar operasional dengan data fiktif untuk QA visual tanpa login (hanya `next dev`).
 * Contoh: /dev-preview/data-customer, /dev-preview/detail, /dev-preview/form, /dev-preview/invoice?order=fx-1, /dev-preview/report.
 */
export function DevPreviewScreen({ screen }: { screen: string }) {
  // Laporan finansial dirender di luar AppShell, sama dengan halaman /finance/report/[id].
  if (screen === 'report') {
    const vendorName = (id: string) => fixtureVendors.find((v) => v.id === id)?.nama;
    const order = mapFinanceOrderDoc(fixtureOrders[0].id, fixtureOrders[0] as Record<string, unknown>, vendorName);
    return <FinanceReportView order={order} getVendorById={(id) => fixtureVendors.find((v) => v.id === id)} onBack={() => undefined} onPrint={() => window.print()} />;
  }

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
    produksi: <ProduksiPage />,
    'cost-profit': <CostProfitPage />,
    kalender: <KalenderPage />,
    vendor: <VendorPage />,
  };
  const content = screens[screen];
  if (!content) notFound();

  return (
    <OpsDataFixtureProvider data={DATA}>
      <AppShell>{content}</AppShell>
    </OpsDataFixtureProvider>
  );
}
