"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

import { getAuthErrorMessage } from "@/lib/authErrors";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleForgotPassword = async () => {
    setError(null);
    setInfoMessage(null);
    if (!email.trim()) {
      setError("Introduce tu correo electrónico arriba y pulsa de nuevo para recibir el enlace de recuperación.");
      return;
    }
    try {
      setResetting(true);
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
      });
      if (resetError) {
        setError(getAuthErrorMessage(resetError.message));
        return;
      }
      setInfoMessage("Si existe una cuenta con ese correo, te hemos enviado un enlace para restablecer tu contraseña.");
    } catch {
      setError("No se pudo enviar el correo de recuperación. Inténtalo de nuevo.");
    } finally {
      setResetting(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(getAuthErrorMessage(signInError.message));
        setLoading(false);
        return;
      }

      // Redirect to target path or dashboard on successful login (prevent Open Redirect)
      const redirectedFrom = searchParams.get('redirectedFrom');
      const isSafeInternalPath = Boolean(
        redirectedFrom &&
        redirectedFrom.startsWith('/') &&
        !redirectedFrom.startsWith('//') &&
        !redirectedFrom.includes('\\') &&
        redirectedFrom !== '/' &&
        redirectedFrom !== '/signin'
      );
      const destination = isSafeInternalPath ? redirectedFrom! : '/app';

      router.push(destination);
      router.refresh();
    } catch {
      setError(getAuthErrorMessage(null));
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Volver al inicio
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Iniciar Sesión
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Introduce tu correo y contraseña para acceder a la plataforma
            </p>
          </div>
          <div>
            {error && (
              <div className="p-3 mb-4 text-sm text-red-800 bg-red-100 rounded-lg dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}
            {infoMessage && (
              <div className="p-3 mb-4 text-sm text-emerald-800 bg-emerald-100 rounded-lg dark:bg-emerald-900/20 dark:text-emerald-400">
                {infoMessage}
              </div>
            )}
            <form onSubmit={handleSignIn}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Correo Electrónico <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input 
                    placeholder="info@ejemplo.com" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>
                    Contraseña <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Introduce tu contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Recordar sesión
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={resetting}
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400 disabled:opacity-50"
                  >
                    {resetting ? "Enviando..." : "¿Has olvidado tu contraseña?"}
                  </button>
                </div>
                <div>
                  <Button 
                    type="submit"
                    className="w-full" 
                    size="sm"
                    disabled={loading}
                  >
                    {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                  </Button>
                </div>
                {process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCESS === 'true' && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-800 text-center">
                    <Link
                      href="/accesos-prueba"
                      className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                    >
                      Entrar con cuentas de prueba por perfil (Productor, Gestor, Transportista) →
                    </Link>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
