import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

/**
 * Custom 404 page.
 * Displayed when a route is not found.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-iris/10">
          <FileQuestion className="h-8 w-8 text-iris" />
        </div>

        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-text-primary">404</h1>
          <h2 className="text-xl font-medium text-text-primary">
            Page not found
          </h2>
          <p className="text-text-secondary">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/">
            <Button variant="primary" leftIcon={<Home className="h-4 w-4" />}>
              Go to dashboard
            </Button>
          </Link>

          <Link href="javascript:history.back()">
            <Button variant="secondary" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Go back
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
