import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resigest 360 DashBoard SignUp Page | Resigest360",
  description: "This is Resigest 360 DashBoard SignUp Page Resigest360 Dashboard Template",
  // other metadata
};

export default function SignUp() {
  return <SignUpForm />;
}
