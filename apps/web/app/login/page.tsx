"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const schema = z.object({
  email:    z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al iniciar sesión"); return; }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user",  JSON.stringify(data.user));
      if (data.mustChangePassword) { window.location.href = "/change-password"; return; }
      window.location.href = data.user.role === "SUPERADMIN" ? "/admin" : "/dashboard";
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">

        {/* Logo y nombre */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="CarboMetrics" className="w-16 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">CarboMetrics</h1>
          <p className="text-gray-500 text-sm mt-1">Gestión de huella de carbono</p>
        </div>

        {/* Bienvenido */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Bienvenido</h2>
          <p className="text-gray-500 text-sm mt-1">Ingresa tus credenciales para continuar</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm text-center">
            ⚠ {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 text-center mb-1.5">
              Correo electrónico
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="tu@empresa.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-center placeholder:text-gray-300 placeholder:text-center"
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-600 text-center">{errors.email.message}</p>
            )}
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 text-center mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition pr-11 text-center placeholder:text-gray-300 placeholder:text-center"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-600 text-center">{errors.password.message}</p>
            )}
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" />Ingresando...</>
              : "Ingresar"
            }
          </button>

        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            CarboMetrics © {new Date().getFullYear()} · ISO 14064-1:2018
          </p>
          <p className="text-xs text-gray-300 mt-1">
            Sistema de gestión de inventario GEI corporativo
          </p>
        </div>

      </div>
    </main>
  );
}