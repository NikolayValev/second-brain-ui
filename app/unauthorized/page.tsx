import { SignInButton } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lock, LogIn } from 'lucide-react'
import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Authentication Required</CardTitle>
          <CardDescription>
            You need to sign in to access this page. Please sign in with your account to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <SignInButton mode="modal">
            <Button className="w-full" size="lg">
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          </SignInButton>
          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full" size="lg">
              Go to Homepage
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
