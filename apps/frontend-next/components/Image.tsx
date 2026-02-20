"use client"
import Image from 'next/image'
import React from 'react'

export default function CMSImage({ src, alt, className }: { src?: string, alt?: string, className?: string }) {
  if (!src) return <div className={`bg-gray-200 ${className || ''}`} />
  return (
    <Image src={src} alt={alt || ''} width={1200} height={800} className={className} priority={false} />
  )
}
