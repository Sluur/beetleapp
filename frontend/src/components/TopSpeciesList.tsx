type SpeciesCount = {
  label: string;
  count: number;
};

type TopSpeciesListProps = {
  items: SpeciesCount[];
};

export default function TopSpeciesList({ items }: TopSpeciesListProps) {
  if (!items.length) {
    return (
      <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50">
        <div className="text-slate-400 text-3xl mb-2">🔬</div>
        <p className="text-sm text-slate-600 font-medium">Todavía no hay especies en este rango de fechas</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white/80 backdrop-blur-sm shadow-lg">
      <table className="min-w-full text-sm">
        <thead className="bg-linear-to-r from-blue-50 to-indigo-50 border-b-2 border-slate-200">
          <tr>
            <th className="text-left px-6 py-4 font-bold text-slate-700 uppercase tracking-wide text-xs">Especie</th>
            <th className="text-right px-6 py-4 font-bold text-slate-700 uppercase tracking-wide text-xs">Observaciones</th>
          </tr>
        </thead>
        <tbody className="divide-y-2 divide-slate-100">
          {items.map((s, index) => (
            <tr key={s.label} className="hover:bg-blue-50/50 transition-colors duration-200">
              <td className="px-6 py-4 font-medium text-slate-900">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg 
                                 bg-linear-to-br from-blue-500 to-indigo-500 text-white text-xs font-bold"
                  >
                    {index + 1}
                  </span>
                  <span>{s.label}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <span
                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg 
                               bg-linear-to-r from-blue-500 to-indigo-500 text-white font-bold text-xs"
                >
                  {s.count}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
