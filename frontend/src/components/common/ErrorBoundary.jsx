import React from 'react'

/**
 * ErrorBoundary
 * Catches any runtime render error in the tree below it and shows a
 * readable message instead of React unmounting everything and leaving
 * a blank white page.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[NagrikSeva] Render error caught by ErrorBoundary:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-10 max-w-lg w-full text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-lg font-black text-slate-800">Something went wrong on this page</h1>
          <p className="text-xs text-slate-500 mt-2">
            The page failed to render. The rest of the portal is still working — use the
            buttons below to recover.
          </p>
          <pre className="mt-4 text-[10px] text-left bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-auto max-h-36 text-red-600">
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <div className="flex gap-2 justify-center mt-5">
            <button onClick={() => this.setState({ error: null })} className="btn-secondary text-xs">
              Try Again
            </button>
            <button onClick={() => { window.location.href = '/' }} className="btn-primary text-xs">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }
}
