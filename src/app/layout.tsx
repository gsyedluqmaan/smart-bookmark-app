import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "Bookmarks",
  description: "Your personal library of links and resources.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
