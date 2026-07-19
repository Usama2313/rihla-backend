import { requireChatGPTUser } from "../chatgpt-auth";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";
const OWNER_EMAIL = "mirali200@gmail.com";

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  if (user.email.toLowerCase() !== OWNER_EMAIL) return <main className="adminDenied"><h1>Owner access required</h1><p>This editing workspace is restricted to the Rihla site owner.</p><a href="/">Return to Rihla</a></main>;
  return <AdminDashboard owner={user.displayName} />;
}
