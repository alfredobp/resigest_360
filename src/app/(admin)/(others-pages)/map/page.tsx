import Calendar from "@/components/calendar/Calendar";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Map from "@/components/Map";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Gis DashBoard Calender | POC Gis",
  description:
    "This is Gis DashBoard Calender page for POC Gis  Tailwind CSS Admin Dashboard Template",
  // other metadata
};
export default function page() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Map" />
      <div className="h-[calc(100vh-200px)] min-h-[600px]">
        <Map />
      </div>
    </div>
  );
}
