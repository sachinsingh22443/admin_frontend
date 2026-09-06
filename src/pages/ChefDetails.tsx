import {
  useParams,
  useNavigate,
} from "react-router-dom";

import {
  ChevronLeft,
  UserRound,
  ChefHat,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  Package,
  Users,
  IndianRupee,
  CreditCard,
  Utensils,
  MapPin,
  Phone,
  Mail,
  FileText,
  RefreshCw,
  Power,
  Ban,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  getAdminChef,
} from "../services/api";

import {
  apiPost,
} from "../services/api";

/* =========================================================
   TYPES
========================================================= */

interface RecentOrder {
  id: string;
  customer_id?: string | null;
  customer_name?: string | null;
  phone?: string | null;
  address?: string | null;
  total_price: number;
  status?: string | null;
  payment_method?: string | null;
  payment_status?: string | null;
  payment_id?: string | null;
  cod_confirmed?: boolean | null;
  refund_status?: string | null;
  refund_amount?: number;
  refund_date?: string | null;
  created_at?: string | null;
}

interface ChefProfile {
  address?: string | null;
  fssai_number?: string | null;
  fssai_document?: string | null;
  profile_image?: string | null;
  bio?: string | null;
  location?: string | null;
  specialties?: string | null;
  account_holder_name?: string | null;
  account_number?: string | null;
  ifsc_code?: string | null;
}

interface ChefStatistics {
  orders: {
    total: number;
    pending: number;
    preparing: number;
    out_for_delivery: number;
    completed: number;
    cancelled: number;
  };

  customers_served: number;

  revenue: {
    total: number;
    cancelled: number;
  };

  subscriptions: {
    total: number;
    active: number;
  };

  tomorrow_special: {
    total: number;
    active: number;
  };
}

interface Chef {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  is_active: boolean | number;
  is_verified: boolean | number;
  application_status?: string | null;
  rejection_reason?: string | null;
  created_at?: string | null;

  profile?: ChefProfile;

  statistics: ChefStatistics;

  recent_orders: RecentOrder[];
}

interface ChefResponse {
  success: boolean;
  chef: Chef;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function ChefDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [chef, setChef] =
    useState<Chef | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [showReject, setShowReject] =
    useState(false);

  const [rejectReason, setRejectReason] =
    useState("");

  /* =======================================================
     LOAD CHEF
  ======================================================= */

