import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import MapPointsTable from "@/components/tables/MapPointsTable";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Puntos de Interés | MapSig",
  description: "Gestión de puntos de interés en el mapa",
};

export default function BasicTables() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Puntos de Interés" />
      <div className="space-y-6">
        <ComponentCard title="Gestión de Puntos del Mapa">
          <MapPointsTable />
        </ComponentCard>
      </div>
    </div>
  );
}
