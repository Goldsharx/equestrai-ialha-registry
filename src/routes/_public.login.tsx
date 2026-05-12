import { Link, createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_public/login")({
  head: () => ({
    meta: [
      { title: "Login — EquestRai" },
      { name: "description", content: "Log in to your IALHA EquestRai account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-xl border bg-card p-8 shadow-sm">
        <h1 className="font-heading text-2xl text-primary">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Log in to your IALHA registry account.
        </p>
        <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            Log in
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          New to IALHA?{" "}
          <Link to="/signup" className="font-semibold text-accent-foreground underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
