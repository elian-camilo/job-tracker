import { useEffect, useRef } from "react";
import { useForm } from "@/hooks/useForm";
import { useCreateApp, useUpdateApp, useUploadCV } from "@/api/hooks";
import type { ApplicationOut, ApplicationIn, Plataforma } from "@/api/types";
import { STATUS_ORDER, STATUS_LABELS, type Estado } from "@/constants/status";

const PLATAFORMAS = [
  "Torre",
  "GetOnBoard",
  "Manfred",
  "LinkedIn",
  "Otro",
] as const;

interface AppModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingApp: ApplicationOut | null;
  prefillData?: Partial<ApplicationIn> | null;
  onAppCreated?: () => void;
}

const EMPTY_FORM: ApplicationIn = {
  empresa: "",
  rol: "",
  fecha: new Date().toISOString().slice(0, 10),
  estado: "aplicado",
  plataforma: null,
  contacto: null,
  proximo_paso: null,
  notas: null,
  cv_file: null,
  link: null,
  salario_promedio: null,
};

export function AppModal({
  isOpen,
  onClose,
  editingApp,
  prefillData,
  onAppCreated,
}: AppModalProps) {
  const createApp = useCreateApp();
  const updateApp = useUpdateApp();
  const uploadCV = useUploadCV();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { values, setField, reset, errors, validate } =
    useForm<ApplicationIn>(EMPTY_FORM);

  // Pre-fill when editing or promoting from wishlist
  useEffect(() => {
    if (editingApp) {
      reset({
        empresa: editingApp.empresa,
        rol: editingApp.rol,
        fecha: editingApp.fecha,
        estado: editingApp.estado,
        plataforma: editingApp.plataforma ?? null,
        contacto: editingApp.contacto ?? null,
        proximo_paso: editingApp.proximo_paso ?? null,
        notas: editingApp.notas ?? null,
        cv_file: editingApp.cv_file ?? null,
        link: editingApp.link ?? null,
        salario_promedio: editingApp.salario_promedio ?? null,
      });
    } else if (prefillData) {
      reset({
        ...EMPTY_FORM,
        ...prefillData,
      });
    } else {
      reset(EMPTY_FORM);
    }
  }, [editingApp, prefillData, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldErrors = validate({
      empresa: (v) => (!v ? "La empresa es requerida" : null),
      rol: (v) => (!v ? "El rol es requerido" : null),
    });
    if (Object.keys(fieldErrors).length > 0) return;

    const payload: ApplicationIn = {
      ...values,
      plataforma: values.plataforma || null,
      contacto: values.contacto || null,
      proximo_paso: values.proximo_paso || null,
      notas: values.notas || null,
      cv_file: values.cv_file || null,
      link: values.link || null,
      salario_promedio: values.salario_promedio || null,
    };

    if (editingApp) {
      updateApp.mutate(
        { id: editingApp.id, data: payload },
        { onSuccess: onClose }
      );
    } else {
      createApp.mutate(payload, {
        onSuccess: () => {
          onClose();
          if (onAppCreated) onAppCreated();
        },
      });
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const res = await uploadCV.mutateAsync(file);
      setField("cv_file", res.filename);
    } catch (err) {
      alert("Error subiendo el CV");
    }
  };

  const isPending = createApp.isPending || updateApp.isPending || uploadCV.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div className="w-full max-w-lg rounded-[10px] border border-[#E5E7EB] bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1E3A5F]">
            {editingApp ? "Editar aplicación" : "Nueva aplicación"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Empresa */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Empresa <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={values.empresa}
              onChange={(e) => setField("empresa", e.target.value)}
              className="w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#1E3A5F] focus:outline-none"
              placeholder="Ej: Google"
            />
            {errors.empresa && (
              <p className="mt-1 text-xs text-red-500">{errors.empresa}</p>
            )}
          </div>

          {/* Rol */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Rol <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={values.rol}
              onChange={(e) => setField("rol", e.target.value)}
              className="w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#1E3A5F] focus:outline-none"
              placeholder="Ej: Backend Engineer"
            />
            {errors.rol && (
              <p className="mt-1 text-xs text-red-500">{errors.rol}</p>
            )}
          </div>

          {/* Link */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Link de la oferta
            </label>
            <input
              type="url"
              value={values.link ?? ""}
              onChange={(e) => setField("link", e.target.value)}
              className="w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#1E3A5F] focus:outline-none"
              placeholder="Ej: https://..."
            />
          </div>

          {/* Salario Promedio */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Salario promedio
            </label>
            <input
              type="text"
              value={values.salario_promedio ?? ""}
              onChange={(e) => setField("salario_promedio", e.target.value)}
              className="w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#1E3A5F] focus:outline-none"
              placeholder="Ej: $3000 USD (opcional)"
            />
          </div>

          {/* Plataforma + Fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Plataforma
              </label>
              <select
                value={values.plataforma ?? ""}
                onChange={(e) =>
                  setField(
                    "plataforma",
                    (e.target.value || null) as Plataforma | null
                  )
                }
                className="w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#1E3A5F] focus:outline-none"
              >
                <option value="">—</option>
                {PLATAFORMAS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Fecha
              </label>
              <input
                type="date"
                value={values.fecha}
                onChange={(e) => setField("fecha", e.target.value)}
                className="w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#1E3A5F] focus:outline-none"
              />
            </div>
          </div>

          {/* Estado + Contacto */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Estado
              </label>
              <select
                value={values.estado}
                onChange={(e) =>
                  setField("estado", e.target.value as Estado)
                }
                className="w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#1E3A5F] focus:outline-none"
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Contacto
              </label>
              <input
                type="text"
                value={values.contacto ?? ""}
                onChange={(e) =>
                  setField("contacto", e.target.value || null)
                }
                className="w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#1E3A5F] focus:outline-none"
                placeholder="Nombre o LinkedIn"
              />
            </div>
          </div>

          {/* Próximo paso */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Próximo paso
            </label>
            <input
              type="text"
              value={values.proximo_paso ?? ""}
              onChange={(e) =>
                setField("proximo_paso", e.target.value || null)
              }
              className="w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#1E3A5F] focus:outline-none"
              placeholder="Ej: Esperar respuesta HR"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Notas
            </label>
            <textarea
              value={values.notas ?? ""}
              onChange={(e) =>
                setField("notas", e.target.value || null)
              }
              rows={3}
              className="w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#1E3A5F] focus:outline-none"
              placeholder="Notas adicionales..."
            />
          </div>

          {/* CV Upload */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              CV personalizado (PDF)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                disabled={uploadCV.isPending}
              >
                {uploadCV.isPending ? "Subiendo..." : "Seleccionar PDF"}
              </button>
              
              {values.cv_file && (
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="truncate text-xs text-emerald-600">
                    ✓ {values.cv_file.split("_").slice(1).join("_")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setField("cv_file", null)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Quitar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-white hover:bg-[#162d4a] disabled:opacity-50"
            >
              {isPending
                ? "Guardando..."
                : editingApp
                  ? "Guardar cambios"
                  : "Agregar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
