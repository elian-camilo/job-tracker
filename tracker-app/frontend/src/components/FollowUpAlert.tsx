import type { ApplicationOut } from "@/api/types";

interface FollowUpAlertProps {
  needFollowup: string[];
  applications: ApplicationOut[];
}

export function FollowUpAlert({
  needFollowup,
  applications,
}: FollowUpAlertProps) {
  if (needFollowup.length === 0) return null;

  const empresas = needFollowup
    .map((id) => applications.find((a) => a.id === id)?.empresa)
    .filter(Boolean)
    .join(", ");

  return (
    <div className="rounded-[10px] border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <span className="font-semibold">
        {needFollowup.length}{" "}
        {needFollowup.length === 1
          ? "aplicación lleva"
          : "aplicaciones llevan"}{" "}
        más de 7 días sin respuesta:
      </span>{" "}
      {empresas}
    </div>
  );
}
