'use client'

import React from "react"

import { useState } from 'react'

interface ClickSparkProps {
  children: React.ReactNode
  sparkColor?: string
  sparkSize?: number
  sparkRadius?: number
  sparkCount?: number
  duration?: number
}

export function ClickSpark({
  children,
  sparkColor = '#ffffff',
  sparkSize = 10,
  sparkRadius = 15,
  sparkCount = 8,
  duration = 400,
}: ClickSparkProps) {
  const [sparks, setSparks] = useState<Array<{ id: number; x: number; y: number }>>([])

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newSpark = { id: Date.now(), x, y }
    setSparks((prev) => [...prev, newSpark])

    setTimeout(() => {
      setSparks((prev) => prev.filter((spark) => spark.id !== newSpark.id))
    }, duration)
  }

  return (
    <div className="relative" onClick={handleClick}>
      {children}
      {sparks.map((spark) => (
        <div
          key={spark.id}
          className="pointer-events-none absolute"
          style={{
            left: spark.x,
            top: spark.y,
          }}
        >
          {Array.from({ length: sparkCount }).map((_, i) => {
            const angle = (i / sparkCount) * Math.PI * 2
            const distance = sparkRadius
            return (
              <div
                key={i}
                className="absolute animate-[spark_0.4s_ease-out_forwards]"
                style={{
                  width: sparkSize,
                  height: sparkSize,
                  background: sparkColor,
                  borderRadius: '50%',
                  '--angle-x': `${Math.cos(angle) * distance}px`,
                  '--angle-y': `${Math.sin(angle) * distance}px`,
                } as React.CSSProperties}
              />
            )
          })}
        </div>
      ))}
      <style jsx>{`
        @keyframes spark {
          to {
            transform: translate(var(--angle-x), var(--angle-y));
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
