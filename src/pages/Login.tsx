import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChefHat,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from "lucide-react";

const BASE_URL = "https://chef-backend-qh12.onrender.com";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");

    const loginEmail = email.trim().toLowerCase();
    const loginPassword = password;

    if (!loginEmail || !loginPassword) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      console.log("Admin login request:", {
        email: loginEmail,
        passwordLength: loginPassword.length,
      });

      const response = await fetch(
        `${BASE_URL}/admin/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            email: loginEmail,
            password: loginPassword,
          }),
        }
      );

      const data = await response.json();

      console.log("Admin login response:", {
        status: response.status,
        ok: response.ok,
        role: data?.role,
        hasAccessToken: !!data?.access_token,
      });

      if (!response.ok) {
        const backendMessage =
          typeof data?.detail === "string"
            ? data.detail
            : "Invalid admin credentials";

        throw new Error(backendMessage);
      }

      if (!data?.access_token) {
        throw new Error(
          "Login successful but access token was not received."
        );
      }

      if (data?.role !== "admin") {
        throw new Error(
          "This account does not have admin access."
        );
      }

      // ============================================
      // REMOVE OLD / INVALID TOKENS
      // ============================================

      localStorage.removeItem("token");
      localStorage.removeItem("access_token");

      // ============================================
      // SAVE ADMIN AUTHENTICATION
      // ============================================

      localStorage.setItem(
        "admin_access_token",
        data.access_token
      );

      if (data.refresh_token) {
        localStorage.setItem(
          "admin_refresh_token",
          data.refresh_token
        );
      }

      localStorage.setItem(
        "admin_user_id",
        data.user_id || ""
      );

      localStorage.setItem(
        "admin_role",
        data.role || "admin"
      );

      localStorage.setItem(
        "admin_name",
        data.name || "Administrator"
      );

      localStorage.setItem(
        "admin_email",
        data.email || loginEmail
      );

      // ============================================
      // LOGIN SUCCESS
      // ============================================

      navigate("/admin", {
        replace: true,
      });
    } catch (err: any) {
      console.error("Admin login error:", err);

      setError(
        err?.message ||
          "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff8f2]">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* =====================================================
            LEFT BRAND SECTION
        ===================================================== */}

        <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#ff6b00] via-[#ff7a00] to-[#ff9d4d] lg:flex">

          {/* Decorative circles */}

          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10" />

          <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-white/10" />

          <div className="absolute right-20 top-32 h-24 w-24 rounded-full bg-white/10" />

          <div className="relative z-10 flex w-full flex-col justify-between p-14">

            {/* Logo */}

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-xl">
                <ChefHat className="h-8 w-8 text-orange-500" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-white">
                  Chef Admin
                </h1>

                <p className="text-sm text-white/75">
                  Management Panel
                </p>
              </div>

            </div>

            {/* Center Content */}

            <div className="max-w-xl">

              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur">
                <ShieldCheck className="h-4 w-4" />
                Secure Admin Access
              </div>

              <h2 className="text-5xl font-bold leading-tight text-white">
                Manage your
                <br />
                kitchen with
                <br />
                confidence.
              </h2>

              <p className="mt-6 max-w-md text-lg leading-8 text-white/80">
                Manage orders, customers,
                subscriptions, chefs and
                tomorrow special from one
                powerful dashboard.
              </p>

            </div>

            {/* Bottom */}

            <div className="text-sm text-white/70">
              © {new Date().getFullYear()} Chef Admin
              <span className="mx-2">•</span>
              Secure Management System
            </div>

          </div>
        </div>

        {/* =====================================================
            RIGHT LOGIN SECTION
        ===================================================== */}

        <div className="flex items-center justify-center px-6 py-12">

          <div className="w-full max-w-md">

            {/* Mobile Logo */}

            <div className="mb-10 flex flex-col items-center lg:hidden">

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-200">
                <ChefHat className="h-9 w-9 text-white" />
              </div>

              <h1 className="mt-4 text-2xl font-bold text-slate-900">
                Chef Admin
              </h1>

              <p className="text-sm text-slate-500">
                Management Panel
              </p>

            </div>

            {/* Login Heading */}

            <div className="mb-8">

              <p className="text-sm font-semibold uppercase tracking-wider text-orange-500">
                Welcome back
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                Admin Login
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Sign in to access your Chef Admin
                dashboard.
              </p>

            </div>

            {/* =================================================
                ERROR MESSAGE
            ================================================= */}

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm font-medium text-red-700">
                  {error}
                </p>
              </div>
            )}

            {/* =================================================
                LOGIN FORM
            ================================================= */}

            <form
              onSubmit={handleLogin}
              className="space-y-5"
            >

              {/* EMAIL */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email Address
                </label>

                <div className="relative">

                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="admin@example.com"
                    autoComplete="email"
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />

                </div>

              </div>

              {/* PASSWORD */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Password
                </label>

                <div className="relative">

                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>

                </div>

              </div>

              {/* LOGIN BUTTON */}

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >

                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}

              </button>

            </form>

            {/* =================================================
                SECURITY NOTE
            ================================================= */}

            <div className="mt-8 flex items-start gap-3 rounded-xl bg-slate-50 p-4">

              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />

              <p className="text-xs leading-5 text-slate-500">
                This is a secure administrator area.
                Only authorized admin accounts can
                access the management dashboard.
              </p>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}