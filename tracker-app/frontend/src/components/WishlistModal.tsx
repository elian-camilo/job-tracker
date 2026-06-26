import { useEffect } from "react";
import { useForm } from "@/hooks/useForm";
import { useCreateWishlistItem, useUpdateWishlistItem } from "@/api/hooks";
import type { WishlistItemIn, WishlistItemOut } from "@/api/types";

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: WishlistItemOut | null;
}

const EMPTY_FORM: WishlistItemIn = {
  nombre: "",
  link: null,
  notas: null,
};

export function WishlistModal({ isOpen, onClose, editingItem }: WishlistModalProps) {
  const createItem = useCreateWishlistItem();
  const updateItem = useUpdateWishlistItem();

  const { values, setField, reset, errors, validate } =
    useForm<WishlistItemIn>(EMPTY_FORM);

  useEffect(() => {
    if (editingItem) {
      reset({
        nombre: editingItem.nombre,
        link: editingItem.link ?? null,
        notas: editingItem.notas ?? null,
      });
    } else {
      reset(EMPTY_FORM);
    }
  }, [editingItem, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldErrors = validate({
      nombre: (v) => (!v ? "El nombre es requerido" : null),
    });
    if (Object.keys(fieldErrors).length > 0) return;

    const payload: WishlistItemIn = {
      ...values,
      link: values.link || null,
      notas: values.notas || null,
    };

    if (editingItem) {
      updateItem.mutate(
        { id: editingItem.id, data: payload },
        { onSuccess: onClose }
      );
    } else {
      createItem.mutate(payload, { onSuccess: onClose });
    }
  }

  const isPending = createItem.isPending || updateItem.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div className="w-full max-w-lg rounded-[10px] border border-[#E5E7EB] bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1E3A5F]">
            {editingItem ? "Editar propuesta" : "Nueva propuesta"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={values.nombre}
              onChange={(e) => setField("nombre", e.target.value)}
              className="w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#1E3A5F] focus:outline-none"
              placeholder="Ej: Senior Python Dev - Google"
            />
            {errors.nombre && (
              <p className="mt-1 text-xs text-red-500">{errors.nombre}</p>
            )}
          </div>

          {/* Link */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Link de la propuesta
            </label>
            <input
              type="url"
              value={values.link ?? ""}
              onChange={(e) => setField("link", e.target.value)}
              className="w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#1E3A5F] focus:outline-none"
              placeholder="Ej: https://..."
            />
          </div>

          {/* Notas */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Notas
            </label>
            <textarea
              value={values.notas ?? ""}
              onChange={(e) => setField("notas", e.target.value)}
              rows={4}
              className="w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#1E3A5F] focus:outline-none"
              placeholder="Ej: Requiere Django y React. Remoto."
            />
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
                : editingItem
                  ? "Guardar cambios"
                  : "Agregar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
