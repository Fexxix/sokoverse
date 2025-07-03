"use client" // Error boundaries must be Client Components

import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error("Global error caught:", error)

  const handleGoHome = () => {
    window.location.href = "/"
  }

  return (
    // global-error must include html and body tags
    <html lang="en">
      <head>
        <title>System Error - Sokoverse</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/icon.png" />
      </head>
      <body>
        <div className="error-container">
          <div className="error-card">
            <div className="error-header">
              <AlertTriangle className="error-icon" />
              <h1 className="error-title">SYSTEM ERROR</h1>
            </div>

            <div className="error-message">
              <p>Something went wrong in the game engine.</p>
              <p>Don't worry, your progress is safe!</p>
            </div>

            {process.env.NODE_ENV === "development" && (
              <details className="debug-info">
                <summary className="debug-summary">
                  Debug Info (Dev Mode)
                </summary>
                <div className="debug-content">
                  <strong>Error:</strong> {error.message}
                  {error.digest && (
                    <>
                      <br />
                      <strong>Digest:</strong> {error.digest}
                    </>
                  )}
                  {error.stack && (
                    <>
                      <br />
                      <strong>Stack:</strong>
                      <br />
                      {error.stack}
                    </>
                  )}
                </div>
              </details>
            )}

            <div className="error-buttons">
              <button onClick={reset} className="error-button">
                <RefreshCw style={{ width: "1rem", height: "1rem" }} />
                RELOAD GAME
              </button>
              <button
                onClick={handleGoHome}
                className="error-button error-button-secondary"
              >
                <Home style={{ width: "1rem", height: "1rem" }} />
                GO HOME
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
