'use client'

import { Leaf, Search } from 'lucide-react'

export default function IdentifyingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      {/* Animated circle */}
      <div className="relative w-32 h-32 mb-8">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-sage-200 animate-pulse" />
        
        {/* Spinning ring */}
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-sage-500 animate-spin" />
        
        {/* Inner content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center">
            <Leaf className="w-8 h-8 text-sage-500 animate-breathe" />
          </div>
        </div>
      </div>

      {/* Loading dots */}
      <div className="flex gap-2">
        <div className="w-2 h-2 bg-sage-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-sage-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-sage-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}
