export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-ivory-100 font-sans text-ink">
      {children}
    </div>
  );
}
