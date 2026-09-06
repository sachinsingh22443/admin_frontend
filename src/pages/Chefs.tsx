import {
  ChefHat,
  Search,
  UserRound,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShieldCheck,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getAdminChefs } from "../services/api";

interface Chef {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  profile_image?: string | null;
  is_active: boolean | number;
  is_verified: boolean | number;
  application_status?: string | null;
  rejection_reason?: string | null;
  created_at?: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

interface ChefsResponse {
  success: boolean;
  pagination: Pagination;
  chefs: Chef[];
}

export default function Chefs() {
  const navigate = useNavigate();

  const [chefs, setChefs] = useState<Chef[]>([]);
  const [pagination, setPagination] =
    useState<Pagination | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [totalChefs, setTotalChefs] = useState(0);
  const [approvedChefs, setApprovedChefs] = useState(0);
  const [pendingRejected, setPendingRejected] =
    useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================================================
     LOAD CHEFS
  ========================================================= */

  const loadChefs = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        (await getAdminChefs({
          page,
          limit: 20,
          ...(search.trim()
            ? { search: search.trim() }
            : {}),
        })) as ChefsResponse;

      console.log(
        "ADMIN CHEFS RESPONSE:",
        response
      );

      setChefs(response.chefs || []);
      setPagination(response.pagination || null);

      setTotalChefs(
        response.pagination?.total || 0
      );
    } catch (err) {
      console.error(
        "ADMIN CHEFS ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load chefs"
      );

      setChefs([]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     LOAD CHEF STATS
  ========================================================= */

  const loadChefStats = async () => {
    try {
      const [
        approvedResponse,
        pendingResponse,
        rejectedResponse,
      ] = await Promise.all([
        getAdminChefs({
          page: 1,
          limit: 1,
          status: "approved",
        }) as Promise<ChefsResponse>,

        getAdminChefs({
          page: 1,
          limit: 1,
          status: "under_review",
        }) as Promise<ChefsResponse>,

        getAdminChefs({
          page: 1,
          limit: 1,
          status: "rejected",
        }) as Promise<ChefsResponse>,
      ]);

      setApprovedChefs(
        approvedResponse.pagination?.total || 0
      );

      setPendingRejected(
        (pendingResponse.pagination?.total || 0) +
        (rejectedResponse.pagination?.total || 0)
      );
    } catch (err) {
      console.error(
        "ADMIN CHEF STATS ERROR:",
        err
      );
    }
  };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    loadChefs();
  }, [page, search]);

  useEffect(() => {
    loadChefStats();
  }, []);

  /* =========================================================
     SEARCH
  ========================================================= */

  const handleSearch = (
    value: string
  ) => {
    setSearch(value);
    setPage(1);
  };

  /* =========================================================
     STATUS HELPERS
  ========================================================= */

  const getStatus = (
    chef: Chef
  ) => {
    const status =
      chef.application_status
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

    if (status === "under_review") {
      return {
        label: "Under Review",
        className:
          "bg-yellow-50 text-yellow-700",
        icon: Clock,
      };
    }

    return {
      label: status
        ? status.replaceAll("_", " ")
        : "Pending",
      className:
        "bg-slate-100 text-slate-600",
      icon: Clock,
    };
  };

  /* =========================================================
     DATE
  ========================================================= */

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

  /* =========================================================
     RETRY
  ========================================================= */

