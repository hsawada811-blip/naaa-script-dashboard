"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/", label: "ダッシュボード" },
  { href: "/scripts", label: "台本一覧" },
  { href: "/scripts/new", label: "新規入力" },
  { href: "/appeals", label: "訴求管理" },
  { href: "/lp", label: "記事LP" },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="border-b bg-background">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-1">
          <Link href="/" className="font-bold text-lg mr-4">
            ScriptDB
          </Link>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                pathname === link.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          ログアウト
        </Button>
      </div>
    </nav>
  );
}
