import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar Sesión | Resigest360",
  description: "Iniciar sesión en Resigest 360",
};

export default function SignIn() {
  return <SignInForm />;
}
