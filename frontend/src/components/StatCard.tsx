type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
};

export default function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <div
      className="group rounded-2xl bg-white/80 backdrop-blur-sm border-2 border-slate-200 
                  p-6 flex flex-col gap-2 shadow-lg hover:shadow-xl 
                  hover:border-blue-300 transition-all duration-300"
    >
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</span>
      <span className="text-4xl font-black bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{value}</span>
      {subtitle && <span className="text-xs text-slate-600 font-medium">{subtitle}</span>}
    </div>
  );
}
