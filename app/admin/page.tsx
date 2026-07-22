import { getChatGPTUser } from "../chatgpt-auth";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";
const OWNER_EMAIL = "mirali200@gmail.com";

export default async function AdminPage() {
  const user = await getChatGPTUser();
  const ownerName = user ? user.displayName : "Admin";
  return <AdminDashboard owner={ownerName} />;
}
