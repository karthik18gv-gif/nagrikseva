export default function LoadingSpinner({ size = 'md', text = '' }) {
  const s = { sm:'w-5 h-5', md:'w-8 h-8', lg:'w-12 h-12' }[size]
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className={`${s} border-4 border-[#1a3a6b] border-t-transparent rounded-full animate-spin`}></div>
      {text && <p className="text-slate-500 text-sm">{text}</p>}
    </div>
  )
}
