import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100 p-6">
        <nav className="mb-6 flex gap-4">
          <a href="/" className="font-semibold">Leaves</a>
          <a href="/members" className="font-semibold">Members & Leave Types</a>
        </nav>
        {children}
      </body>
    </html>
  );
}
