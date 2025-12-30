import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gis DashBoard SignIn Page | POC Gis",
  description: "This is Gis DashBoard Signin Page POC Gis Dashboard Template",
};

export default function SignIn() {
  return <SignInForm />;
}
