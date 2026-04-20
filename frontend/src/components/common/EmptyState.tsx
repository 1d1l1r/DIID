import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
        <Icon size={24} className="text-zinc-600" />
      </div>
      <p className="text-zinc-300 font-medium mb-1">{title}</p>
      {description && <p className="text-zinc-500 text-sm mb-5">{description}</p>}
      {action}
    </div>
  )
}
