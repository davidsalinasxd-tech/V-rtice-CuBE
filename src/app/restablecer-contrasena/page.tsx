import { NavOscuroSimple, PaginaOscura } from "@/components/PaginaOscura";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function RestablecerContrasenaPage() {
  return (
    <PaginaOscura>
      <NavOscuroSimple />

      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-6 py-14">
        <ResetPasswordForm />
      </div>
    </PaginaOscura>
  );
}
