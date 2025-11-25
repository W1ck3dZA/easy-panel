import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SipProvider } from "@/contexts/SipContext";
import Softphone from "@/components/Softphone";

export const metadata: Metadata = {
  title: "FOP Panel - Company Directory",
  description: "Company phonebook directory application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <SipProvider>
              {children}
              <Softphone />
            </SipProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
