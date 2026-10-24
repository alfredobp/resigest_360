import BarChartOne from "@/components/charts/bar/BarChartOne";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { type Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Gráfico de Barras | Resigest360",
  description: "Página de gráficos de barras en Resigest 360",
};

export default function page() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Gráfico de Barras" />
      <div className="space-y-6">
        <ComponentCard title="Gráfico de Barras">
          <BarChartOne />
        </ComponentCard>
      </div>
    </div>
  );
}
