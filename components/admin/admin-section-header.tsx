export function AdminSectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-8">
      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-rose-400">Glamora</p>
      <h1 className="mt-2 font-[family-name:var(--font-glamora-mark)] text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        {title}
      </h1>
      {subtitle ? <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">{subtitle}</p> : null}
    </header>
  );
}
