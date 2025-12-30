import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gis DashBoard SignUp Page | POC Gis",
  description: "This is Gis DashBoard SignUp Page POC Gis Dashboard Template",
  // other metadata
};

export default function SignUp() {
  return <SignUpForm />;
}
