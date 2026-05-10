import { UserRole } from "@/lib/auth-types";

type RoleCardProps = {
  role: UserRole;
  title: string;
  description: string;
  active: boolean;
  onSelect: (role: UserRole) => void;
};

export function RoleCard({
  role,
  title,
  description,
  active,
  onSelect,
}: RoleCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(role)}
      className={`rounded-3xl border p-4 text-left transition-all duration-300 ${
        active
          ? "border-pink-300 bg-pink-50 shadow-md"
          : "border-black/10 bg-white hover:-translate-y-0.5 hover:border-pink-200"
      }`}
    >
      <p className="font-semibold text-black">{title}</p>
      <p className="mt-1 text-sm text-gray-600">{description}</p>
    </button>
  );
}
