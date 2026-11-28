"use client";
import React, { useEffect, useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import ProvinceMunicipalityFields from "../form/ProvinceMunicipalityFields";
import { useTenant } from "@/context/TenantContext";
import companyService from "@/services/companyService";
import { toast } from "@/context/ToastContext";
import { getProvinceByPostalCode } from "@/lib/validations/spainLocations";

export default function UserAddressCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const { activeCompany, refreshTenant } = useTenant();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    domicilio_social: "",
    municipio_social: "",
    provincia_social: "",
    codigo_postal_social: "",
  });

  useEffect(() => {
    if (activeCompany) {
      setFormData({
        domicilio_social: activeCompany.domicilio_social || "",
        municipio_social: activeCompany.municipio_social || "",
        provincia_social: activeCompany.provincia_social || "",
        codigo_postal_social: activeCompany.codigo_postal_social || "",
      });
    }
  }, [activeCompany, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) {
      toast.warning("No hay una empresa activa seleccionada.");
      return;
    }

    try {
      setSaving(true);
      await companyService.update(activeCompany.id, {
        domicilio_social: formData.domicilio_social.trim() || undefined,
        municipio_social: formData.municipio_social.trim() || undefined,
        provincia_social: formData.provincia_social.trim() || undefined,
        codigo_postal_social: formData.codigo_postal_social.trim() || undefined,
      });
      await refreshTenant();
      toast.success("Dirección fiscal actualizada correctamente.");
      closeModal();
    } catch (err: any) {
      toast.error(err?.message || "No se pudo actualizar la dirección fiscal.");
    } finally {
      setSaving(false);
    }
  };

  const cityProvince = [activeCompany?.municipio_social, activeCompany?.provincia_social]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Dirección Fiscal de Empresa Activa
            </h4>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Domicilio Social
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {activeCompany?.domicilio_social || "Pendiente de configurar"}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Municipio / Provincia
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {cityProvince || "Pendiente de configurar"}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Código Postal
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {activeCompany?.codigo_postal_social || "—"}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  CIF / NIF
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {activeCompany?.cif || "—"}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openModal}
            disabled={!activeCompany}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                fill=""
              />
            </svg>
            Editar
          </button>
        </div>
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Editar Dirección Fiscal
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Actualiza la dirección social de {activeCompany?.razon_social || "tu empresa"}.
            </p>
          </div>
          <form onSubmit={handleSave} className="flex flex-col">
            <div className="px-2 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div className="lg:col-span-2">
                  <Label>Domicilio Social</Label>
                  <Input
                    type="text"
                    value={formData.domicilio_social}
                    onChange={(e) => setFormData((prev) => ({ ...prev, domicilio_social: e.target.value }))}
                    placeholder="Calle, número, polígono..."
                  />
                </div>

                <ProvinceMunicipalityFields
                  unstyledWrapper
                  provincia={formData.provincia_social}
                  municipio={formData.municipio_social}
                  provinciaId="address_provincia"
                  municipioId="address_municipio"
                  onChange={({ provincia, municipio }) =>
                    setFormData((prev) => ({
                      ...prev,
                      provincia_social: provincia,
                      municipio_social: municipio,
                    }))
                  }
                />

                <div className="col-span-1 lg:col-span-2">
                  <Label>Código Postal</Label>
                  <Input
                    type="text"
                    value={formData.codigo_postal_social}
                    onChange={(e) => {
                      const cp = e.target.value;
                      const detectedProv = getProvinceByPostalCode(cp);
                      setFormData((prev) => ({
                        ...prev,
                        codigo_postal_social: cp,
                        provincia_social: detectedProv || prev.provincia_social,
                      }));
                    }}
                    placeholder="Ej. 41001"
                  />
                </div>

                <div>
                  <Label>CIF / NIF</Label>
                  <Input type="text" value={activeCompany?.cif || ""} readOnly />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button type="button" size="sm" variant="outline" onClick={closeModal} disabled={saving}>
                Cerrar
              </Button>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
