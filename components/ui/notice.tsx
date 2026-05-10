type NoticeProps = {
  type: "success" | "error";
  message: string;
};

export function Notice({ type, message }: NoticeProps) {
  return (
    <div
      className={`rounded-2xl px-4 py-3 text-sm ${
        type === "success"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-600"
      }`}
    >
      {message}
    </div>
  );
}
