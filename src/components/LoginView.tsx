import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Apple, ArrowRight, ShieldCheck, Mail, Sparkles, UserCheck } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (userId: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export default function LoginView({ onLoginSuccess, loading, setLoading }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Por favor introduce una dirección de correo válida.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.userId) {
        // Save to localStorage for durable sessions
        localStorage.setItem('nutrisaas_active_user_id', data.userId);
        onLoginSuccess(data.userId);
      } else {
        setErrorMsg(data.message || 'Error al autenticar el usuario.');
      }
    } catch (err) {
      setErrorMsg('Error de conexión con el servidor. Reintenta por favor.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (presetEmail: string) => {
    setEmail(presetEmail);
    // Submit immediately or populate the input
    setTimeout(() => {
      const form = document.getElementById('login-form') as HTMLFormElement;
      if (form) {
        form.requestSubmit();
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-between p-4 sm:p-6 md:p-8 select-none relative overflow-hidden" id="login_container">
      {/* Abstract vector backgrounds for premium look */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-50 blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-50 blur-3xl opacity-60 pointer-events-none" />

      {/* Header Info */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between pb-6 border-b border-[#E1E6DC]/40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#5A7C56] rounded-xl text-white">
            <Apple className="h-4.5 w-4.5" />
          </div>
          <span className="text-xs font-black tracking-tight text-stone-900">NutriSaaS</span>
        </div>
        <span className="text-[10px] bg-stone-100 text-stone-500 font-black px-2.5 py-0.5 rounded-full border border-stone-200">
          v1.4.0 Production
        </span>
      </div>

      {/* Center login card */}
      <div className="flex-1 flex items-center justify-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-md bg-white border border-[#CDDCD0] shadow-xl rounded-3xl p-6 sm:p-8 space-y-6 relative z-10"
          id="login_card"
        >
          {/* Logo illustration */}
          <div className="text-center space-y-3">
            <div className="inline-flex p-3.5 bg-gradient-to-br from-[#5A7C56] to-[#3D5C3A] rounded-2xl text-white shadow-md animate-bounce-slow">
              <Apple className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">Acceso NutriSaaS</h2>
              <p className="text-xs text-stone-500 font-medium">Planificación metabólica y bitácora clínica segura</p>
            </div>
          </div>

          <form id="login-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-[10px] font-extrabold text-stone-500 uppercase tracking-widest block">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-250 rounded-2xl text-sm font-semibold text-stone-900 focus:bg-white focus:outline-hidden focus:border-[#5A7C56] focus:ring-2 focus:ring-[#EFF4EE] transition"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-900 rounded-xl text-xs font-semibold border border-red-100 leading-normal">
                ⚠️ {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5A7C56] hover:bg-[#3D5C3A] disabled:bg-stone-300 text-white font-black py-3 rounded-2xl transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Autenticando sesión...</span>
              ) : (
                <>
                  <span>Ingresar a Bitácora</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Access sandbox accounts */}
          <div className="space-y-2.5 pt-4 border-t border-[#EFF4EE]">
            <div className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-[#5A7C56]" />
              <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider block">
                Cuentas de Demostración Presets:
              </span>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('mari.ricardo@gmail.com')}
                className="p-3 bg-[#FAF8F5] hover:bg-[#EFF4EE] border border-stone-200 hover:border-[#CDDCD0] rounded-xl text-left transition flex items-center justify-between cursor-pointer group"
              >
                <div className="leading-tight">
                  <span className="text-xs font-black text-stone-800 block group-hover:text-[#3D5C3A]">Ricardo Mari (Novia)</span>
                  <span className="text-[10px] text-stone-450 font-bold block">mari.ricardo@gmail.com</span>
                </div>
                <UserCheck className="h-4 w-4 text-stone-400 group-hover:text-[#5A7C56] group-hover:translate-x-0.5 transition" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('unauthorized.attacker@evil.com')}
                className="p-3 bg-[#FAF8F5] hover:bg-stone-100 border border-stone-200 rounded-xl text-left transition flex items-center justify-between cursor-pointer group"
              >
                <div className="leading-tight">
                  <span className="text-xs font-black text-stone-850 block">Atacante Infiltrado (RLS Test)</span>
                  <span className="text-[10px] text-stone-450 font-bold block">unauthorized.attacker@evil.com</span>
                </div>
                <UserCheck className="h-4 w-4 text-stone-400 group-hover:translate-x-0.5 transition" />
              </button>
            </div>
          </div>

          {/* Privacy promise */}
          <div className="flex items-center gap-2 bg-[#EFF4EE]/50 border border-[#CDDCD0]/40 p-3 rounded-2xl">
            <ShieldCheck className="h-5 w-5 text-[#5A7C56] flex-shrink-0" />
            <p className="text-[10px] text-[#3D5C3A] font-bold leading-relaxed">
              Row-Level Security Activo: Tus bitácoras de comida y fórmulas están aisladas por ID mediante políticas PostgreSQL estrictas del lado del servidor.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Footer Info */}
      <p className="text-center text-[10px] text-stone-400 font-bold">
        © {new Date().getFullYear()} NutriSaaS Corporation SA. Conexión garantizada bajo cifrado SSL de 256 bits.
      </p>
    </div>
  );
}
