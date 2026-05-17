import { glamora } from "@/lib/ui/design-tokens";

type AppInputProps = {
  label: string;
  placeholder?: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export function AppInput({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  error,
}: AppInputProps) {
  return (
    <label className="block">
      <span className={glamora.fieldLabel}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${glamora.field} ${
          error ? "border-red-300 ring-2 ring-red-100" : ""
        }`}
      />
      {error ? <span className="mt-1 block text-xs text-red-500">{error}</span> : null}
    </label>
  );
}
