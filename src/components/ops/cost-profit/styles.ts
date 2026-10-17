const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40';

export const BTN_PRIMARY = `inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-teal-700 bg-teal-600 px-4 text-xs font-medium text-white shadow-btn-primary transition-colors hover:bg-teal-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 ${FOCUS}`;

export const BTN_SECONDARY = `inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 text-xs font-medium text-slate-700 shadow-btn-secondary transition-colors hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 ${FOCUS}`;

export const BTN_EDIT = `inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3.5 text-xs font-medium text-teal-800 shadow-btn-secondary transition-colors hover:bg-teal-100 sm:h-10 ${FOCUS}`;

export const BTN_DANGER_SOFT = `inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 text-xs font-medium text-rose-700 shadow-btn-secondary transition-colors hover:bg-rose-100 sm:h-10 ${FOCUS}`;

export const ICON_BTN_EDIT = `inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-teal-200 bg-teal-50 text-teal-800 transition-colors hover:bg-teal-100 sm:h-10 sm:w-10 ${FOCUS}`;

export const ICON_BTN_DANGER = `inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 transition-colors hover:bg-rose-100 sm:h-10 sm:w-10 ${FOCUS}`;

export const FIELD_INPUT =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-semibold text-slate-900 transition-colors placeholder:font-normal placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 aria-[invalid=true]:border-rose-400 sm:h-10 sm:text-xs';

export const FIELD_LABEL = 'mb-1.5 block text-xs font-bold text-slate-700';

export const FIELD_ERROR = 'mt-1 text-[11px] font-semibold text-rose-600';

export const CARD = 'rounded-2xl border border-slate-200/90 bg-white shadow-card-double';