  const handleRetry = () => {
    loadChefs();
    loadChefStats();
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Chefs
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage chefs, approvals and chef profiles
        </p>
      </div>

      {/* =====================================================
          STATS
      ===================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        {/* TOTAL */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
              <ChefHat className="h-6 w-6 text-orange-500" />
            </div>

          </div>

          <p className="mt-4 text-sm text-slate-500">
            Total Chefs
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {totalChefs}
          </p>

        </div>

        {/* APPROVED */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50">
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Approved
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {approvedChefs}
          </p>

        </div>

        {/* PENDING / REJECTED */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
            <XCircle className="h-6 w-6 text-red-500" />
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Pending / Rejected
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {pendingRejected}
          </p>

        </div>

      </div>

      {/* =====================================================
          SEARCH
      ===================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="relative">

          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

          <input
            value={search}
            onChange={(e) =>
              handleSearch(e.target.value)
            }
            placeholder="Search chef by name, phone or email..."
            className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />

        </div>

      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">

          <div className="flex items-start gap-3">

            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

            <div className="flex-1">

              <p className="font-semibold text-red-700">
                Failed to load chefs
              </p>

              <p className="mt-1 text-sm text-red-600">
                {error}
              </p>

              <button
                onClick={handleRetry}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          CHEF LIST
      ===================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-100 p-5">

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="font-semibold text-slate-900">
                Chef List
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {pagination?.total || 0} chefs found
              </p>
            </div>

            <button
              onClick={handleRetry}
              disabled={loading}
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loading
                    ? "animate-spin"
                    : ""
                }`}
              />
              Refresh
            </button>

          </div>

        </div>

        {/* ===================================================
            LOADING
        =================================================== */}

        {loading ? (
          <div className="flex min-h-[350px] items-center justify-center">

            <div className="text-center">

              <RefreshCw className="mx-auto h-8 w-8 animate-spin text-orange-500" />

              <p className="mt-3 text-sm font-medium text-slate-600">
                Loading chefs...
              </p>

            </div>

          </div>
        ) : chefs.length === 0 ? (

          /* =================================================
             EMPTY
          ================================================= */

          <div className="flex min-h-[350px] items-center justify-center p-6">

            <div className="text-center">

              <UserRound className="mx-auto h-10 w-10 text-slate-300" />

              <p className="mt-3 font-medium text-slate-700">
                {search
                  ? "No chefs found"
                  : "No chefs available"}
              </p>

              <p className="mt-1 text-sm text-slate-400">
                {search
                  ? "Try another name, phone or email."
                  : "Chef data will appear here after registration."}
              </p>

            </div>

          </div>

        ) : (

          /* =================================================
             DESKTOP TABLE
          ================================================= */

          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px]">

              <thead className="border-b border-slate-100 bg-slate-50">

                <tr>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Chef
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Contact
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Account
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Joined
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {chefs.map((chef) => {

                  const status =
                    getStatus(chef);

                  const StatusIcon =
                    status.icon;

                  const active =
                    chef.is_active === true ||
                    chef.is_active === 1;

                  const verified =
                    chef.is_verified === true ||
                    chef.is_verified === 1;

                  return (
                    <tr
                      key={chef.id}
                      className="transition hover:bg-slate-50"
                    >

                      {/* CHEF */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          {chef.profile_image ? (
                            <img
                              src={
                                chef.profile_image
                              }
                              alt={
                                chef.name
                              }
                              className="h-11 w-11 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-50">
                              <ChefHat className="h-5 w-5 text-orange-500" />
                            </div>
                          )}

                          <div className="min-w-0">

                            <div className="flex items-center gap-1.5">

                              <p className="truncate font-semibold text-slate-900">
                                {chef.name ||
                                  "Chef"}
                              </p>

                              {verified && (
                                <ShieldCheck className="h-4 w-4 shrink-0 text-blue-500" />
                              )}

                            </div>

                            <p className="mt-0.5 max-w-[220px] truncate text-xs text-slate-400">
                              ID: {chef.id}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* CONTACT */}

                      <td className="px-5 py-4">

                        <div>

                          <p className="text-sm font-medium text-slate-700">
                            {chef.phone ||
                              "—"}
                          </p>

                          <p className="mt-0.5 max-w-[220px] truncate text-xs text-slate-400">
                            {chef.email ||
                              "—"}
                          </p>

                        </div>

                      </td>

                      {/* APPLICATION STATUS */}

                      <td className="px-5 py-4">

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium ${status.className}`}
                        >

                          <StatusIcon className="h-3.5 w-3.5" />

                          {status.label}

                        </span>

                      </td>

                      {/* ACCOUNT STATUS */}

                      <td className="px-5 py-4">

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium ${
                            active
                              ? "bg-green-50 text-green-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >

                          {active ? (
                            <CheckCircle className="h-3.5 w-3.5" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}

                          {active
                            ? "Active"
                            : "Inactive"}

                        </span>

                      </td>

                      {/* JOINED */}

                      <td className="px-5 py-4">

                        <p className="text-sm text-slate-600">
                          {formatDate(
                            chef.created_at
                          )}
                        </p>

                      </td>

                      {/* ACTION */}

                      <td className="px-5 py-4 text-right">

                        <button
                          onClick={() =>
                            navigate(
                              `/admin/chefs/${chef.id}`
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                        >

                          <Eye className="h-4 w-4" />

                          View

                        </button>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        )}

        {/* ===================================================
            PAGINATION
        =================================================== */}

        {!loading &&
          pagination &&
          pagination.total_pages > 1 && (
            <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

              <p className="text-sm text-slate-500">

                Page{" "}
                <span className="font-semibold text-slate-700">
                  {pagination.page}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {pagination.total_pages}
                </span>

              </p>

              <div className="flex items-center gap-2">

                <button
                  disabled={
                    !pagination.has_previous
                  }
                  onClick={() =>
                    setPage(
                      (current) =>
                        Math.max(
                          1,
                          current - 1
                        )
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >

                  <ChevronLeft className="h-4 w-4" />

                  Previous

                </button>

                <button
                  disabled={
                    !pagination.has_next
                  }
                  onClick={() =>
                    setPage(
                      (current) =>
                        current + 1
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >

                  Next

                  <ChevronRight className="h-4 w-4" />

                </button>

              </div>

            </div>
          )}

      </div>

    </div>
  );
}