  const loadChef = async () => {
    if (!id) {
      setError("Invalid chef ID");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        (await getAdminChef(id)) as ChefResponse;

      console.log(
        "ADMIN CHEF DETAIL:",
        response
      );

      if (!response?.success || !response?.chef) {
        throw new Error(
          "Chef details not found"
        );
      }

      setChef(response.chef);
    } catch (err) {
      console.error(
        "CHEF DETAIL ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load chef details"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadChef();
  }, [id]);

  /* =======================================================
     APPROVE
  ======================================================= */

  const handleApprove = async () => {
    if (!id) return;

    const confirmed =
      window.confirm(
        "Are you sure you want to approve this chef?"
      );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");

      await apiPost(
        `/admin/chefs/${id}/approve`
      );

      await loadChef();

      alert(
        "Chef approved successfully"
      );
    } catch (err) {
      console.error(
        "APPROVE CHEF ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to approve chef"
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =======================================================
     REJECT
  ======================================================= */

  const handleReject = async () => {
    if (!id) return;

    const reason =
      rejectReason.trim();

    if (!reason) {
      alert(
        "Please enter rejection reason"
      );
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await apiPost(
        `/admin/chefs/${id}/reject`,
        {
          reason,
        }
      );

      setShowReject(false);
      setRejectReason("");

      await loadChef();

      alert(
        "Chef application rejected"
      );
    } catch (err) {
      console.error(
        "REJECT CHEF ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to reject chef"
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =======================================================
     ACTIVATE
  ======================================================= */

  const handleActivate = async () => {
    if (!id) return;

    try {
      setActionLoading(true);
      setError("");

      await apiPost(
        `/admin/chefs/${id}/activate`
      );

      await loadChef();

      alert(
        "Chef activated successfully"
      );
    } catch (err) {
      console.error(
        "ACTIVATE CHEF ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to activate chef"
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =======================================================
     DEACTIVATE
  ======================================================= */

  const handleDeactivate = async () => {
    if (!id) return;

    const confirmed =
      window.confirm(
        "Are you sure you want to deactivate this chef?"
      );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");

      await apiPost(
        `/admin/chefs/${id}/deactivate`
      );

      await loadChef();

      alert(
        "Chef deactivated successfully"
      );
    } catch (err) {
      console.error(
        "DEACTIVATE CHEF ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to deactivate chef"
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =======================================================
     HELPERS
  ======================================================= */

  const formatDate = (
    value?: string | null
  ) => {
    if (!value) return "—";

    try {
      return new Date(
        value
      ).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    } catch {
      return "—";
    }
  };

  const formatDateTime = (
    value?: string | null
  ) => {
    if (!value) return "—";

    try {
      return new Date(
        value
      ).toLocaleString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    } catch {
      return "—";
    }
  };

  const formatCurrency = (
    value: number
  ) => {
    return `₹${Number(
      value || 0
    ).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getApplicationStatus = () => {
    const status =
      chef?.application_status
        ?.toLowerCase()
        .trim();

    if (status === "approved") {
      return {
        label: "Approved",
        className:
          "bg-green-50 text-green-700",
        icon: CheckCircle,
      };
    }

    if (status === "rejected") {
      return {
        label: "Rejected",
        className:
          "bg-red-50 text-red-700",
        icon: XCircle,
      };
    }

    return {
      label:
        status === "under_review"
          ? "Under Review"
          : "Pending",
      className:
        "bg-yellow-50 text-yellow-700",
      icon: Clock,
    };
  };

  const getOrderStatus = (
    status?: string | null
  ) => {
    const value =
      status
        ?.toLowerCase()
        .trim();

    if (value === "delivered") {
      return "bg-green-50 text-green-700";
    }

    if (value === "cancelled") {
      return "bg-red-50 text-red-700";
    }

    if (
      value === "pending"
    ) {
      return "bg-yellow-50 text-yellow-700";
    }

    if (
      value === "preparing"
    ) {
      return "bg-blue-50 text-blue-700";
    }

    return "bg-slate-100 text-slate-600";
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">

        <div className="text-center">

          <RefreshCw className="mx-auto h-9 w-9 animate-spin text-orange-500" />

          <p className="mt-3 text-sm font-medium text-slate-600">
            Loading chef details...
          </p>

        </div>

      </div>
    );
  }

  /* =======================================================
     ERROR / NOT FOUND
  ======================================================= */

  if (!chef) {
    return (
      <div className="space-y-6">

        <button
          onClick={() =>
            navigate("/admin/chefs")
          }
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
        >
          <ChevronLeft className="h-5 w-5 text-slate-600" />
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">

          <XCircle className="mx-auto h-10 w-10 text-red-500" />

          <h2 className="mt-3 text-lg font-semibold text-red-700">
            Chef details unavailable
          </h2>

          <p className="mt-1 text-sm text-red-600">
            {error ||
              "Chef not found"}
          </p>

          <button
            onClick={loadChef}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>

        </div>

      </div>
    );
  }

  const status =
    getApplicationStatus();

  const StatusIcon =
    status.icon;

  const isActive =
    chef.is_active === true ||
    chef.is_active === 1;

  const isVerified =
    chef.is_verified === true ||
    chef.is_verified === 1;

  /* =======================================================
     MAIN
  ======================================================= */

  return (
    <div className="space-y-6">

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div className="flex items-center gap-4">

          <button
            onClick={() =>
              navigate("/admin/chefs")
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
          >
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </button>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Chef Details
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Complete chef information
            </p>
          </div>

        </div>

        {/* ACTIONS */}

        <div className="flex flex-wrap gap-2">

          {chef.application_status !==
            "approved" && (
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              Approve
            </button>
          )}

          {chef.application_status !==
            "rejected" && (
            <button
              onClick={() =>
                setShowReject(true)
              }
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </button>
          )}

          {chef.application_status ===
            "approved" && (
            <>
              {isActive ? (
                <button
                  onClick={
                    handleDeactivate
                  }
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <Ban className="h-4 w-4" />
                  Deactivate
                </button>
              ) : (
                <button
                  onClick={
                    handleActivate
                  }
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  <Power className="h-4 w-4" />
                  Activate
                </button>
              )}
            </>
          )}

        </div>

      </div>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ===================================================
          PROFILE HEADER
      =================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

          <div className="flex items-center gap-4">

            {chef.profile?.profile_image ? (
              <img
                src={
                  chef.profile.profile_image
                }
                alt={chef.name}
                className="h-20 w-20 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-50">
                <ChefHat className="h-9 w-9 text-orange-500" />
              </div>
            )}

            <div>

              <div className="flex flex-wrap items-center gap-2">

                <h2 className="text-xl font-bold text-slate-900">
                  {chef.name ||
                    "Chef"}
                </h2>

                {isVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified
                  </span>
                )}

              </div>

              <p className="mt-1 text-sm text-slate-500">
                Chef ID: {chef.id}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Joined{" "}
                {formatDate(
                  chef.created_at
                )}
              </p>

            </div>

          </div>

          <div className="flex flex-wrap gap-2">

            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold ${status.className}`}
            >
              <StatusIcon className="h-4 w-4" />
              {status.label}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold ${
                isActive
                  ? "bg-green-50 text-green-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {isActive ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}

              {isActive
                ? "Active"
                : "Inactive"}
            </span>

          </div>

        </div>

      </div>

      {/* ===================================================
          STATISTICS
      =================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
            <Package className="h-6 w-6 text-blue-500" />
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Total Orders
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {chef.statistics.orders.total}
          </p>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50">
            <Users className="h-6 w-6 text-green-500" />
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Customers Served
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {
              chef.statistics
                .customers_served
            }
          </p>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
            <IndianRupee className="h-6 w-6 text-orange-500" />
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Total Revenue
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatCurrency(
              chef.statistics.revenue.total
            )}
          </p>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50">
            <CreditCard className="h-6 w-6 text-purple-500" />
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Active Subscriptions
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {
              chef.statistics
                .subscriptions.active
            }
          </p>

        </div>

      </div>

      {/* ===================================================
          CONTACT + PROFILE
      =================================================== */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* CONTACT */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <UserRound className="h-5 w-5 text-orange-500" />
            Contact Information
          </h3>

          <div className="mt-5 space-y-4">

            <div className="flex items-start gap-3">

              <Mail className="mt-0.5 h-5 w-5 text-slate-400" />

              <div>
                <p className="text-xs text-slate-400">
                  Email
                </p>

                <p className="mt-1 text-sm font-medium text-slate-700">
                  {chef.email ||
                    "—"}
                </p>
              </div>

            </div>

            <div className="flex items-start gap-3">

              <Phone className="mt-0.5 h-5 w-5 text-slate-400" />

              <div>
                <p className="text-xs text-slate-400">
                  Phone
                </p>

                <p className="mt-1 text-sm font-medium text-slate-700">
                  {chef.phone ||
                    "—"}
                </p>
              </div>

            </div>

            <div className="flex items-start gap-3">

              <MapPin className="mt-0.5 h-5 w-5 text-slate-400" />

              <div>
                <p className="text-xs text-slate-400">
                  Location
                </p>

                <p className="mt-1 text-sm font-medium text-slate-700">
                  {chef.profile?.location ||
                    chef.profile?.address ||
                    "—"}
                </p>
              </div>

            </div>

          </div>

        </div>

        {/* CHEF PROFILE */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <ChefHat className="h-5 w-5 text-orange-500" />
            Chef Profile
          </h3>

          <div className="mt-5 space-y-4">

            <div>

              <p className="text-xs text-slate-400">
                Specialties
              </p>

              <p className="mt-1 text-sm font-medium text-slate-700">
                {chef.profile?.specialties ||
                  "Not provided"}
              </p>

            </div>

            <div>

              <p className="text-xs text-slate-400">
                Bio
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                {chef.profile?.bio ||
                  "No bio provided"}
              </p>

            </div>

            <div>

              <p className="text-xs text-slate-400">
                Address
              </p>

              <p className="mt-1 text-sm text-slate-600">
                {chef.profile?.address ||
                  "Not provided"}
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* ===================================================
          FSSAI
      =================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <h3 className="flex items-center gap-2 font-semibold text-slate-900">
          <FileText className="h-5 w-5 text-orange-500" />
          FSSAI Information
        </h3>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">

          <div>

            <p className="text-xs text-slate-400">
              FSSAI Number
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-700">
              {chef.profile?.fssai_number ||
                "Not provided"}
            </p>

          </div>

          <div>

            <p className="text-xs text-slate-400">
              FSSAI Document
            </p>

            {chef.profile?.fssai_document ? (
              <a
                href={
                  chef.profile.fssai_document
                }
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
              >
                <FileText className="h-4 w-4" />
                View Document
              </a>
            ) : (
              <p className="mt-1 text-sm text-slate-500">
                Not uploaded
              </p>
            )}

          </div>

        </div>

      </div>

      {/* ===================================================
          ORDER STATISTICS
      =================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <h3 className="flex items-center gap-2 font-semibold text-slate-900">
          <Package className="h-5 w-5 text-orange-500" />
          Order Statistics
        </h3>

        <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">

          {[
            [
              "Pending",
              chef.statistics.orders.pending,
            ],
            [
              "Preparing",
              chef.statistics.orders.preparing,
            ],
            [
              "Out for Delivery",
              chef.statistics.orders
                .out_for_delivery,
            ],
            [
              "Completed",
              chef.statistics.orders.completed,
            ],
            [
              "Cancelled",
              chef.statistics.orders.cancelled,
            ],
            [
              "Total",
              chef.statistics.orders.total,
            ],
          ].map(
            ([label, value]) => (
              <div
                key={String(label)}
                className="rounded-xl bg-slate-50 p-4"
              >

                <p className="text-xs text-slate-400">
                  {label}
                </p>

                <p className="mt-1 text-xl font-bold text-slate-900">
                  {value}
                </p>

              </div>
            )
          )}

        </div>

      </div>

      {/* ===================================================
          SUBSCRIPTIONS / SPECIALS / REVENUE
      =================================================== */}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
              <CreditCard className="h-5 w-5 text-purple-500" />
            </div>

            <div>
              <h3 className="font-semibold text-slate-900">
                Subscriptions
              </h3>

              <p className="text-xs text-slate-400">
                Total subscriptions
              </p>
            </div>

          </div>

          <div className="mt-5 flex items-end justify-between">

            <div>
              <p className="text-2xl font-bold text-slate-900">
                {
                  chef.statistics
                    .subscriptions.total
                }
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Total
              </p>
            </div>

            <div>
              <p className="text-xl font-bold text-green-600">
                {
                  chef.statistics
                    .subscriptions.active
                }
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Active
              </p>
            </div>

          </div>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
              <Utensils className="h-5 w-5 text-orange-500" />
            </div>

            <div>
              <h3 className="font-semibold text-slate-900">
                Tomorrow Special
              </h3>

              <p className="text-xs text-slate-400">
                Special dishes
              </p>
            </div>

          </div>

          <div className="mt-5 flex items-end justify-between">

            <div>
              <p className="text-2xl font-bold text-slate-900">
                {
                  chef.statistics
                    .tomorrow_special.total
                }
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Total
              </p>
            </div>

            <div>
              <p className="text-xl font-bold text-green-600">
                {
                  chef.statistics
                    .tomorrow_special.active
                }
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Active
              </p>
            </div>

          </div>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
              <IndianRupee className="h-5 w-5 text-green-500" />
            </div>

            <div>
              <h3 className="font-semibold text-slate-900">
                Revenue
              </h3>

              <p className="text-xs text-slate-400">
                Order revenue
              </p>
            </div>

          </div>

          <div className="mt-5">

            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(
                chef.statistics.revenue.total
              )}
            </p>

            <p className="mt-1 text-xs text-red-500">
              Cancelled:{" "}
              {formatCurrency(
                chef.statistics.revenue.cancelled
              )}
            </p>

          </div>

        </div>

      </div>

      {/* ===================================================
          RECENT ORDERS
      =================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-100 p-6">

          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <Package className="h-5 w-5 text-orange-500" />
            Recent Orders
          </h3>

          <p className="mt-1 text-xs text-slate-400">
            Latest 10 orders assigned to this chef
          </p>

        </div>

        {chef.recent_orders.length ===
        0 ? (
          <div className="flex min-h-[180px] items-center justify-center">

            <div className="text-center">

              <Package className="mx-auto h-9 w-9 text-slate-300" />

              <p className="mt-3 text-sm font-medium text-slate-600">
                No orders found
              </p>

            </div>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[850px]">

              <thead className="bg-slate-50">

                <tr>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Customer
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Amount
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Payment
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {chef.recent_orders.map(
                  (order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50"
                    >

                      <td className="px-5 py-4">

                        <p className="font-medium text-slate-800">
                          {order.customer_name ||
                            "Customer"}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          {order.phone ||
                            "—"}
                        </p>

                      </td>

                      <td className="px-5 py-4">

                        <p className="font-semibold text-slate-800">
                          {formatCurrency(
                            order.total_price
                          )}
                        </p>

                      </td>

                      <td className="px-5 py-4">

                        <p className="text-sm text-slate-600">
                          {order.payment_method ||
                            "—"}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          {order.payment_status ||
                            "—"}
                        </p>

                      </td>

                      <td className="px-5 py-4">

                        <span
                          className={`inline-flex rounded-full px-2.5 py-1.5 text-xs font-medium ${getOrderStatus(
                            order.status
                          )}`}
                        >
                          {order.status
                            ? order.status.replaceAll(
                                "_",
                                " "
                              )
                            : "Unknown"}
                        </span>

                      </td>

                      <td className="px-5 py-4">

                        <p className="text-sm text-slate-600">
                          {formatDateTime(
                            order.created_at
                          )}
                        </p>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* ===================================================
          REJECTION REASON
      =================================================== */}

      {chef.rejection_reason && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">

          <div className="flex items-start gap-3">

            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

            <div>

              <h3 className="font-semibold text-red-700">
                Rejection Reason
              </h3>

              <p className="mt-1 text-sm leading-6 text-red-600">
                {chef.rejection_reason}
              </p>

            </div>

          </div>

        </div>
      )}

      {/* ===================================================
          REJECT MODAL
      =================================================== */}

      {showReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">

            <div className="flex items-start justify-between">

              <div>

                <h2 className="text-lg font-bold text-slate-900">
                  Reject Chef Application
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Please provide a reason for rejection.
                </p>

              </div>

              <button
                onClick={() =>
                  setShowReject(false)
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <XCircle className="h-5 w-5" />
              </button>

            </div>

            <textarea
              value={rejectReason}
              onChange={(e) =>
                setRejectReason(
                  e.target.value
                )
              }
              rows={5}
              placeholder="Enter rejection reason..."
              className="mt-5 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />

            <div className="mt-5 flex justify-end gap-3">

              <button
                onClick={() => {
                  setShowReject(false);
                  setRejectReason("");
                }}
                disabled={actionLoading}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={handleReject}
                disabled={
                  actionLoading ||
                  !rejectReason.trim()
                }
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >

                {actionLoading && (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                )}

                Reject Chef

              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}