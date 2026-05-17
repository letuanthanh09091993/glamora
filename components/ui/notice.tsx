type NoticeProps = {
  type: "success" | "error";
  message: string;
};

export function Notice({ type, message }: NoticeProps) {
  return (
    <div
      role="alert"
      className={`rounded-2xl border px-4 py-3 text-sm ${
        type === "success"
          ? "border-emerald-200/80 bg-emerald-50 text-emerald-800"
          : "border-red-200/80 bg-red-50 text-red-700"
      }`}
    >
      {message}
    </div>
  );
}
