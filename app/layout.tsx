"use client";

import "./globals.css";
import { usePathname } from "next/navigation";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    { label: "List View", href: "/" },
    { label: "Calendar View", href: "/calendar" },
    { label: "Summary View", href: "/summary" },
    { label: "Members & Leave Types", href: "/members" },
  ];

  return (
    <html lang="en">
      <body className="bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <h1 className="text-2xl font-bold mb-4">
              Team Leave Tracker
            </h1>

            <nav className="flex gap-1 border-b">
              {tabs.map(tab => {
                const isActive =
                  pathname === tab.href ||
                  (tab.href !== "/" && pathname.startsWith(tab.href));

                return (
                  <a
                    key={tab.href}
                    href={tab.href}
                    className={`px-4 py-2 font-medium rounded-t transition-colors
                      ${
                        isActive
                          ? "bg-white border border-b-0 border-gray-300 text-blue-600"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }
                    `}
                  >
                    {tab.label}
                  </a>
                );
              })}
            </nav>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
