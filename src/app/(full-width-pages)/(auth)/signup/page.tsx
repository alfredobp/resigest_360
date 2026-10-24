import SignUpForm from "@/components/auth/SignUpForm";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Registrarse | Resigest360",
  description: "Crear una cuenta en Resigest 360",
};

export default function SignUp() {
  return <SignUpForm />;
}
