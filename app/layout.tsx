import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <h1 className="text-2xl font-bold mb-4">
              Team Leave Tracker
            </h1>

            <nav className="flex gap-2">
              <a
                href="/"
                className="px-4 py-2 rounded-t bg-gray-200 font-medium"
              >
                List View
              </a>
              <a
                href="/calendar"
                className="px-4 py-2 rounded-t bg-gray-200 font-medium"
              >
                Calendar View
              </a>
              <a
                href="/summary"
                className="px-4 py-2 rounded-t bg-gray-200 font-medium"
              >
                Summary View
              </a>
              <a
                href="/members"
                className="px-4 py-2 rounded-t bg-gray-200 font-medium"
              >
                Members & Leave Types
              </a>
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
