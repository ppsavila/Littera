export default function DashboardLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Greeting */}
      <div className="space-y-2">
        <div className="littera-skeleton h-8 w-56" />
        <div className="littera-skeleton h-4 w-64" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-4"
            style={{ background: 'var(--littera-paper)', border: '1px solid var(--littera-dust)' }}
          >
            <div className="littera-skeleton h-3 w-16 mb-3" />
            <div className="littera-skeleton h-7 w-12 mb-2" />
            <div className="littera-skeleton h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <div className="littera-skeleton h-10 w-36 rounded-lg" />
        <div className="littera-skeleton h-10 w-44 rounded-lg" />
      </div>

      {/* Recent essays */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="littera-skeleton h-5 w-40" />
          <div className="littera-skeleton h-4 w-16" />
        </div>
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: 'var(--littera-paper)', border: '1px solid var(--littera-dust)' }}
        >
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-5 py-3.5"
              style={{ borderBottom: i < 4 ? '1px solid var(--littera-dust)' : 'none' }}
            >
              <div className="littera-skeleton w-8 h-8 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="littera-skeleton h-4 w-48" />
                <div className="littera-skeleton h-3 w-32" />
              </div>
              <div className="littera-skeleton h-5 w-12 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
