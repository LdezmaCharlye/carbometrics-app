"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Leaf, Loader2 } from "lucide-react";

const schema = z.object({
  currentPassword: z.string().min(6),
  newPassword:     z.string().min(8, "Mínimo 8 caracteres"),
  confirm:         z.string(),
}).refine((d) => d.newPassword === d.confirm, {
  message: "Las contraseñas no coinciden",
  path:    ["confirm"],
});
type FormValues = z.infer<typeof schema>;

export default function ChangePasswordPage() {
  const router  = useRouter();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/change-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ currentPassword: values.currentPassword, newPassword: values.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al cambiar contraseña"); return; }
      router.push("/dashboard");
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-4 shadow-lg">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Cambiar contraseña</h1>
          <p className="text-gray-500 mt-1 text-sm">Por seguridad debes cambiar tu contraseña temporal</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña actual</label>
              <input {...register("currentPassword")} type="password" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              {errors.currentPassword && <p className="mt-1 text-xs text-red-600">{errors.currentPassword.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
              <input {...register("newPassword")} type="password" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              {errors.newPassword && <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nueva contraseña</label>
              <input {...register("confirm")} type="password" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              {errors.confirm && <p className="mt-1 text-xs text-red-600">{errors.confirm.message}</p>}
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : "Cambiar contraseña"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}