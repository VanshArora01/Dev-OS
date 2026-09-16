'use client'

import React from "react"

import { useEffect, useRef, useState } from 'react'

interface ScrollStackProps {
  children: React.ReactNode
}

export function ScrollStack({ children }: ScrollStackProps) {
  return <div className="space-y-32 py-20">{children}</div>
}

interface ScrollStackItemProps {
  children: React.ReactNode
}

export function ScrollStackItem({ children }: ScrollStackItemProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.3 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [])

  return (
    <div
      ref={ref}
      className={`mx-auto max-w-3xl px-6 text-center transition-all duration-1000 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
      }`}
    >
      {children}
    </div>
  )
}
