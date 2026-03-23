export default function EssaysLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="littera-skeleton h-8 w-36" />
          <div className="littera-skeleton h-4 w-40" />
        </div>
        <div className="littera-skeleton h-10 w-32 rounded-lg flex-shrink-0" />
      </div>

      {/* Stats strip */}
      <div className="flex gap-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="littera-skeleton h-10 w-24 rounded-lg"
          />
        ))}
      </div>

      {/* List */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--littera-paper)', border: '1px solid var(--littera-dust)' }}
      >
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-5 py-4"
            style={{ borderBottom: i < 7 ? '1px solid var(--littera-dust)' : 'none' }}
          >
            <div className="littera-skeleton w-9 h-9 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="littera-skeleton h-4 w-52" />
              <div className="littera-skeleton h-3 w-36" />
            </div>
            <div className="littera-skeleton h-6 w-14 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
