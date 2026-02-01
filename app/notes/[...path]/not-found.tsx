import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <FileQuestion className="h-24 w-24 text-muted-foreground/50 mb-6" />
      <h1 className="text-2xl font-bold mb-2">Note Not Found</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        The note you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <div className="flex gap-4">
        <Link href="/">
          <Button>Go to Dashboard</Button>
        </Link>
        <Link href="/search">
          <Button variant="outline">Search Notes</Button>
        </Link>
      </div>
    </div>
  )
}
