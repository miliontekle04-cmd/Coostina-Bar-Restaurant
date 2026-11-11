import { redirect } from "next/navigation";
import { brand } from "@/config/brand";
import { currentAdmin } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await currentAdmin()) redirect("/admin");
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <p className="display text-4xl text-tomato">{brand.name}</p>
      <h1 className="mb-8 mt-2 text-2xl font-bold">Log in to admin</h1>
      <LoginForm />
    </main>
  );
}
