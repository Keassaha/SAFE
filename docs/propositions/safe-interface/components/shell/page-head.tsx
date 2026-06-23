export function PageHead({
  trail,
  current,
  title,
  idLabel,
  idValue,
}: {
  trail: string;
  current: string;
  title: string;
  idLabel: string;
  idValue: string;
}) {
  return (
    <>
      <div className="font-mono text-xs text-muted mb-2.5">
        {trail} / <b className="text-ink font-medium">{current}</b>
      </div>
      <div className="flex items-end justify-between mb-6">
        <h1 className="font-serif text-[31px]">{title}</h1>
        <div className="font-mono text-[12.5px] text-muted text-right">
          {idLabel}
          <br />
          {idValue}
        </div>
      </div>
    </>
  );
}
