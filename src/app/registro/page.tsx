import { Logo } from "@/components/Logo";
import { AuthCard } from "@/components/auth/AuthCard";

export default function RegistroPage() {
  return (
    <>
      <nav className="border-b border-line">
        <div className="mx-auto flex h-19 max-w-6xl items-center px-8">
          <Logo />
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-77px)] items-center justify-center px-6 py-14">
        <AuthCard />
      </div>
    </>
  );
}
