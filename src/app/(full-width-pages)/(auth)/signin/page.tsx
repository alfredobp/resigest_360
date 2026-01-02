import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resigest 360 DashBoard SignIn Page | Resigest360",
  description: "This is Resigest 360 DashBoard Signin Page Resigest360 Dashboard Template",
};

export default function SignIn() {
  return <SignInForm />;
}
