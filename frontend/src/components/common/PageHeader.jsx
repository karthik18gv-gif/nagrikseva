export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="bg-[#1a3a6b] text-white px-6 py-6 rounded-xl mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold">{title}</h1>
        {subtitle && <p className="text-blue-200 text-sm mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  )
}
