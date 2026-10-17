import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Iniciar Sesión | Resigest360",
  description: "Iniciar sesión en Resigest 360",
};

export default function SignIn() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[300px] w-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
