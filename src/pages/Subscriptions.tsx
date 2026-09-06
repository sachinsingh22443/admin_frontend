import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Users,
  Utensils,
  Search,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Loader2,
  X,
  UserRound,
  Phone,
  Mail,
  ChefHat,
  Clock,
  
  CheckCircle,
  Power,
  Coffee,
} from "lucide-react";

import {
  getAdminSubscriptions,
  updateAdminSubscriptionStatus,
  updateAdminSubscriptionDiet,
  updateAdminSubscriptionBreakfast,
} from "../services/api";

interface Subscription {
  id: string;

  customer_id?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;

  chef_id?: string | null;

  plan?: string | null;
  plan_type?: string | null;

  duration_days?: number;

  start_date?: string | null;
  end_date?: string | null;

  status?: string | null;
  price?: number;

  delivery_time?: string | null;
  delivery_days?: string[];

  meals_per_day?: number;

  breakfast_enabled?: boolean;
  breakfast_price?: number;

  diet_on?: boolean;
}

interface SubscriptionResponse {
  success: boolean;
  total: number;
  subscriptions: Subscription[];
}

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);

  const [updating, setUpdating] = useState<
    "subscription" | "diet" | "breakfast" | null
  >(null);

  // =========================================================
  // LOAD SUBSCRIPTIONS
  // =========================================================

  const loadSubscriptions = async (
    showRefresh = false
  ) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response =
        (await getAdminSubscriptions()) as SubscriptionResponse;

      if (!response?.success) {
        throw new Error("Unable to load subscriptions");
      }

      const data = Array.isArray(response.subscriptions)
        ? response.subscriptions
        : [];

      setSubscriptions(data);

      // Keep opened customer details updated
      setSelectedSubscription((current) => {
        if (!current) return null;

        return (
          data.find(
            (item) => item.id === current.id
          ) || null
        );
      });
    } catch (err: any) {
      console.error(
        "ADMIN SUBSCRIPTIONS ERROR:",
        err
      );

      setError(
        err?.message ||
          "Failed to load subscriptions"
      );

      setSubscriptions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredSubscriptions = useMemo(() => {
    const value = search
      .trim()
      .toLowerCase();

    if (!value) {
      return subscriptions;
    }

    return subscriptions.filter(
      (subscription) => {
        return (
          String(
            subscription.customer_name || ""
          )
            .toLowerCase()
            .includes(value) ||

          String(
            subscription.customer_phone || ""
          )
            .toLowerCase()
            .includes(value) ||

          String(
            subscription.customer_email || ""
          )
            .toLowerCase()
            .includes(value) ||

          String(
            subscription.plan || ""
          )
            .toLowerCase()
            .includes(value) ||

          String(
            subscription.plan_type || ""
          )
            .toLowerCase()
            .includes(value)
        );
      }
    );
  }, [subscriptions, search]);

  // =========================================================
  // STATS
  // =========================================================

  const activeSubscriptions =
    subscriptions.filter(
      (subscription) =>
        String(subscription.status).toLowerCase() ===
        "active"
    ).length;

  const totalSubscriptionDays =
    subscriptions.reduce(
      (total, subscription) =>
        total +
        Number(
          subscription.duration_days || 0
        ),
      0
    );

  const dietOn =
    subscriptions.filter(
      (subscription) =>
        subscription.diet_on === true
    ).length;

  const dietOff =
    subscriptions.length - dietOn;

  const breakfastOn =
    subscriptions.filter(
      (subscription) =>
        subscription.breakfast_enabled === true
    ).length;

  // =========================================================
  // DATE FORMAT
  // =========================================================

  const formatDate = (
    value?: string | null
  ) => {
    if (!value) return "—";

    try {
      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return String(value);
      }

      return date.toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    } catch {
      return String(value);
    }
  };

  // =========================================================
  // PRICE
  // =========================================================

  const formatPrice = (
    value?: number
  ) => {
    return `₹${Number(value || 0).toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 2,
      }
    )}`;
  };

  // =========================================================
  // STATUS CLASS
  // =========================================================

  const getStatusClass = (
    status?: string | null
  ) => {
    switch (
      String(status || "").toLowerCase()
    ) {
      case "active":
        return "bg-green-50 text-green-700 border-green-200";

      case "completed":
        return "bg-blue-50 text-blue-700 border-blue-200";

      case "cancelled":
      case "canceled":
        return "bg-red-50 text-red-700 border-red-200";

      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  // =========================================================
  // UPDATE SUBSCRIPTION
  // =========================================================

  // =========================================================
// UPDATE SUBSCRIPTION
// =========================================================

const updateSubscriptionStatus = async (
  subscription: Subscription
) => {
  const isActive =
    String(subscription.status).toLowerCase() ===
    "active";

  try {
    setUpdating("subscription");

    await updateAdminSubscriptionStatus(
  subscription.id,
  isActive ? "inactive" : "active"
);

    // -----------------------------------------------------
    // IMPORTANT:
    // Subscription status and today's diet status
    // are separate things.
    //
    // Do NOT calculate diet_on from subscription status.
    // Backend is the source of truth for diet_on.
    // -----------------------------------------------------

    setSubscriptions((current) =>
      current.map((item) =>
        item.id === subscription.id
          ? {
              ...item,
              status: isActive
                ? "inactive"
                : "active",
            }
          : item
      )
    );

    setSelectedSubscription((current) =>
      current &&
      current.id === subscription.id
        ? {
            ...current,
            status: isActive
              ? "inactive"
              : "active",
          }
        : current
    );

    // -----------------------------------------------------
    // Reload from backend
    // -----------------------------------------------------
    // This makes sure diet_on comes from today's
    // SubscriptionMealSchedule and not frontend guess.
    // -----------------------------------------------------

    await loadSubscriptions(true);

  } catch (err: any) {
    alert(
      err?.message ||
        "Failed to update subscription"
    );
  } finally {
    setUpdating(null);
  }
};
  // =========================================================
  // UPDATE DIET
  // =========================================================

  const updateDiet = async (
    subscription: Subscription
  ) => {
    const newValue =
      !subscription.diet_on;

    try {
      setUpdating("diet");

      await updateAdminSubscriptionDiet(
  subscription.id,
  newValue
);

      setSubscriptions((current) =>
        current.map((item) =>
          item.id === subscription.id
            ? {
                ...item,
                diet_on: newValue,
              }
            : item
        )
      );

      setSelectedSubscription((current) =>
        current &&
        current.id === subscription.id
          ? {
              ...current,
              diet_on: newValue,
            }
          : current
      );
    } catch (err: any) {
      alert(
        err?.message ||
          "Failed to update diet status"
      );
    } finally {
      setUpdating(null);
    }
  };

  // =========================================================
  // UPDATE BREAKFAST
  // =========================================================

  const updateBreakfast = async (
    subscription: Subscription
  ) => {
    const newValue =
      !subscription.breakfast_enabled;

    try {
      setUpdating("breakfast");

      await updateAdminSubscriptionBreakfast(
  subscription.id,
  newValue
);

      setSubscriptions((current) =>
        current.map((item) =>
          item.id === subscription.id
            ? {
                ...item,
                breakfast_enabled: newValue,
              }
            : item
        )
      );

      setSelectedSubscription((current) =>
        current &&
        current.id === subscription.id
          ? {
              ...current,
              breakfast_enabled: newValue,
            }
          : current
      );
    } catch (err: any) {
      alert(
        err?.message ||
          "Failed to update breakfast status"
      );
    } finally {
      setUpdating(null);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Subscriptions
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage customer subscriptions, diet and breakfast
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            loadSubscriptions(true)
          }
          disabled={
            loading || refreshing
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}

          Refresh
        </button>
      </div>

      {/* =====================================================
          STATS
      ===================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Users className="h-6 w-6 text-orange-500" />

          <p className="mt-4 text-sm text-slate-500">
            Active Subscriptions
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {loading
              ? "—"
              : activeSubscriptions}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <CalendarDays className="h-6 w-6 text-blue-500" />

          <p className="mt-4 text-sm text-slate-500">
            Total Subscription Days
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {loading
              ? "—"
              : totalSubscriptionDays}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <ToggleRight className="h-6 w-6 text-green-500" />

          <p className="mt-4 text-sm text-slate-500">
            Diet ON
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {loading ? "—" : dietOn}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <ToggleLeft className="h-6 w-6 text-slate-500" />

          <p className="mt-4 text-sm text-slate-500">
            Diet OFF
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {loading ? "—" : dietOff}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Coffee className="h-6 w-6 text-amber-500" />

          <p className="mt-4 text-sm text-slate-500">
            Breakfast ON
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {loading ? "—" : breakfastOn}
          </p>
        </div>

      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-red-800">
                Unable to load subscriptions
              </p>

              <p className="mt-1 text-sm text-red-600">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                loadSubscriptions(true)
              }
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          SEARCH
      ===================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">

          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search customer, phone, email or plan..."
            className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />

        </div>
      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">
              Subscription List
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {loading
                ? "Loading..."
                : `${filteredSubscriptions.length} subscription${
                    filteredSubscriptions.length === 1
                      ? ""
                      : "s"
                  }`}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1150px]">

            <thead className="bg-slate-50">
              <tr>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Customer
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Plan
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Duration
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Start Date
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  End Date
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Diet
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Price
                </th>

              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">

              {/* LOADING */}

              {loading && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-20 text-center"
                  >
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-500" />

                    <p className="mt-3 text-sm font-medium text-slate-700">
                      Loading subscriptions...
                    </p>
                  </td>
                </tr>
              )}

              {/* EMPTY */}

              {!loading &&
                filteredSubscriptions.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-20 text-center"
                    >
                      <Utensils className="mx-auto h-10 w-10 text-slate-300" />

                      <p className="mt-3 font-medium text-slate-700">
                        {search
                          ? "No matching subscriptions"
                          : "No subscriptions found"}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {search
                          ? "Try a different search."
                          : "Customer subscriptions will appear here."}
                      </p>
                    </td>
                  </tr>
                )}

              {/* DATA */}

              {!loading &&
                filteredSubscriptions.map(
                  (subscription) => (
                    <tr
                      key={subscription.id}
                      onClick={() =>
                        setSelectedSubscription(
                          subscription
                        )
                      }
                      className="cursor-pointer transition hover:bg-orange-50/40"
                    >

                      {/* CUSTOMER */}

                      <td className="px-5 py-4">

                        <div>
                          <p className="font-semibold text-slate-900">
                            {subscription.customer_name ||
                              "Unknown Customer"}
                          </p>

                          {subscription.customer_phone && (
                            <p className="mt-1 text-xs text-slate-500">
                              {subscription.customer_phone}
                            </p>
                          )}

                          {subscription.customer_email && (
                            <p className="mt-0.5 max-w-[220px] truncate text-xs text-slate-400">
                              {subscription.customer_email}
                            </p>
                          )}
                        </div>

                      </td>

                      {/* PLAN */}

                      <td className="px-5 py-4">

                        <p className="font-medium text-slate-900">
                          {subscription.plan ||
                            "Subscription Plan"}
                        </p>

                        {subscription.plan_type && (
                          <p className="mt-1 text-xs capitalize text-slate-400">
                            {subscription.plan_type}
                          </p>
                        )}

                      </td>

                      {/* DURATION */}

                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-700">
                          {subscription.duration_days || 0} days
                        </span>
                      </td>

                      {/* START */}

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {formatDate(
                          subscription.start_date
                        )}
                      </td>

                      {/* END */}

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {formatDate(
                          subscription.end_date
                        )}
                      </td>

                      {/* DIET */}

                      <td className="px-5 py-4">

                        {subscription.diet_on ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                            <ToggleRight className="h-4 w-4" />
                            ON
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                            <ToggleLeft className="h-4 w-4" />
                            OFF
                          </span>
                        )}

                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">

                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(
                            subscription.status
                          )}`}
                        >
                          {subscription.status ||
                            "unknown"}
                        </span>

                      </td>

                      {/* PRICE */}

                      <td className="px-5 py-4">

                        <p className="font-semibold text-slate-900">
                          {formatPrice(
                            subscription.price
                          )}
                        </p>

                        {subscription.breakfast_enabled && (
                          <p className="mt-1 text-xs text-slate-400">
                            Breakfast included
                          </p>
                        )}

                      </td>

                    </tr>
                  )
                )}

            </tbody>

          </table>

        </div>
      </div>

      {/* =====================================================
          SUBSCRIPTION DETAILS MODAL
      ===================================================== */}

      {selectedSubscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">

          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Subscription Details
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Complete customer subscription information
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedSubscription(null)
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            <div className="space-y-6 p-6">

              {/* CUSTOMER */}

              <div className="rounded-2xl border border-slate-200 p-5">

                <div className="flex items-center gap-4">

                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
                    <UserRound className="h-8 w-8 text-orange-500" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {selectedSubscription.customer_name ||
                        "Unknown Customer"}
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      Customer ID:{" "}
                      {selectedSubscription.customer_id ||
                        "—"}
                    </p>
                  </div>

                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">

                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-orange-500" />
                      <span className="text-xs text-slate-500">
                        Phone
                      </span>
                    </div>

                    <p className="mt-2 font-medium text-slate-900">
                      {selectedSubscription.customer_phone ||
                        "—"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-orange-500" />
                      <span className="text-xs text-slate-500">
                        Email
                      </span>
                    </div>

                    <p className="mt-2 break-all font-medium text-slate-900">
                      {selectedSubscription.customer_email ||
                        "—"}
                    </p>
                  </div>

                </div>

              </div>

              {/* PLAN INFORMATION */}

              <div className="rounded-2xl border border-slate-200 p-5">

                <div className="mb-5 flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-orange-500" />

                  <h3 className="font-semibold text-slate-900">
                    Plan Information
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">

                  <div>
                    <p className="text-xs text-slate-400">
                      Plan
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {selectedSubscription.plan ||
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Type
                    </p>

                    <p className="mt-1 font-semibold capitalize text-slate-900">
                      {selectedSubscription.plan_type ||
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Duration
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {selectedSubscription.duration_days ||
                        0}{" "}
                      days
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Price
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {formatPrice(
                        selectedSubscription.price
                      )}
                    </p>
                  </div>

                </div>

              </div>

              {/* DATES / DELIVERY */}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <div className="rounded-2xl border border-slate-200 p-5">

                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-orange-500" />

                    <h3 className="font-semibold text-slate-900">
                      Dates
                    </h3>
                  </div>

                  <div className="mt-4 space-y-3">

                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">
                        Start Date
                      </span>

                      <span className="text-sm font-medium text-slate-900">
                        {formatDate(
                          selectedSubscription.start_date
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">
                        End Date
                      </span>

                      <span className="text-sm font-medium text-slate-900">
                        {formatDate(
                          selectedSubscription.end_date
                        )}
                      </span>
                    </div>

                  </div>

                </div>

                <div className="rounded-2xl border border-slate-200 p-5">

                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />

                    <h3 className="font-semibold text-slate-900">
                      Delivery
                    </h3>
                  </div>

                  <div className="mt-4 space-y-3">

                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">
                        Delivery Time
                      </span>

                      <span className="text-sm font-medium text-slate-900">
                        {selectedSubscription.delivery_time ||
                          "—"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">
                        Meals / Day
                      </span>

                      <span className="text-sm font-medium text-slate-900">
                        {selectedSubscription.meals_per_day ||
                          0}
                      </span>
                    </div>

                  </div>

                </div>

              </div>

              {/* CHEF */}

              <div className="rounded-2xl border border-slate-200 p-5">

                <div className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5 text-orange-500" />

                  <h3 className="font-semibold text-slate-900">
                    Chef
                  </h3>
                </div>

                <p className="mt-3 text-sm text-slate-500">
                  Chef ID
                </p>

                <p className="mt-1 font-medium text-slate-900">
                  {selectedSubscription.chef_id ||
                    "—"}
                </p>

              </div>

              {/* CONTROLS */}

              <div className="rounded-2xl border border-slate-200 p-5">

                <div className="mb-5">
                  <h3 className="font-semibold text-slate-900">
                    Subscription Controls
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    Admin can control this customer's subscription services.
                  </p>
                </div>

                <div className="space-y-4">

                  {/* SUBSCRIPTION */}

                  <div className="flex flex-col gap-4 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-3">

                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white">
                        <Power className="h-5 w-5 text-orange-500" />
                      </div>

                      <div>
                        <p className="font-semibold text-slate-900">
                          Subscription
                        </p>

                        <p className="text-xs text-slate-500">
                          {String(
                            selectedSubscription.status
                          ).toLowerCase() ===
                          "active"
                            ? "Customer subscription is active"
                            : "Customer subscription is inactive"}
                        </p>
                      </div>

                    </div>

                    <button
                      type="button"
                      disabled={
                        updating ===
                        "subscription"
                      }
                      onClick={() =>
                        updateSubscriptionStatus(
                          selectedSubscription
                        )
                      }
                      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        String(
                          selectedSubscription.status
                        ).toLowerCase() ===
                        "active"
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      {updating ===
                      "subscription" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}

                      {String(
                        selectedSubscription.status
                      ).toLowerCase() ===
                      "active"
                        ? "Make Inactive"
                        : "Make Active"}
                    </button>

                  </div>

                  {/* DIET */}

                  <div className="flex flex-col gap-4 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-3">

                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white">
                        {selectedSubscription.diet_on ? (
                          <ToggleRight className="h-6 w-6 text-green-500" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-slate-400" />
                        )}
                      </div>

                      <div>
                        <p className="font-semibold text-slate-900">
                          Diet
                        </p>

                        <p className="text-xs text-slate-500">
                          Diet is currently{" "}
                          {selectedSubscription.diet_on
                            ? "ON"
                            : "OFF"}
                        </p>
                      </div>

                    </div>

                    <button
                      type="button"
                      disabled={
                        updating === "diet"
                      }
                      onClick={() =>
                        updateDiet(
                          selectedSubscription
                        )
                      }
                      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        selectedSubscription.diet_on
                          ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                          : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                      }`}
                    >
                      {updating === "diet" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : selectedSubscription.diet_on ? (
                        <ToggleLeft className="h-4 w-4" />
                      ) : (
                        <ToggleRight className="h-4 w-4" />
                      )}

                      {selectedSubscription.diet_on
                        ? "Turn Diet OFF"
                        : "Turn Diet ON"}
                    </button>

                  </div>

                  {/* BREAKFAST */}

                  <div className="flex flex-col gap-4 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-3">

                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white">
                        <Coffee
                          className={`h-5 w-5 ${
                            selectedSubscription.breakfast_enabled
                              ? "text-amber-500"
                              : "text-slate-400"
                          }`}
                        />
                      </div>

                      <div>
                        <p className="font-semibold text-slate-900">
                          Breakfast
                        </p>

                        <p className="text-xs text-slate-500">
                          {selectedSubscription.breakfast_enabled
                            ? `ON • ${formatPrice(
                                selectedSubscription.breakfast_price
                              )}`
                            : "Breakfast is OFF"}
                        </p>
                      </div>

                    </div>

                    <button
                      type="button"
                      disabled={
                        updating ===
                        "breakfast"
                      }
                      onClick={() =>
                        updateBreakfast(
                          selectedSubscription
                        )
                      }
                      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        selectedSubscription.breakfast_enabled
                          ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                          : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                      }`}
                    >
                      {updating ===
                      "breakfast" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Coffee className="h-4 w-4" />
                      )}

                      {selectedSubscription.breakfast_enabled
                        ? "Turn Breakfast OFF"
                        : "Turn Breakfast ON"}
                    </button>

                  </div>

                </div>

              </div>

              {/* CURRENT STATUS */}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                <div className="flex flex-wrap gap-3">

                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${getStatusClass(
                      selectedSubscription.status
                    )}`}
                  >
                    <CheckCircle className="h-4 w-4" />

                    Subscription:{" "}
                    {selectedSubscription.status ||
                      "unknown"}
                  </span>

                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${
                      selectedSubscription.diet_on
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-slate-200 bg-white text-slate-500"
                    }`}
                  >
                    {selectedSubscription.diet_on ? (
                      <ToggleRight className="h-4 w-4" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}

                    Diet{" "}
                    {selectedSubscription.diet_on
                      ? "ON"
                      : "OFF"}
                  </span>

                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${
                      selectedSubscription.breakfast_enabled
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-slate-200 bg-white text-slate-500"
                    }`}
                  >
                    <Coffee className="h-4 w-4" />

                    Breakfast{" "}
                    {selectedSubscription.breakfast_enabled
                      ? "ON"
                      : "OFF"}
                  </span>

                </div>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}