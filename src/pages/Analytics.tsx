import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  Crown,
  IndianRupee,
  Loader2,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
  Utensils,
  WalletCards,
  XCircle,
  Zap,
} from "lucide-react";

import { getAdminAnalytics } from "../services/api";

interface DailyTrend {
  date: string;
  label: string;
  orders: number;
  revenue: number;
}

interface BestDay {
  date: string;
  label: string;
  orders: number;
  revenue: number;
}

interface ChefAnalytics {
  id?: string;
  chef_id?: string;
  name?: string;
  chef_name?: string;
  orders?: number;
  revenue?: number;
  active_orders?: number;
}

interface TomorrowSpecialAnalytics {
  id?: string;
  chef_id?: string;
  chef_name?: string;
  special_date?: string;
  dish_name?: string;
  orders?: number;
  preorder_orders?: number;
  revenue?: number;
  preorders?: number;
}

interface AnalyticsResponse {
  success: boolean;

  period: {
    days: number;
    start: string;
    end: string;
    generated_at?: string;
  };

  overview: {
    revenue: number;
    revenue_growth: number;

    orders: number;
    orders_growth: number;

    average_order_value: number;

    customers: number;
    active_customers: number;
    new_customers: number;

    active_subscriptions: number;
    new_subscriptions: number;

    chefs?: number;
    active_chefs?: number;
  };

  orders: {
    total: number;
    pending: number;
    preparing: number;
    out_for_delivery: number;
    delivered: number;
    cancelled: number;
  };

  revenue: {
    current: number;
    previous: number;
    growth: number;
  };

  status_breakdown: {
    pending: number;
    preparing: number;
    out_for_delivery: number;
    delivered: number;
    cancelled: number;
  };

  payment_breakdown: {
    cod: number;
    upi: number;
    card: number;
    other: number;
  };

  daily_trend: DailyTrend[];

  best_day: BestDay | null;

  subscription_health?: {
    active?: number;
    expiring_soon?: number;
    expired?: number;
    paused?: number;
  };

  subscriptions?: {
    active?: number;
    new?: number;
    expiring_soon?: number;
    expired?: number;
    paused?: number;
  };

  diet?: {
    on?: number;
    off?: number;
  };

  diet_summary?: {
    on?: number;
    off?: number;
  };

  chefs_data?: ChefAnalytics[];
  chef_performance?: ChefAnalytics[];
  chefs_performance?: ChefAnalytics[];

  tomorrow_special?: {
    total?: number;
    chefs?: number;
    preorders?: number;
    revenue?: number;
    items?: TomorrowSpecialAnalytics[];
  };

