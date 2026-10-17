'use client';

import React, { Suspense } from 'react';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { PageHeader, EyebrowBadge } from '@/components/layout/PageHeader';
import { BahanSection } from '@/components/ops/cost-profit/BahanSection';
import { COST_PROFIT_TABS, CostProfitTabs, panelId, tabId } from '@/components/ops/cost-profit/CostProfitTabs';
import { KategoriSection } from '@/components/ops/cost-profit/KategoriSection';
import { MarkupSection } from '@/components/ops/cost-profit/MarkupSection';
import { ProfitCalculator } from '@/components/ops/cost-profit/ProfitCalculator';
import { useOpsData } from '@/context/OpsDataContext';
import { useCostProfitData } from '@/hooks/useCostProfitData';

function CostProfitContent() {
  const [tab, setTab] = useQueryState('tab', parseAsStringLiteral(COST_PROFIT_TABS).withDefault('kalkulator'));
  const { kategoriList } = useOpsData();
  const { bahanList, markupList, state, error, retry } = useCostProfitData();
  const loading = state === 'loading';

  return (
    <>
      <PageHeader
        eyebrow={<EyebrowBadge>Produksi</EyebrowBadge>}
        title="Cost & Profit"
        subtitle="Hitung estimasi harga jual dan profit per bahan, lalu kelola kategori, harga modal bahan, dan aturan markup yang dipakai kalkulator."
      />

      <CostProfitTabs value={tab} onChange={(next) => void setTab(next)} />

      {state === 'error' && (
        <div role="alert" className="flex flex-col gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-900 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> Gagal memuat data Cost & Profit{error ? ` (${error})` : ''}.
          </span>
          <button
            type="button"
            onClick={retry}
            className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 font-bold text-rose-800 hover:bg-rose-100 sm:h-10"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Coba lagi
          </button>
        </div>
      )}

      {state !== 'error' && (
        <div role="tabpanel" id={panelId(tab)} aria-labelledby={tabId(tab)} className="space-y-4 sm:space-y-6">
          {tab === 'kalkulator' ? (
            <ProfitCalculator
              kategoriList={kategoriList}
              bahanList={bahanList}
              markupList={markupList}
              loading={loading}
              onOpenDatabase={() => void setTab('database')}
            />
          ) : (
            <>
              <KategoriSection kategoriList={kategoriList} bahanList={bahanList} loading={loading} />
              <BahanSection bahanList={bahanList} kategoriList={kategoriList} loading={loading} />
              <MarkupSection markupList={markupList} loading={loading} />
            </>
          )}
        </div>
      )}
    </>
  );
}

export default function CostProfitPage() {
  return (
    <Suspense fallback={null}>
      <CostProfitContent />
    </Suspense>
  );
}
