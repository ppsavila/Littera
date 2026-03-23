export default function EssayWorkspaceLoading() {
  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-4rem)]">
      {/* Workspace header bar */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{
          background: 'var(--littera-paper)',
          borderBottom: '1px solid var(--littera-dust)',
        }}
      >
        <div className="littera-skeleton h-4 w-4 rounded" />
        <div className="littera-skeleton h-5 w-48" />
        <div className="littera-skeleton h-5 w-16 rounded-full ml-1" />
        <div className="flex-1" />
        <div className="littera-skeleton h-8 w-24 rounded-lg" />
        <div className="littera-skeleton h-8 w-8 rounded-lg" />
      </div>

      {/* Error marker toolbar */}
      <div
        className="flex items-center gap-2 px-4 py-2 flex-shrink-0"
        style={{
          background: 'var(--littera-paper)',
          borderBottom: '1px solid var(--littera-dust)',
        }}
      >
        {[...Array(4)].map((_, i) => (
          <div key={i} className="littera-skeleton h-7 w-20 rounded-full" />
        ))}
      </div>

      {/* Mobile tab bar (visible sm:hidden) */}
      <div
        className="flex sm:hidden flex-shrink-0"
        style={{ borderBottom: '1px solid var(--littera-dust)', background: 'var(--littera-paper)' }}
      >
        <div className="flex-1 py-2 flex justify-center">
          <div className="littera-skeleton h-4 w-20" />
        </div>
        <div className="flex-1 py-2 flex justify-center">
          <div className="littera-skeleton h-4 w-16" />
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop: annotation toolbar strip */}
        <div
          className="hidden sm:flex flex-col gap-2 px-2 py-3 flex-shrink-0"
          style={{
            background: 'var(--littera-paper)',
            borderRight: '1px solid var(--littera-dust)',
            width: 48,
          }}
        >
          {[...Array(5)].map((_, i) => (
            <div key={i} className="littera-skeleton h-8 w-8 rounded-lg mx-auto" />
          ))}
        </div>

        {/* Document area */}
        <div
          className="flex-1 flex flex-col items-center justify-start gap-4 pt-8 px-4 overflow-auto"
          style={{ background: 'var(--littera-parchment)' }}
        >
          {/* Zoom controls skeleton */}
          <div className="littera-skeleton h-8 w-32 rounded-lg sticky top-2 z-10" />
          {/* Document page skeleton */}
          <div
            className="littera-skeleton rounded-lg shadow-lg w-full max-w-[640px]"
            style={{ aspectRatio: '1 / 1.414' }}
          />
        </div>

        {/* Desktop: scoring panel */}
        <div
          className="hidden sm:flex flex-col flex-shrink-0 gap-4 p-4 overflow-auto"
          style={{
            width: 320,
            background: 'var(--littera-paper)',
            borderLeft: '1px solid var(--littera-dust)',
          }}
        >
          <div className="littera-skeleton h-5 w-32 mb-2" />
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl p-4"
              style={{ background: 'var(--littera-mist)', border: '1px solid var(--littera-dust)' }}
            >
              <div className="littera-skeleton h-4 w-24 mb-3" />
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((__, j) => (
                  <div key={j} className="littera-skeleton h-8 flex-1 rounded-md" />
                ))}
              </div>
              <div className="littera-skeleton h-16 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
