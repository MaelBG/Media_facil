import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export default function SortableHeader({
  label,
  sortKey,
  currentSort,
  onSort,
  className = "",
  align = "left",
  subtitle = null,
  children
}) {
  const isActive = currentSort?.key === sortKey;
  const direction = currentSort?.direction;

  const alignClass = align === "center" 
    ? "justify-center text-center" 
    : align === "right" 
    ? "justify-end text-right" 
    : "justify-start text-left";

  return (
    <th
      onClick={() => onSort && sortKey && onSort(sortKey)}
      className={`px-4 py-3.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider border-b border-surface-container cursor-pointer select-none group hover:bg-surface-container/60 transition-colors ${className}`}
      title={label ? `Clique para ordenar por ${typeof label === 'string' ? label : ''}` : 'Clique para ordenar'}
    >
      <div className={`flex items-center gap-1.5 ${alignClass}`}>
        <div className="flex-1">
          {children || (
            <>
              <span>{label}</span>
              {subtitle && <div className="text-[10px] normal-case font-normal text-on-surface-variant/70">{subtitle}</div>}
            </>
          )}
        </div>
        <span className={`transition-opacity shrink-0 ${isActive ? "opacity-100 font-bold text-primary" : "opacity-35 group-hover:opacity-90"}`}>
          {isActive ? (
            direction === "asc" ? (
              <ArrowUp className="w-3.5 h-3.5 text-primary stroke-[2.5]" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-primary stroke-[2.5]" />
            )
          ) : (
            <ArrowUpDown className="w-3.5 h-3.5" />
          )}
        </span>
      </div>
    </th>
  );
}

