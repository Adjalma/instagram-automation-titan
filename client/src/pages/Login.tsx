import { useState } from "react";
import { Loader2, Zap } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? "Erro ao fazer login"); return; }
      const sessionCheck = await fetch("/api/trpc/auth.me?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D", { credentials: "include" });
      const sessionData = await sessionCheck.json().catch(() => null);
      const user = sessionData?.[0]?.result?.data?.json;
      if (!user) { setError("Login ok, mas sessão não persistiu. Limpe cookies do site e tente de novo."); return; }
      window.location.replace("/");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "oklch(0.07 0.02 240)" }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 60% 50% at 50% 0%, oklch(0.82 0.18 195 / 12%) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 80% 80%, oklch(0.72 0.22 290 / 8%) 0%, transparent 60%)",
      }} />
      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "linear-gradient(oklch(0.22 0.04 240 / 20%) 1px, transparent 1px), linear-gradient(90deg, oklch(0.22 0.04 240 / 20%) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      {/* Card */}
      <div className="relative w-full max-w-sm rounded-2xl p-8 z-10"
        style={{ background: "oklch(0.12 0.025 240 / 85%)", border: "1px solid oklch(0.82 0.18 195 / 20%)", backdropFilter: "blur(20px)", boxShadow: "0 0 60px oklch(0.82 0.18 195 / 8%), inset 0 1px 0 oklch(1 0 0 / 5%)" }}
      >
        {/* Logo / título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: "oklch(0.82 0.18 195 / 12%)", border: "1px solid oklch(0.82 0.18 195 / 30%)", boxShadow: "0 0 20px oklch(0.82 0.18 195 / 20%)" }}
          >
            <img src="/logo.svg" alt="Triarc" className="h-8 w-8 rounded-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <Zap className="h-7 w-7 hidden" style={{ color: "oklch(0.82 0.18 195)" }} />
          </div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Orbitron', sans-serif", background: "linear-gradient(135deg, oklch(0.92 0.01 220), oklch(0.82 0.18 195))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Triarc<span>SM</span>
          </h1>
          <p className="text-xs mt-1 font-mono uppercase tracking-widest" style={{ color: "oklch(0.82 0.18 195 / 50%)" }}>
            Social Manager
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-mono uppercase tracking-widest" style={{ color: "oklch(0.82 0.18 195 / 70%)" }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="admin@triarcsolutions.com.br"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
              style={{
                background: "oklch(0.09 0.02 240)",
                border: "1px solid oklch(0.82 0.18 195 / 20%)",
                color: "oklch(0.92 0.01 220)",
              }}
              onFocus={e => (e.target.style.borderColor = "oklch(0.82 0.18 195 / 60%)")}
              onBlur={e => (e.target.style.borderColor = "oklch(0.82 0.18 195 / 20%)")}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-mono uppercase tracking-widest" style={{ color: "oklch(0.82 0.18 195 / 70%)" }}>
              Senha
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
              style={{
                background: "oklch(0.09 0.02 240)",
                border: "1px solid oklch(0.82 0.18 195 / 20%)",
                color: "oklch(0.92 0.01 220)",
              }}
              onFocus={e => (e.target.style.borderColor = "oklch(0.82 0.18 195 / 60%)")}
              onBlur={e => (e.target.style.borderColor = "oklch(0.82 0.18 195 / 20%)")}
            />
          </div>

          {error && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "oklch(0.65 0.25 25 / 10%)", color: "oklch(0.75 0.22 25)", border: "1px solid oklch(0.65 0.25 25 / 30%)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 mt-2"
            style={{
              background: loading ? "oklch(0.82 0.18 195 / 30%)" : "linear-gradient(135deg, oklch(0.82 0.18 195), oklch(0.72 0.22 290))",
              color: "oklch(0.08 0.02 220)",
              boxShadow: loading ? "none" : "0 0 20px oklch(0.82 0.18 195 / 30%)",
            }}
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Entrando...</> : "Acessar Painel"}
          </button>
        </form>

        {/* Linha decorativa */}
        <div className="mt-6 divider-neon" />
        <p className="text-center text-[10px] font-mono mt-3" style={{ color: "oklch(0.40 0.02 240)" }}>
          TRIARC SOLUTIONS © 2026
        </p>
      </div>
    </div>
  );
}
