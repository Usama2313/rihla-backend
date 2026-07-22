import { cookies } from "next/headers";
import AdminDashboard from "./AdminDashboard";
import AdminLogin from "./AdminLogin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get("rihla_admin_auth")?.value === "true";

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  return <AdminDashboard owner="Admin" />;
}
