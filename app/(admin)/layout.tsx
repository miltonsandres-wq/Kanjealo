import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminSidebar } from "./admin/_components/AdminSidebar";
import { AdminTopbar } from "./admin/_components/AdminTopbar";

const ADMIN_EMAIL = "miltonsandres13@gmail.com";

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  if (!user) redirect("/sign-in");

  const email = user.emailAddresses[0]?.emailAddress;
  if (email !== ADMIN_EMAIL) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-cream">
      <AdminSidebar />
      <div className="pl-64">
        <AdminTopbar />
        <main className="pt-20 p-8">{children}</main>
      </div>
    </div>
  );
}
