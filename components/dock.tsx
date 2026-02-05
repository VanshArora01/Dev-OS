'use client'

import React from "react"

import { useState } from 'react'

interface DockProps {
  items: Array<{ id: string; icon: React.ReactNode; label: string }>
  panelHeight?: number
  baseItemSize?: number
  magnification?: number
}

export function Dock({
  items,
  panelHeight = 68,
  baseItemSize = 50,
  magnification = 70,
}: DockProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <div
      className="floating-panel inline-flex items-center gap-2 rounded-2xl border border-border/40 bg-card/60 px-4 backdrop-blur-xl"
      style={{ height: panelHeight }}
    >
      {items.map((item, index) => {
        const distance = hoveredIndex !== null ? Math.abs(index - hoveredIndex) : 999
        const scale = distance === 0 ? 1.4 : distance === 1 ? 1.2 : 1
        const size = baseItemSize * scale

        return (
          <div
            key={item.id}
            className="flex cursor-pointer items-center justify-center rounded-lg bg-secondary/50 transition-all hover:bg-secondary"
            style={{
              width: size,
              height: size,
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {item.icon}
          </div>
        )
      })}
    </div>
  )
}
