'use client'

import { useSearchParams } from 'next/navigation'

interface SortSelectProps {
  sort: string
  options: { value: string; label: string }[]
}

export function SortSelect({ sort, options }: SortSelectProps) {
  const searchParams = useSearchParams()

  function buildSortUrl(newSort: string) {
    const p = new URLSearchParams(searchParams.toString())
    p.set('sort', newSort)
    p.delete('page')
    return `/search?${p.toString()}`
  }

  return (
    <select
      className="md:hidden border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white"
      defaultValue={sort}
      onChange={(e) => { window.location.href = buildSortUrl(e.target.value) }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}
