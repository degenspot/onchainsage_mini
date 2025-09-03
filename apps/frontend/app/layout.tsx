import "./globals.css";
import { Inter } from "next/font/google";
import { StarknetProvider } from "@/context/StarknetContext";
import { QueryProvider } from "@/providers/query-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "OnChain Sage",
  description: "AI-driven decentralized trading assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StarknetProvider>
          <QueryProvider>
            <div className="min-h-screen">
              {/* <Navbar /> */}
              {children}
            </div>
          </QueryProvider>
        </StarknetProvider>
      </body>
    </html>
  );
}