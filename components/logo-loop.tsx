'use client'

import React from "react"

interface LogoLoopProps {
  logos: Array<{ name: string; icon: React.ReactNode }>
  speed?: number
  direction?: 'left' | 'right'
  logoHeight?: number
  gap?: number
  hoverSpeed?: number
  scaleOnHover?: boolean
  fadeOut?: boolean
  fadeOutColor?: string
  ariaLabel?: string
}

export function LogoLoop({
  logos,
  speed = 100,
  direction = 'left',
  logoHeight = 60,
  gap = 60,
  hoverSpeed = 0,
  scaleOnHover = false,
  fadeOut = false,
  fadeOutColor = '#ffffff',
  ariaLabel = 'Technology partners',
}: LogoLoopProps) {
  const animationDirection = direction === 'left' ? 'scroll-left' : 'scroll-right'

  return (
    <div className="relative overflow-hidden" aria-label={ariaLabel}>
      {fadeOut && (
        <>
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-32 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-32 bg-gradient-to-l from-background to-transparent" />
        </>
      )}
      <div
        className="flex gap-16 py-8"
        style={{
          animation: `${animationDirection} ${speed}s linear infinite`,
        }}
      >
        {[...logos, ...logos].map((logo, i) => (
          <div
            key={i}
            className="flex flex-shrink-0 items-center justify-center transition-transform"
            style={{
              height: logoHeight,
              ...(scaleOnHover && { ':hover': { transform: 'scale(1.1)' } }),
            }}
          >
            {logo.icon}
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes scroll-left {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        @keyframes scroll-right {
          from {
            transform: translateX(-50%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}
