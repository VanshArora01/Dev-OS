'use client'

import React from "react"

import { useState } from 'react'

interface MagicBentoProps {
  children: React.ReactNode
  textAutoHide?: boolean
  enableStars?: boolean
  enableSpotlight?: boolean
  enableBorderGlow?: boolean
  enableTilt?: boolean
  enableMagnetism?: boolean
  clickEffect?: boolean
  spotlightRadius?: number
  particleCount?: number
  glowColor?: string
  disableAnimations?: boolean
}

export function MagicBento({
  children,
  textAutoHide = true,
  enableStars = false,
  enableSpotlight = false,
  enableBorderGlow = true,
  enableTilt = false,
  enableMagnetism = false,
  clickEffect = false,
  spotlightRadius = 400,
  particleCount = 12,
  glowColor = '132, 0, 255',
  disableAnimations = false,
}: MagicBentoProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" onMouseMove={handleMouseMove}>
      {children}
    </div>
  )
}

interface MagicBentoItemProps {
  children: React.ReactNode
  title: string
  description: string
  icon?: React.ReactNode
}

export function MagicBentoItem({ children, title, description, icon }: MagicBentoItemProps) {
  return (
    <div className="floating-panel group relative overflow-hidden rounded-xl border border-border/40 p-6 transition-all hover:border-primary/30">
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          {icon}
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      {children}
    </div>
  )
}
