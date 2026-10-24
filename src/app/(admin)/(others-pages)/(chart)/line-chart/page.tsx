import LineChartOne from "@/components/charts/line/LineChartOne";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { type Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Gráfico de Líneas | Resigest360",
  description: "Página de gráficos de líneas en Resigest 360",
};
export default function LineChart() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Gráfico de Líneas" />
      <div className="space-y-6">
        <ComponentCard title="Gráfico de Líneas">
          <LineChartOne />
        </ComponentCard>
      </div>
    </div>
  );
}
