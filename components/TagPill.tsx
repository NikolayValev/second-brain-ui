import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TagPillProps {
  name: string
  onClick?: () => void
  active?: boolean
  className?: string
}

export function TagPill({ name, onClick, active, className }: TagPillProps) {
  return (
    <Badge
      variant={active ? 'default' : 'secondary'}
      className={cn(
        'cursor-pointer transition-colors',
        onClick && 'hover:bg-primary/80',
        className
      )}
      onClick={onClick}
    >
      #{name}
    </Badge>
  )
}

interface TagListProps {
  tags: string[]
  onTagClick?: (tag: string) => void
  activeTags?: string[]
  className?: string
}

export function TagList({ tags, onTagClick, activeTags = [], className }: TagListProps) {
  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {tags.map((tag) => (
        <TagPill
          key={tag}
          name={tag}
          active={activeTags.includes(tag)}
          onClick={onTagClick ? () => onTagClick(tag) : undefined}
        />
      ))}
    </div>
  )
}
