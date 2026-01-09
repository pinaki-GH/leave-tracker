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

            <nav className="flex gap-2">
              {tabs.map(tab => {
                const isActive =
                  pathname === tab.href ||
                  (tab.href !== "/" && pathname.startsWith(tab.href));

                return (
                  <a
                    key={tab.href}
                    href={tab.href}
                    className={`px-4 py-2 rounded-md font-medium transition-colors
                      ${
                        isActive
                          ? "bg-blue-600 text-white shadow"
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
