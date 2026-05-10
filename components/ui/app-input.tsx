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
      <span className="mb-2 block text-sm font-medium text-gray-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition ${
          error
            ? "border-red-300 ring-2 ring-red-100"
            : "border-black/10 focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
        }`}
      />
      {error ? <span className="mt-1 block text-xs text-red-500">{error}</span> : null}
    </label>
  );
}
