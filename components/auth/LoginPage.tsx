"use client"
import { useState, useEffect } from "react"
import { API_BASE_URL } from "@/lib/config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Particles } from "@/components/ui/particles"
import Image from "next/image"

export function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [isRegister, setIsRegister] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [school, setSchool] = useState("")
  const [classroom, setClassroom] = useState("")
  const [error, setError] = useState("")
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isTeacher, setIsTeacher] = useState(false)
  const [teacherKey, setTeacherKey] = useState("")

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  // --- GOOGLE OAUTH FLOW ---
  useEffect(() => {
    if (typeof window === "undefined") return

    const hash = window.location.hash
    if (hash) {
      const params = new URLSearchParams(hash.substring(1))
      const idToken = params.get("id_token")
      if (idToken) {
        // Clear the hash from address bar immediately
        window.history.replaceState(null, "", window.location.pathname)
        
        // Retrieve role
        const savedRole = localStorage.getItem("google_oauth_role") || "student"
        localStorage.removeItem("google_oauth_role")
        
        handleGoogleSignInSuccess(idToken, savedRole)
      }
    }
  }, [])

  const handleGoogleSignInSuccess = async (idToken: string, role: string) => {
    setIsLoading(true)
    setError("")
    try {
      const baseUrl = API_BASE_URL
      const resp = await fetch(`${baseUrl}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: idToken, role })
      })

      const data = await resp.json()
      if (!resp.ok) {
        throw new Error(data.detail || "Error en la autenticación con Google")
      }

      localStorage.setItem("eleonor_token", data.token)
      localStorage.setItem("eleonor_user", JSON.stringify(data.user))
      onLogin()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "907750199148-ohobjbvg98obn9gb61jidg7soqhg2ts8.apps.googleusercontent.com"
    const redirectUri = typeof window !== 'undefined' 
      ? `${window.location.origin}/login`
      : 'https://ski11tech.netlify.app/login'
    
    const scope = 'openid email profile'
    const responseType = 'id_token'
    const nonce = Math.random().toString(36).substring(2)
    localStorage.setItem("google_oauth_nonce", nonce)
    
    // Save current role state
    localStorage.setItem("google_oauth_role", isTeacher ? "teacher" : "student")
    
    const url = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=${responseType}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&nonce=${nonce}`
      
    window.location.href = url
  }

  // --- PRECARGA ESTRATÉGICA ---
  useEffect(() => {
    const assets = [
      '/models/tororo/tororo.model3.json',
      '/models/tororo/tororo.moc3',
      '/models/tororo/tororo.1024/texture_00.png',
      '/live2d-libs/pixi.min.js',
      '/live2d-libs/live2d.min.js',
      '/live2d-libs/live2dcubismcore.min.js',
      '/live2d-libs/pixi-live2d-display.min.js'
    ];

    assets.forEach(asset => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = asset;
      document.head.appendChild(link);
    });

    console.log("🚀 Preloading Eleonor assets...");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const cleanUsername = username.trim()
    const cleanEmail = email.trim()

    if (isRegister) {
      if (/\s/.test(cleanUsername) || /\s/.test(cleanEmail) || /\s/.test(password)) {
        setError("El nombre de usuario, correo o contraseña no pueden contener espacios")
        setIsLoading(false)
        return
      }
    }

    if (isRegister && password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      setIsLoading(false)
      return
    }

    if (isTeacher && teacherKey !== "87654321") {
      setError("Contraseña de docente incorrecta")
      setIsLoading(false)
      return
    }

    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login"
    const body = isRegister
      ? { username: cleanUsername, password, email: cleanEmail, school, classroom, role: isTeacher ? "teacher" : "student", teacher_key: isTeacher ? teacherKey : undefined }
      : { username: cleanUsername, password, role: isTeacher ? "teacher" : "student", teacher_key: isTeacher ? teacherKey : undefined }

    const baseUrl = API_BASE_URL
    try {
      const resp = await fetch(`${baseUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      const data = await resp.json()

      if (!resp.ok) {
        throw new Error(data.detail || "Error en la autenticación")
      }

      if (isRegister) {
        // Si se registró con éxito, pasar a modo login y limpiar campos
        setIsRegister(false)
        setUsername("")
        setPassword("")
        setConfirmPassword("")
        setEmail("")
        setSchool("")
        setClassroom("")
        setIsTeacher(false)
        setTeacherKey("")
        setError("Registro exitoso. Por favor inicia sesión.")
      } else {
        // Si hizo login con éxito, guardar token y notificar al app
        localStorage.setItem("eleonor_token", data.token)
        localStorage.setItem("eleonor_user", JSON.stringify(data.user))
        onLogin()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#012216] via-[#3c5a21_65%] to-[#85a02f] p-4 relative overflow-hidden">
      {/* Background Particles */}
      <Particles
        className="absolute inset-0 pointer-events-none"
        quantity={200}
        ease={80}
        color="#f6f6ed"
        refresh={false}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logos and Title */}
<div className="w-full max-w-md grid grid-cols-2 items-center justify-items-center mb-6 pt-8">

  {/* LOGO SKILLTECH */}
  <div className="flex flex-col items-center">
    <div className="relative w-20 h-20 mb-1">
      <Image
        src="/new-logo.png"
        alt="SkillTech Logo"
        fill
        className="object-contain drop-shadow-[0_0_20px_rgba(208,176,77,0.6)]"
      />
    </div>

    <h1 className="text-4xl font-black bg-gradient-to-r from-[#0d971f] via-[#d0b04d] to-[#d0b04d] bg-clip-text text-transparent tracking-tighter leading-none text-center">
      SkillTech
    </h1>

    <p className="text-[#cae13c]/60 text-[10px] uppercase tracking-[0.3em] font-black mt-1 text-center">
      Learning Ecosystem
    </p>
  </div>

  {/* LOGO LIDERAZGO */}
  <div className="relative w-60 h-36 flex items-center justify-center -translate-x-6">
    <Image
      src="/Logo.png"
      alt="Logo institucional"
      fill
      className="object-contain"
    />
  </div>

</div>

        <Card className="border-[#d0b04d]/30 bg-[#063924]/90 shadow-[0_20px_50px_rgba(6,57,36,0.35)] rounded-2xl">
          <CardHeader>
            <CardTitle className="text-white">{isRegister ? "Crear cuenta" : "Iniciar sesión"}</CardTitle>
            <CardDescription className="text-white/50">
              {isRegister
                ? "Crea una cuenta para comenzar a usar SkillTech"
                : "Ingresa tus credenciales para acceder a tu cuenta"}
            </CardDescription>
            {error && (
              <div className={`mt-2 p-2 rounded text-[10px] font-bold uppercase tracking-widest ${error.includes("exitoso") ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                {error}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white/70 text-xs font-bold uppercase tracking-widest">
                  Usuario
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.replace(/\s/g, ""))
                  }
                  placeholder={isRegister ? "Tu nombre de usuario" : "Usuario"}
                  className="bg-white/5 border-white/10 text-white focus:border-[#d0b04d]/50 transition-colors"
                  required
                  />
              </div>

              {isRegister && (
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/70 text-xs font-bold uppercase tracking-widest">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.replace(/\s/g, ""))}
                    placeholder="correo@ejemplo.com"
                    className="bg-white/5 border-white/10 text-white focus:border-[#d0b04d]/50 transition-colors"
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-white/70 text-xs font-bold uppercase tracking-widest">Contraseña</Label>
                  {!isRegister && (
                    <a href="#" className="text-[10px] text-[#d0b04d] hover:text-white transition-colors uppercase tracking-widest font-black">
                      ¿Olvidaste?
                    </a>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.replace(/\s/g, ""))}
                  placeholder="••••••••"
                  className="bg-white/5 border-white/10 text-white focus:border-[#d0b04d]/50 transition-all h-12 rounded-xl"
                  required
                />
              </div>

              {isRegister && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white/70 text-xs font-bold uppercase tracking-widest">Confirmar contraseña</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value.replace(/\s/g, ""))}
                      placeholder="••••••••"
                      className="bg-white/5 border-white/10 text-white focus:border-[#d0b04d]/50 transition-all h-12 rounded-xl"
                      required
                    />
                  </div>

            <div className="grid grid-cols-2 gap-4">
              {/* COLEGIO */}
              <div className="space-y-2">
                <Label className="text-white/70 text-xs font-bold uppercase tracking-widest">Colegio</Label>
                <Select value={school} onValueChange={setSchool} required>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-[#baef00]/60 focus:ring-[#baef00]/30 transition-all h-12 rounded-xl">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0c1c11] border-[#3c5a21]/50 text-white z-[999] shadow-2xl">
                    <SelectItem value="Francisco Mostajo" className="focus:bg-[#3c5a21] focus:text-[#baef00] cursor-pointer">Francisco Mostajo</SelectItem>
                    <SelectItem value="Carlos José Echavarry Osacar" className="focus:bg-[#3c5a21] focus:text-[#baef00] cursor-pointer">Carlos José Echavarry</SelectItem>
                    <SelectItem value="Franklin Roosevelt" className="focus:bg-[#3c5a21] focus:text-[#baef00] cursor-pointer">Franklin Roosevelt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* GRADO / SECCIÓN */}
              <div className="space-y-2">
                <Label className="text-white/70 text-xs font-bold uppercase tracking-widest">Grado/Sección</Label>
                <Select value={classroom} onValueChange={setClassroom} required>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-[#baef00]/60 focus:ring-[#baef00]/30 transition-all h-12 rounded-xl">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0c1c11] border-[#3c5a21]/50 text-white z-[999] shadow-2xl">
                    <SelectItem value="4A" className="focus:bg-[#3c5a21] focus:text-[#baef00] cursor-pointer">4A</SelectItem>
                    <SelectItem value="4B" className="focus:bg-[#3c5a21] focus:text-[#baef00] cursor-pointer">4B</SelectItem>
                    <SelectItem value="4C" className="focus:bg-[#3c5a21] focus:text-[#baef00] cursor-pointer">4C</SelectItem>
                    <SelectItem value="5A" className="focus:bg-[#3c5a21] focus:text-[#baef00] cursor-pointer">5A</SelectItem>
                    <SelectItem value="5B" className="focus:bg-[#3c5a21] focus:text-[#baef00] cursor-pointer">5B</SelectItem>
                    <SelectItem value="5C" className="focus:bg-[#3c5a21] focus:text-[#baef00] cursor-pointer">5C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
                </>
              )}

              {/* Toggle Docente */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <button
                  type="button"
                  id="teacher-toggle"
                  onClick={() => { setIsTeacher(prev => !prev); setTeacherKey("") }}
                  className={`relative w-10 h-5 rounded-full transition-all duration-300 shrink-0 ${
                    isTeacher ? "bg-[#a3ca02] shadow-[0_0_10px_rgba(163,202,2,0.35)]" : "bg-white/10"
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 ${
                    isTeacher ? "left-5" : "left-0.5"
                  }`} />
                </button>
                <Label htmlFor="teacher-toggle" className="text-white/70 text-xs font-bold uppercase tracking-widest cursor-pointer select-none">
                  ¿Eres docente? Ingresa aquí
                </Label>
              </div>

              {/* Campo contraseña docente */}
              {isTeacher && (
                <div className="space-y-2">
                  <Label htmlFor="teacherKey" className="text-[#d0b04d] text-xs font-bold uppercase tracking-widest">Contraseña de docente (Código)</Label>
                  <Input
                    id="teacherKey"
                    type="password"
                    value={teacherKey}
                    onChange={(e) => setTeacherKey(e.target.value)}
                    placeholder="Ingresa la contraseña o código de docente"
                    className="bg-white/5 border-[#a3ca02]/30 text-white focus:border-[#a3ca02]/70 transition-all h-12 rounded-xl"
                    required
                  />
                  {isRegister && <p className="text-[10px] text-[#a3ca02]/70 uppercase tracking-widest">Solo el personal autorizado puede crear cuentas docentes.</p>}
                </div>
              )}

              <Button type="submit" className="w-full h-12 bg-[#a3ca02] hover:bg-[#b5df08] text-[#063924] font-black uppercase tracking-[0.2em] transition-all duration-500 shadow-xl shadow-[#a3ca02]/20 rounded-xl mt-4">
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {isRegister ? "Creando cuenta..." : "Iniciando sesión..."}
                  </>
                ) : (
                  <>{isRegister ? "Crear cuenta" : "Iniciar sesión"}</>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center w-full">
              {isRegister ? (
                <p className="text-[#f6f6ed]">
                  ¿Ya tienes una cuenta?{" "}
                  <button
                    onClick={() => setIsRegister(false)}
                    className="text-[#a3ca02] hover:underline"
                  >
                    Inicia sesión
                  </button>
                </p>
              ) : (
                <p className="text-[#f6f6ed]">
                  ¿No tienes una cuenta?{" "}
                  <button
                    onClick={() => setIsRegister(true)}
                    className="text-[#d0b04b] hover:underline"
                  >
                    Regístrate
                  </button>
                </p>
              )}
            </div>

            <div>
              <Button
                type="button"
                onClick={() => {
                  if (deferredPrompt) {
                    handleInstallClick();
                  } else {
                    alert(
                      "Para descargar la app, busca el ícono de instalación (una pantalla con una flecha) en la barra de direcciones de tu navegador, web superior derecha. O actívalo desde las opciones de tu navegador móvil 'Agregar a la pantalla principal'."
                    );
                  }
                }}
                className="w-full mb-1 bg-[#a3ca02] hover:bg-[#8fb500] text-[#063924] font-black tracking-widest uppercase transition-all shadow-lg shadow-[#a3ca02]/20"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Descargar App
              </Button>
            </div>

            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#a3ca02]/30"></span>
              </div>

              <div className="relative flex justify-center text-xs">
                <span className="bg-[#1b4b30] px-2 text-white/60">
                  O continúa con
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full pb-4">
              <Button
                type="button"
                onClick={handleGoogleLogin}
                variant="outline"
                className="border-white/20 bg-white/5 hover:bg-[#a3ca02]/20 text-white"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>

              <Button
                variant="outline"
                className="border-white/20 bg-white/5 hover:bg-[#a3ca02]/20 text-white"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
                Facebook
              </Button>
            </div>
          </CardFooter>
        </Card>

        <p className="text-center text-gray-600 text-[10px] mt-8 uppercase tracking-widest">© 2025 SkillTech. Learning Ecosystem.</p>
      </div>
    </div >
  )
}
