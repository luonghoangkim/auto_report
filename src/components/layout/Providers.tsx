import { ToastProvider } from "@/components/layout/Toast";
import { AuthProvider } from "@/components/layout/AuthProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}
