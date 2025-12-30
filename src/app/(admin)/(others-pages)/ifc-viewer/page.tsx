import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IFCViewer from "@/components/IFC";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Visor IFC/BIM | MapSig",
  description: "Visualización de archivos IFC y modelos BIM",
};

export default function IFCViewerPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      <PageBreadcrumb pageTitle="Visor IFC/BIM" />
      <div className="flex-1 min-h-[600px]">
        <IFCViewer />
      </div>
    </div>
  );
}
