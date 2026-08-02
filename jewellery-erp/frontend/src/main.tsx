import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from 'react-error-boundary'
import App from './App'
import './index.css'

function ErrorFallback({error, resetErrorBoundary}: any) {
  return (
    <div role="alert" className="p-10 bg-red-900 text-white min-h-screen">
      <h2 className="text-3xl font-bold mb-4">Something went wrong:</h2>
      <pre className="text-red-200 whitespace-pre-wrap">{error.message}</pre>
      <pre className="text-red-300 mt-4 text-xs whitespace-pre-wrap">{error.stack}</pre>
      <button onClick={resetErrorBoundary} className="mt-6 px-4 py-2 bg-white text-red-900 rounded font-bold">Try again</button>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