  tomorrow_specials?: {
    total?: number;
    chefs?: number;
    preorders?: number;
    revenue?: number;
    items?: TomorrowSpecialAnalytics[];
  };
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  growth?: number;
  iconClassName?: string;
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  growth,
  iconClassName = "bg-slate-100 text-slate-700",
}: MetricCardProps) {
  const positive = typeof growth === "number" && growth >= 0;

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-slate-50 transition-transform duration-500 group-hover:scale-150" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            {title}
          </p>

          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-2xl font-black tracking-tight text-slate-900">
              {value}
            </h3>
          </div>

          <div className="mt-2 flex items-center gap-2">
            {typeof growth === "number" ? (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${
                  positive
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-rose-50 text-rose-600"
                }`}
              >
                {positive ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {Math.abs(growth).toFixed(1)}%
              </span>
            ) : null}

            <span className="text-xs text-slate-400">{subtitle}</span>
          </div>
        </div>

        <div
          className={`relative flex h-11 w-11 items-center justify-center rounded-2xl ${iconClassName}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(Number(value || 0));
}

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getGrowthLabel(value: number) {
  if (value > 0) return `+${value.toFixed(1)}%`;
  if (value < 0) return `${value.toFixed(1)}%`;
  return "0%";
}

function getStatusLabel(status: string) {
  switch (status) {
    case "pending":
      return "Pending";
    case "preparing":
      return "Preparing";
    case "out_for_delivery":
      return "Out for delivery";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "delivered":
      return CheckCircle2;
    case "cancelled":
      return XCircle;
    case "preparing":
      return Utensils;
    case "out_for_delivery":
      return Activity;
    default:
      return Clock3;
  }
}

export default function Analytics() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(
    async (showRefresh = false) => {
      try {
        setError("");

        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await getAdminAnalytics({ days });

        setData(response as AnalyticsResponse);
      } catch (err: any) {
        console.error("Analytics loading error:", err);

        setError(
          err?.message ||
            err?.detail ||
            "Unable to load analytics right now."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [days]
  );

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const trend = useMemo(() => {
    return data?.daily_trend || [];
  }, [data]);

  const maxRevenue = useMemo(() => {
    if (!trend.length) return 1;

    return Math.max(
      ...trend.map((item) => Number(item.revenue || 0)),
      1
    );
  }, [trend]);

  const maxOrders = useMemo(() => {
    if (!trend.length) return 1;

    return Math.max(
      ...trend.map((item) => Number(item.orders || 0)),
      1
    );
  }, [trend]);

  const statusData = useMemo(() => {
    if (!data) return [];

    return [
      {
        key: "pending",
        label: "Pending",
        value: data.status_breakdown?.pending || 0,
        icon: Clock3,
        className: "bg-amber-50 text-amber-600",
      },
      {
        key: "preparing",
        label: "Preparing",
        value: data.status_breakdown?.preparing || 0,
        icon: Utensils,
        className: "bg-blue-50 text-blue-600",
      },
      {
        key: "out_for_delivery",
        label: "Out for delivery",
        value: data.status_breakdown?.out_for_delivery || 0,
        icon: Activity,
        className: "bg-violet-50 text-violet-600",
      },
      {
        key: "delivered",
        label: "Delivered",
        value: data.status_breakdown?.delivered || 0,
        icon: CheckCircle2,
        className: "bg-emerald-50 text-emerald-600",
      },
      {
        key: "cancelled",
        label: "Cancelled",
        value: data.status_breakdown?.cancelled || 0,
        icon: XCircle,
        className: "bg-rose-50 text-rose-600",
      },
    ];
  }, [data]);

  const paymentData = useMemo(() => {
    if (!data) return [];

    const breakdown = data.payment_breakdown || {
      cod: 0,
      upi: 0,
      card: 0,
      other: 0,
    };

    const total =
      breakdown.cod +
      breakdown.upi +
      breakdown.card +
      breakdown.other;

    return [
      {
        label: "Cash on Delivery",
        short: "COD",
        value: breakdown.cod,
        percentage: total ? (breakdown.cod / total) * 100 : 0,
        icon: WalletCards,
      },
      {
        label: "UPI / Online",
        short: "UPI",
        value: breakdown.upi,
        percentage: total ? (breakdown.upi / total) * 100 : 0,
        icon: CreditCard,
      },
      {
        label: "Card",
        short: "Card",
        value: breakdown.card,
        percentage: total ? (breakdown.card / total) * 100 : 0,
        icon: CreditCard,
      },
      {
        label: "Other",
        short: "Other",
        value: breakdown.other,
        percentage: total ? (breakdown.other / total) * 100 : 0,
        icon: WalletCards,
      },
    ];
  }, [data]);

  const chefData = useMemo(() => {
    if (!data) return [];

    return (
      data.chef_performance ||
      data.chefs_performance ||
      data.chefs_data ||
      []
    )
      .slice()
      .sort(
        (a, b) =>
          Number(b.revenue || 0) - Number(a.revenue || 0)
      )
      .slice(0, 5);
  }, [data]);

  const specialData = useMemo(() => {
    if (!data) return null;

    return data.tomorrow_special || data.tomorrow_specials || null;
  }, [data]);

  const subscriptionData = useMemo(() => {
    if (!data) {
      return {
        active: 0,
        new: 0,
        expiring: 0,
        expired: 0,
        paused: 0,
      };
    }

    const source =
      data.subscription_health || data.subscriptions || {};

    return {
      active: Number(source.active || data.overview.active_subscriptions || 0),
      new: Number(source.new || data.overview.new_subscriptions || 0),
      expiring: Number(source.expiring_soon || 0),
      expired: Number(source.expired || 0),
      paused: Number(source.paused || 0),
    };
  }, [data]);

  const dietData = useMemo(() => {
    if (!data) {
      return { on: 0, off: 0 };
    }

    const source = data.diet_summary || data.diet || {};

    return {
      on: Number(source.on || 0),
      off: Number(source.off || 0),
    };
  }, [data]);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Loading analytics
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Preparing your business performance dashboard...
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-3xl border border-slate-200 bg-white"
            />
          ))}
        </div>

        <div className="h-[420px] animate-pulse rounded-3xl border border-slate-200 bg-white" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="max-w-md rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50">
            <XCircle className="h-8 w-8 text-rose-500" />
          </div>

          <h2 className="mt-5 text-xl font-bold text-slate-900">
            Analytics unavailable
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error}
          </p>

          <button
            onClick={() => loadAnalytics(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const overview = data.overview;

  return (
    <div className="space-y-6 pb-10">
      {/* =========================================================
          HEADER
      ========================================================= */}
      <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-orange-50" />
        <div className="absolute -bottom-24 right-24 h-44 w-44 rounded-full bg-slate-50" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-orange-600">
                <Sparkles className="h-3.5 w-3.5" />
                Business Intelligence
              </span>

              <span className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-600 sm:inline-flex">
                Live data
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-tight text-slate-950">
              Analytics
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Understand revenue, orders, customers, subscriptions and
              operational performance from one place.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(data.period.start)} —{" "}
                {formatDate(data.period.end)}
              </span>

              {data.period.generated_at ? (
                <>
                  <span>•</span>
                  <span>
                    Updated {formatDate(data.period.generated_at)}
                  </span>
                </>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-orange-300 focus:bg-white"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={180}>Last 180 days</option>
                <option value={365}>Last 365 days</option>
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            <button
              onClick={() => loadAnalytics(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================
          ERROR BANNER
      ========================================================= */}
      {error ? (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <XCircle className="h-5 w-5 shrink-0 text-rose-500" />

            <p className="text-sm font-medium text-rose-700">
              {error}
            </p>
          </div>

          <button
            onClick={() => loadAnalytics(true)}
            className="shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-bold text-rose-600 shadow-sm"
          >
            Retry
          </button>
        </div>
      ) : null}

      {/* =========================================================
          KPI CARDS
      ========================================================= */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Revenue"
          value={formatCurrency(overview.revenue)}
          subtitle="vs previous period"
          icon={IndianRupee}
          growth={overview.revenue_growth}
          iconClassName="bg-orange-50 text-orange-600"
        />

        <MetricCard
          title="Orders"
          value={formatNumber(overview.orders)}
          subtitle="completed activity"
          icon={ShoppingBag}
          growth={overview.orders_growth}
          iconClassName="bg-blue-50 text-blue-600"
        />

        <MetricCard
          title="Customers"
          value={formatNumber(overview.customers)}
          subtitle={`${formatNumber(
            overview.new_customers
          )} new in period`}
          icon={Users}
          iconClassName="bg-violet-50 text-violet-600"
        />

        <MetricCard
          title="Avg. Order Value"
          value={formatCurrency(overview.average_order_value)}
          subtitle="average per order"
          icon={TrendingUp}
          iconClassName="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* =========================================================
          SECONDARY KPI ROW
      ========================================================= */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Customers
              </p>

              <p className="mt-2 text-2xl font-black text-slate-900">
                {formatNumber(overview.active_customers)}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{
                width: `${
                  overview.customers
                    ? Math.min(
                        100,
                        (overview.active_customers /
                          overview.customers) *
                          100
                      )
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Subscriptions
              </p>

              <p className="mt-2 text-2xl font-black text-slate-900">
                {formatNumber(overview.active_subscriptions)}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50">
              <Crown className="h-5 w-5 text-orange-600" />
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-400">
            +{formatNumber(overview.new_subscriptions)} new in selected
            period
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Chefs
              </p>

              <p className="mt-2 text-2xl font-black text-slate-900">
                {formatNumber(
                  overview.active_chefs ?? overview.chefs ?? 0
                )}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50">
              <Utensils className="h-5 w-5 text-blue-600" />
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-400">
            Chef network performance
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Best Day
              </p>

              <p className="mt-2 text-xl font-black text-slate-900">
                {data.best_day?.label || "—"}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50">
              <Zap className="h-5 w-5 text-violet-600" />
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-400">
            {data.best_day
              ? `${formatCurrency(
                  data.best_day.revenue
                )} revenue`
              : "No revenue data"}
          </p>
        </div>
      </div>

      {/* =========================================================
          REVENUE CHART
      ========================================================= */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                <BarChart3 className="h-5 w-5 text-orange-600" />
              </div>

              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Revenue performance
                </h2>

                <p className="text-xs text-slate-400">
                  Daily revenue for selected period
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 px-4 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Current period
            </p>

            <p className="mt-0.5 text-sm font-black text-slate-900">
              {formatCurrency(data.revenue.current)}
            </p>
          </div>
        </div>

        <div className="mt-8 overflow-x-auto pb-2">
          <div
            className="flex min-w-[700px] items-end gap-2"
            style={{ height: 300 }}
          >
            {trend.map((item, index) => {
              const height =
                (Number(item.revenue || 0) / maxRevenue) * 230;

              return (
                <div
                  key={`${item.date}-${index}`}
                  className="group flex min-w-[22px] flex-1 flex-col items-center justify-end"
                >
                  <div className="relative mb-2 w-full">
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white shadow-xl group-hover:block">
                      {formatCurrency(item.revenue)}
                    </div>

                    <div
                      className="mx-auto w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-orange-500 to-orange-300 transition-all duration-300 group-hover:from-orange-600 group-hover:to-orange-400"
                      style={{
                        height: `${Math.max(height, 4)}px`,
                      }}
                    />
                  </div>

                  <span className="max-w-[50px] truncate text-[9px] font-semibold text-slate-400">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5 sm:grid-cols-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Current
            </p>
            <p className="mt-1 text-sm font-black text-slate-900">
              {formatCurrency(data.revenue.current)}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Previous
            </p>
            <p className="mt-1 text-sm font-black text-slate-900">
              {formatCurrency(data.revenue.previous)}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Growth
            </p>
            <p
              className={`mt-1 text-sm font-black ${
                data.revenue.growth >= 0
                  ? "text-emerald-600"
                  : "text-rose-600"
              }`}
            >
              {getGrowthLabel(data.revenue.growth)}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              AOV
            </p>
            <p className="mt-1 text-sm font-black text-slate-900">
              {formatCurrency(overview.average_order_value)}
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================
          ORDER TREND + STATUS
      ========================================================= */}
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Order activity
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Daily order volume
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-600">
              {formatNumber(data.orders.total)} orders
            </div>
          </div>

          <div className="mt-7 space-y-3">
            {trend.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-slate-400">
                No order activity found.
              </div>
            ) : (
              trend.map((item) => {
                const width =
                  (Number(item.orders || 0) / maxOrders) * 100;

                return (
                  <div key={item.date} className="flex items-center gap-3">
                    <span className="w-12 shrink-0 text-[10px] font-semibold text-slate-400">
                      {item.label}
                    </span>

                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full min-w-[2px] rounded-full bg-slate-800 transition-all duration-500"
                        style={{
                          width: `${Math.max(width, 1)}%`,
                        }}
                      />
                    </div>

                    <span className="w-8 text-right text-xs font-bold text-slate-600">
                      {item.orders}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Order status
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Current period distribution
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {statusData.map((item) => {
              const percentage = data.orders.total
                ? (item.value / data.orders.total) * 100
                : 0;

              const Icon = item.icon;

              return (
                <div
                  key={item.key}
                  className="rounded-2xl border border-slate-100 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.className}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-700">
                          {item.label}
                        </p>

                        <span className="text-xs font-black text-slate-900">
                          {item.value}
                        </span>
                      </div>

                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-700"
                          style={{
                            width: `${Math.min(
                              100,
                              percentage
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================
          PAYMENT + SUBSCRIPTIONS
      ========================================================= */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
              <CreditCard className="h-5 w-5 text-violet-600" />
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-900">
                Payment mix
              </h2>

              <p className="text-xs text-slate-400">
                How customers are paying
              </p>
            </div>
          </div>

          <div className="mt-7 space-y-5">
            {paymentData.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-slate-400" />

                      <span className="text-xs font-bold text-slate-600">
                        {item.label}
                      </span>
                    </div>

                    <span className="text-xs font-black text-slate-900">
                      {formatNumber(item.value)}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-violet-500 transition-all duration-700"
                      style={{
                        width: `${item.percentage}%`,
                      }}
                    />
                  </div>

                  <p className="mt-1 text-right text-[10px] font-semibold text-slate-400">
                    {item.percentage.toFixed(1)}%
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
              <Crown className="h-5 w-5 text-orange-600" />
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-900">
                Subscription health
              </h2>

              <p className="text-xs text-slate-400">
                Subscriber lifecycle overview
              </p>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                Active
              </p>

              <p className="mt-2 text-2xl font-black text-emerald-700">
                {formatNumber(subscriptionData.active)}
              </p>
            </div>

            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                New
              </p>

              <p className="mt-2 text-2xl font-black text-blue-700">
                {formatNumber(subscriptionData.new)}
              </p>
            </div>

            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                Expiring Soon
              </p>

              <p className="mt-2 text-2xl font-black text-amber-700">
                {formatNumber(subscriptionData.expiring)}
              </p>
            </div>

            <div className="rounded-2xl bg-rose-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                Expired
              </p>

              <p className="mt-2 text-2xl font-black text-rose-700">
                {formatNumber(subscriptionData.expired)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          DIET + TOMORROW SPECIAL
      ========================================================= */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                <Utensils className="h-5 w-5 text-emerald-600" />
              </div>

              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Diet preference
                </h2>

                <p className="text-xs text-slate-400">
                  Subscriber diet status
                </p>
              </div>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Live
            </span>
          </div>

          <div className="mt-7 flex items-center gap-5">
            <div className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-slate-100">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(
                    rgb(16 185 129) ${
                      dietData.on +
                      dietData.off
                        ? (dietData.on /
                            (dietData.on +
                              dietData.off)) *
                          100
                        : 0
                    }%
                  , rgb(226 232 240) 0
                  )`,
                }}
              />

              <div className="relative flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white">
                <span className="text-2xl font-black text-slate-900">
                  {dietData.on + dietData.off
                    ? Math.round(
                        (dietData.on /
                          (dietData.on +
                            dietData.off)) *
                          100
                      )
                    : 0}
                  %
                </span>

                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Diet ON
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-400">
                  Diet ON
                </p>

                <p className="mt-1 text-xl font-black text-emerald-600">
                  {formatNumber(dietData.on)}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400">
                  Diet OFF
                </p>

                <p className="mt-1 text-xl font-black text-slate-700">
                  {formatNumber(dietData.off)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                <Sparkles className="h-5 w-5 text-orange-600" />
              </div>

              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Tomorrow Special
                </h2>

                <p className="text-xs text-slate-400">
                  Upcoming special meal performance
                </p>
              </div>
            </div>

            <span className="rounded-full bg-orange-50 px-3 py-1.5 text-[10px] font-bold text-orange-600">
              Tomorrow
            </span>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Specials
              </p>

              <p className="mt-2 text-2xl font-black text-slate-900">
                {formatNumber(specialData?.total || 0)}
              </p>
            </div>

            <div className="rounded-2xl bg-orange-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                Chefs
              </p>

              <p className="mt-2 text-2xl font-black text-orange-700">
                {formatNumber(specialData?.chefs || 0)}
              </p>
            </div>

            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                Preorders
              </p>

              <p className="mt-2 text-2xl font-black text-blue-700">
                {formatNumber(specialData?.preorders || 0)}
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                Revenue
              </p>

              <p className="mt-2 text-xl font-black text-emerald-700">
                {formatCurrency(specialData?.revenue || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          CHEF PERFORMANCE
      ========================================================= */}
      {chefData.length > 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <Utensils className="h-5 w-5 text-blue-600" />
              </div>

              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Chef performance
                </h2>

                <p className="text-xs text-slate-400">
                  Top performing chefs by revenue
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold text-slate-400">
              Top 5
            </span>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[650px]">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="pb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Chef
                  </th>

                  <th className="pb-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Orders
                  </th>

                  <th className="pb-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Revenue
                  </th>

                  <th className="pb-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Active Orders
                  </th>
                </tr>
              </thead>

              <tbody>
                {chefData.map((chef, index) => (
                  <tr
                    key={
                      chef.id ||
                      chef.chef_id ||
                      `${chef.name}-${index}`
                    }
                    className="border-b border-slate-50 last:border-0"
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-600">
                          {index + 1}
                        </div>

                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {chef.name ||
                              chef.chef_name ||
                              "Chef"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 text-right text-sm font-bold text-slate-700">
                      {formatNumber(chef.orders || 0)}
                    </td>

                    <td className="py-4 text-right text-sm font-black text-slate-900">
                      {formatCurrency(chef.revenue || 0)}
                    </td>

                    <td className="py-4 text-right">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600">
                        {formatNumber(
                          chef.active_orders || 0
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* =========================================================
          BUSINESS INSIGHTS
      ========================================================= */}
      <div className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white shadow-xl sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <Sparkles className="h-5 w-5 text-white" />
          </div>

          <div>
            <h2 className="text-lg font-black">
              Business insights
            </h2>

            <p className="text-xs text-slate-400">
              Quick read on your current performance
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Revenue trend
            </p>

            <p className="mt-2 text-lg font-black">
              {data.revenue.growth >= 0
                ? "Business is growing"
                : "Revenue needs attention"}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {getGrowthLabel(data.revenue.growth)} compared with the
              previous period.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Delivery health
            </p>

            <p className="mt-2 text-lg font-black">
              {data.orders.total
                ? `${Math.round(
                    (data.orders.delivered /
                      data.orders.total) *
                      100
                  )}% delivered`
                : "No orders yet"}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Based on all orders in the selected period.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Customer base
            </p>

            <p className="mt-2 text-lg font-black">
              {formatNumber(overview.active_customers)} active
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {formatNumber(overview.new_customers)} customers joined
              during this period.
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================
          FOOTER
      ========================================================= */}
      <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>

          <p className="text-xs font-medium text-slate-500">
            Analytics are calculated from your admin business data.
          </p>
        </div>

        <p className="text-[11px] font-semibold text-slate-400">
          {data.period.days} day reporting window
        </p>
      </div>
    </div>
  );
}