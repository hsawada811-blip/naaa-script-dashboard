"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/", label: "ダッシュボード" },
  { href: "/scripts/quick", label: "B案生成" },
  { href: "/scripts", label: "台本一覧" },
  { href: "/reference-scripts", label: "参考台本" },
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
    <nav className="bg-primary text-primary-foreground shadow-sm">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-12">
        <div className="flex items-center gap-1">
          <Link href="/" className="font-bold text-base mr-5 tracking-tight">
            ScriptDB
          </Link>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                pathname === link.href
                  ? "bg-white/20 text-white font-medium"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-white/60 hover:text-white transition-colors"
        >
          ログアウト
        </button>
      </div>
    </nav>
  );
}
