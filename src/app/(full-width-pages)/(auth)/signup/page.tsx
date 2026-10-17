import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registrarse | Resigest360",
  description: "Crear una cuenta en Resigest 360",
};

export default function SignUp() {
  return <SignUpForm />;
}
