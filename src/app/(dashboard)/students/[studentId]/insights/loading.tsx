export default function InsightsLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-pulse">
      {/* Back link */}
      <div className="h-4 w-32 rounded" style={{ background: 'var(--littera-dust)' }} />

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full" style={{ background: 'var(--littera-dust)' }} />
        <div className="flex-1 space-y-2">
          <div className="h-7 w-48 rounded" style={{ background: 'var(--littera-dust)' }} />
          <div className="h-4 w-24 rounded" style={{ background: 'var(--littera-dust)' }} />
        </div>
        <div className="hidden sm:flex gap-3">
          <div className="w-20 h-14 rounded-xl" style={{ background: 'var(--littera-dust)' }} />
          <div className="w-24 h-14 rounded-xl" style={{ background: 'var(--littera-dust)' }} />
        </div>
      </div>

      {/* Evolution chart skeleton */}
      <div
        className="rounded-xl p-5 space-y-3"
        style={{ background: 'var(--littera-paper)', border: '1px solid var(--littera-dust)' }}
      >
        <div className="h-5 w-40 rounded" style={{ background: 'var(--littera-dust)' }} />
        <div className="h-36 w-full rounded-lg" style={{ background: 'var(--littera-mist)' }} />
      </div>

      {/* Competency cards skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-44 rounded" style={{ background: 'var(--littera-dust)' }} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl p-4 space-y-3"
              style={{ background: 'var(--littera-paper)', border: '1px solid var(--littera-dust)' }}
            >
              <div className="h-3 w-8 rounded" style={{ background: 'var(--littera-dust)' }} />
              <div className="h-4 w-24 rounded" style={{ background: 'var(--littera-dust)' }} />
              <div className="h-8 w-16 rounded" style={{ background: 'var(--littera-dust)' }} />
              <div className="h-1.5 w-full rounded-full" style={{ background: 'var(--littera-mist)' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Table skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-44 rounded" style={{ background: 'var(--littera-dust)' }} />
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: 'var(--littera-paper)', border: '1px solid var(--littera-dust)' }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-5 py-4"
              style={{ borderBottom: i < 4 ? '1px solid var(--littera-dust)' : 'none' }}
            >
              <div className="flex-1 h-4 rounded" style={{ background: 'var(--littera-dust)' }} />
              <div className="h-4 w-16 rounded" style={{ background: 'var(--littera-dust)' }} />
              <div className="h-4 w-12 rounded" style={{ background: 'var(--littera-dust)' }} />
              <div className="h-7 w-12 rounded-lg" style={{ background: 'var(--littera-dust)' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
