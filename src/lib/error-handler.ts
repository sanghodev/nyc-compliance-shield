
import { NextResponse } from 'next/server'

/**
 * Standardized error response and logging
 */
export function handleError(error: any, context: string) {
  console.error(`[Error][${context}]:`, error)

  const message = error instanceof Error ? error.message : 'An unexpected error occurred'
  const isDev = process.env.NODE_ENV === 'development'

  return NextResponse.json({
    error: 'Internal Server Error',
    message: isDev ? message : 'Safe error message for production',
    // stack: isDev ? error.stack : undefined // Hide stack in production
  }, { status: 500 })
}

/**
 * Wrapper for API routes to handle errors consistently
 */
export function withErrorHandler(handler: Function, context: string) {
  return async (...args: any[]) => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleError(error, context)
    }
  }
}
