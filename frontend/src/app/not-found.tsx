import Link from "next/link";
import { Bot, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-8 text-center px-4">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse rounded-full bg-avalanche-500/20 blur-2xl" />
          <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-avalanche-500 to-avalanche-600 shadow-2xl shadow-avalanche-500/30">
            <Bot className="h-16 w-16 text-white" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h1 className="text-7xl font-bold text-zinc-900 dark:text-zinc-100">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-zinc-700 dark:text-zinc-300">
            Page Not Found
          </h2>
          <p className="max-w-md text-zinc-500 dark:text-zinc-400">
            Oops! The page you&apos;re looking for doesn&apos;t exist. It might have been 
            moved or deleted.
          </p>
        </div>

        <div className="flex gap-4">
          <Link href="/">
            <Button variant="outline" size="lg" className="gap-2">
              <Home className="h-5 w-5" />
              Go Home
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="gradient" size="lg" className="gap-2">
              <Bot className="h-5 w-5" />
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
