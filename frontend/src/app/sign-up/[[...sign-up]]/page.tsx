import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-gray-50 dark:to-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold gradient-text mb-2">
            Create Your Account
          </h1>
          <p className="text-muted-foreground">
            Start building autonomous agents today
          </p>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'bg-card border border-border shadow-xl',
              headerTitle: 'text-foreground',
              headerSubtitle: 'text-muted-foreground',
              socialButtonsBlockButton:
                'bg-muted hover:bg-muted/80 border border-border',
              socialButtonsBlockButtonText: 'text-foreground',
              dividerLine: 'bg-border',
              dividerText: 'text-muted-foreground',
              formFieldLabel: 'text-foreground',
              formFieldInput:
                'bg-background border-border focus:ring-primary',
              formButtonPrimary:
                'bg-gradient-to-r from-avalanche-500 to-avalanche-600 hover:from-avalanche-600 hover:to-avalanche-700',
              footerActionLink: 'text-primary hover:text-primary/80',
            },
          }}
        />
      </div>
    </div>
  );
}
