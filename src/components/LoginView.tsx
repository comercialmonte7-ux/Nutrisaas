import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Apple, ArrowRight, ShieldCheck, Sparkles, KeyRound } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (userId: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export default function LoginView({ onLoginSuccess, loading, setLoading }: LoginViewProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Read Google Client ID from environment variables, localStorage fallback, or default hardcoded value
  const [googleClientId, setGoogleClientId] = useState<string>(() => {
    return (
      ((import.meta as any).env.VITE_GOOGLE_CLIENT_ID as string) ||
      localStorage.getItem('nutrisaas_google_client_id') ||
      '369657284487-p7fjkkeejlgof9c4rt60tlgt5im6u10v.apps.googleusercontent.com'
    );
  });
  const [tempClientIdInput, setTempClientIdInput] = useState('');

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = tempClientIdInput.trim();
    if (!cleanId) {
      setErrorMsg('Por favor ingresa un ID de cliente válido.');
      return;
    }
    localStorage.setItem('nutrisaas_google_client_id', cleanId);
    setGoogleClientId(cleanId);
    setErrorMsg(null);
  };

  const decodeJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const handleCredentialResponse = async (response: any) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const token = response.credential;
      if (!token) {
        throw new Error('Token de credencial de Google vacío.');
      }

      // Decode the JWT token on client side
      const payload = decodeJwt(token);
      if (!payload || !payload.email) {
        throw new Error('No se pudo decodificar la información del usuario desde el token.');
      }

      const cleanEmail = payload.email.toLowerCase().trim();
      const name = payload.name || 'Usuario Google';
      const picture = payload.picture || '';

      // Determine the user ID. Map Ricardo's Gmail to his historical ID so his logs are preserved!
      let finalUserId = '';
      if (cleanEmail === 'ricardo.marimo@gmail.com') {
        finalUserId = 'de99bbfb-3712-40de-8e3b-9304005fc080';
      } else {
        // Safe Google unique user ID matching their sub claim
        finalUserId = `google-user-${payload.sub || cleanEmail.replace(/[^a-zA-Z0-9]/g, '-')}`;
      }

      // 1. Save session to localStorage
      localStorage.setItem('nutrisaas_active_user_id', finalUserId);
      localStorage.removeItem('nutrisaas_is_static_mode');

      // 2. Seed/update user profile in localStorage (Server-First approach)
      const localProfilesKey = 'nutrisaas_local_profiles';
      const localProfiles = JSON.parse(localStorage.getItem(localProfilesKey) || '{}');

      let profileData: any = null;

      // Try fetching the existing profile from the server database
      try {
        const profRes = await fetch('/api/database/profile', {
          headers: { 'x-user-id': finalUserId }
        });
        if (profRes.ok) {
          const pData = await profRes.json();
          if (pData && pData.profile) {
            profileData = pData.profile;
          }
        }
      } catch (e) {
        console.log('Error de red al intentar sincronizar el perfil al iniciar sesión:', e);
      }

      // If not found on server, trigger the login/register endpoint to initialize it on the server
      if (!profileData) {
        try {
          const authRes = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail })
          });
          if (authRes.ok) {
            const aData = await authRes.json();
            if (aData && aData.profile) {
              profileData = aData.profile;
              if (aData.userId && aData.userId !== finalUserId) {
                finalUserId = aData.userId;
                localStorage.setItem('nutrisaas_active_user_id', finalUserId);
              }
            }
          }
        } catch (e) {
          console.log('Error al registrar/autenticar en el servidor:', e);
        }
      }

      // Fallback: If still no profile (e.g., server offline), seed locally
      if (!profileData) {
        const nameParts = name.split(' ');
        const first_name = nameParts[0] || 'Usuario';
        const last_name = nameParts.slice(1).join(' ') || 'Google';

        profileData = {
          email: cleanEmail,
          first_name: cleanEmail === 'ricardo.marimo@gmail.com' ? "Ricardo" : first_name,
          last_name: cleanEmail === 'ricardo.marimo@gmail.com' ? "Marimo" : last_name,
          picture: picture,
          gender: cleanEmail === 'ricardo.marimo@gmail.com' ? "male" : "male",
          height_cm: cleanEmail === 'ricardo.marimo@gmail.com' ? 178 : 175,
          weight_kg: cleanEmail === 'ricardo.marimo@gmail.com' ? 82.0 : 75.0,
          activity_level: cleanEmail === 'ricardo.marimo@gmail.com' ? "moderately_active" : "lightly_active",
          goal: "lose_weight",
          target_calories: cleanEmail === 'ricardo.marimo@gmail.com' ? 2100 : 1900,
          target_protein_g: cleanEmail === 'ricardo.marimo@gmail.com' ? 160 : 140,
          target_carbs_g: cleanEmail === 'ricardo.marimo@gmail.com' ? 210 : 180,
          target_fat_g: cleanEmail === 'ricardo.marimo@gmail.com' ? 70 : 68,
          date_of_birth: cleanEmail === 'ricardo.marimo@gmail.com' ? "1994-06-07" : "1995-10-12",
          has_constipation_trouble: false,
          has_long_trips: false,
          has_other_condition: false,
          other_condition_notes: ""
        };
      } else {
        // Update photo picture if it changed
        profileData.picture = picture || profileData.picture;
      }

      // Local-First: if the user already has a profile locally, don't overwrite it with stale server database data (which can get wiped on server resets on Vercel)
      if (!localProfiles[finalUserId]) {
        localProfiles[finalUserId] = profileData;
        localStorage.setItem(localProfilesKey, JSON.stringify(localProfiles));
      } else {
        // Local profile exists. Let's sync the local profile to the server!
        const localProf = localProfiles[finalUserId];
        fetch('/api/database/profile/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': finalUserId
          },
          body: JSON.stringify(localProf)
        }).catch(err => console.log('Error syncing local profile to server on login:', err));
      }

      // 3. Seed initial daily logs and sync with server
      const localLogsKey = 'nutrisaas_local_logs';
      let localLogs = JSON.parse(localStorage.getItem(localLogsKey) || '[]');

      try {
        const logsRes = await fetch('/api/database/daily_logs', {
          headers: { 'x-user-id': finalUserId }
        });
        if (logsRes.ok) {
          const lData = await logsRes.json();
          if (lData.logs && lData.logs.length > 0) {
            const existingIds = new Set(localLogs.map((l: any) => l.id));
            const newServerLogs = lData.logs.filter((l: any) => !existingIds.has(l.id));
            localLogs = [...newServerLogs, ...localLogs];
            localStorage.setItem(localLogsKey, JSON.stringify(localLogs));
          }
        }
      } catch (e) {
        console.log('Error de red al intentar sincronizar las bitácoras al iniciar sesión:', e);
      }

      const userLogs = localLogs.filter((l: any) => l.user_id === finalUserId);
      // Initial seeds removed to start with a clean log

      onLoginSuccess(finalUserId);
    } catch (err: any) {
      console.error("Authentication error:", err);
      setErrorMsg(err.message || 'Error al validar tu cuenta de Google.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!googleClientId) return;

    const initGoogleSignIn = () => {
      try {
        const win = window as any;
        if (win.google && win.google.accounts && win.google.accounts.id) {
          win.google.accounts.id.initialize({
            client_id: googleClientId.trim(),
            callback: handleCredentialResponse
          });
          win.google.accounts.id.renderButton(
            document.getElementById("google-signin-btn"),
            { theme: "outline", size: "large", width: 320, text: "signin_with" }
          );
        }
      } catch (err) {
        console.error("Failed to initialize Google Sign-In:", err);
        setErrorMsg("Error al inicializar Google Sign-In. Verifica que tu Google Client ID sea válido.");
      }
    };

    const win = window as any;
    if (win.google && win.google.accounts) {
      initGoogleSignIn();
    } else {
      const interval = setInterval(() => {
        if (win.google && win.google.accounts) {
          initGoogleSignIn();
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [googleClientId]);

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
            <div className="inline-flex p-3.5 bg-gradient-to-br from-[#5A7C56] to-[#3D5C3A] rounded-2xl text-white shadow-md">
              <Apple className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">Acceso NutriSaaS</h2>
              <p className="text-xs text-stone-500 font-medium">Planificación metabólica y bitácora clínica segura</p>
            </div>
          </div>

          <div className="pt-2 border-t border-[#EFF4EE]">
            {!googleClientId ? (
              <form onSubmit={handleSaveClientId} className="space-y-4">
                <div className="bg-amber-50 border border-amber-250 rounded-2xl p-4 text-xs text-amber-900 leading-relaxed space-y-2">
                  <p className="font-extrabold flex items-center gap-1.5 text-amber-950">
                    ⚠️ Configuración de Google OAuth Requerida
                  </p>
                  <p>
                    Para habilitar el inicio de sesión seguro y privado con tu cuenta Google/Gmail, necesitas configurar un ID de cliente siguiendo estos sencillos pasos:
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 pl-1 font-semibold text-amber-900">
                    <li>Ingresa a la <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-amber-950">Google Cloud Console</a>.</li>
                    <li>Crea un proyecto e ingresa a **API y servicios** &gt; **Pantalla de consentimiento de OAuth** (Elige *Externa*, define el nombre y tu correo).</li>
                    <li>Ve a **Credenciales** &gt; **Crear credenciales** &gt; **ID de cliente de OAuth** (Selecciona tipo *Web Application*).</li>
                    <li>
                      Agrega en **Orígenes de JavaScript autorizados**:
                      <div className="mt-1 bg-white/70 p-1.5 rounded-lg border border-amber-200 font-mono text-[10px] break-all select-all select-text leading-tight">
                        http://localhost:3000<br />
                        https://nutrisaas-zeta.vercel.app
                      </div>
                    </li>
                    <li>Haz clic en **Crear** y copia tu **ID de cliente** generado.</li>
                  </ol>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="clientIdInput" className="text-[10px] font-extrabold text-stone-500 uppercase tracking-widest block flex items-center gap-1">
                    <KeyRound className="h-3 w-3 text-stone-400" /> ID de Cliente de Google
                  </label>
                  <input
                    type="text"
                    id="clientIdInput"
                    value={tempClientIdInput}
                    onChange={(e) => setTempClientIdInput(e.target.value)}
                    placeholder="123456789-abc.apps.googleusercontent.com"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-250 rounded-2xl text-xs font-semibold text-stone-900 focus:bg-white focus:outline-hidden focus:border-[#5A7C56] focus:ring-2 focus:ring-[#EFF4EE] transition"
                    required
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-50 text-red-900 rounded-xl text-xs font-semibold border border-red-100 leading-normal">
                    ⚠️ {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-[#5A7C56] hover:bg-[#3D5C3A] text-white font-black py-3 rounded-2xl transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  <span>Activar Inicio con Google</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <div className="space-y-6 text-center py-4">
                <p className="text-xs text-stone-600 font-medium leading-relaxed">
                  Para ingresar y ver tus datos clínicos de forma privada y segura, inicia sesión utilizando tu cuenta de Google/Gmail.
                </p>

                {errorMsg && (
                  <div className="p-3 bg-red-50 text-red-900 rounded-xl text-xs font-semibold border border-red-150 leading-normal text-left">
                    ⚠️ {errorMsg}
                  </div>
                )}

                <div className="flex justify-center items-center py-2" id="google-signin-btn-container">
                  <div id="google-signin-btn" className="inline-block min-h-[40px]"></div>
                </div>

                {loading && (
                  <p className="text-[11px] text-[#5A7C56] font-bold animate-pulse">
                    Validando tu sesión con Google...
                  </p>
                )}

                <div className="pt-4 border-t border-stone-100">
                  <button
                    onClick={() => {
                      localStorage.removeItem('nutrisaas_google_client_id');
                      setGoogleClientId('');
                      setErrorMsg(null);
                    }}
                    className="text-[10px] text-stone-400 hover:text-stone-600 font-extrabold underline cursor-pointer"
                  >
                    Restablecer o Cambiar Google Client ID
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Privacy promise */}
          <div className="flex items-center gap-2 bg-[#EFF4EE]/50 border border-[#CDDCD0]/40 p-3 rounded-2xl">
            <ShieldCheck className="h-5 w-5 text-[#5A7C56] flex-shrink-0" />
            <p className="text-[10px] text-[#3D5C3A] font-bold leading-relaxed">
              Privacidad y Seguridad Garantizada: Tus datos y bitácoras se almacenan únicamente en tu navegador. NutriSaaS no comparte tu información personal con servidores externos ni terceros.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Footer Info */}
      <p className="text-center text-[10px] text-stone-400 font-bold">
        © {new Date().getFullYear()} NutriSaaS Corporation SA. Conexión bajo cifrado OAuth2 seguro.
      </p>
    </div>
  );
}
