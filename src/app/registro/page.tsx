import { NavOscuroSimple, PaginaOscura } from "@/components/PaginaOscura";
import { AuthCard } from "@/components/auth/AuthCard";

export default function RegistroPage() {
  return (
    <PaginaOscura>
      <NavOscuroSimple />

      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-6 py-14">
        <AuthCard />
      </div>
    </PaginaOscura>
  );
}
