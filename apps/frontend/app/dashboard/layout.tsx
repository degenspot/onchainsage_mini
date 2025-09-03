"use client"

import { useState, ReactNode } from "react"
import Link from "next/link"
import {
  Bell,
  ChevronDown,
  Coins,
  LineChart,
  LogOut,
  MessageSquare,
  Moon,
  ScrollText,
  Settings,
  Sun,
  User,
  Wallet,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { WalletConnect } from "@/components/wallet-connect"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark")

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  // Set initial theme
  useState(() => {
    if (typeof window !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark")
    }
  }, [])

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <Sidebar className="border-r">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-4 py-2">
              <Coins className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">OnChain Sage</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {[
                    { icon: LineChart, label: "Dashboard", href: "/dashboard" },
                    { icon: ScrollText, label: "Prophecies", href: "/dashboard/prophecies" },
                    { icon: MessageSquare, label: "Social Sentiment", href: "/social" },
                    { icon: Wallet, label: "Wallet", href: "/wallet" },
                    { icon: Settings, label: "Settings", href: "/settings" },
                  ].map((item, index) => (
                    <SidebarMenuItem key={index}>
                      <Link href={item.href} className="w-full">
                        <SidebarMenuButton>
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="p-4">
              <WalletConnect />
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
          <header className="flex h-16 min-h-[4rem] items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-6 shrink-0">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
              {/* The title can be dynamic based on the page */}
              <h1 className="text-lg font-semibold">Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button className="h-9 w-9 p-0 rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground">
                <Bell className="h-4 w-4" />
                <span className="sr-only">Notifications</span>
              </Button>
              <Button
                className="h-9 w-9 p-0 rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
                onClick={toggleTheme}
              >
                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <span className="sr-only">Toggle theme</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="h-8 gap-2 rounded-md border border-input bg-background px-3 text-xs shadow-sm hover:bg-accent hover:text-accent-foreground">
                    <User className="h-4 w-4" />
                    <span className="hidden md:inline-flex">John Doe</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 w-full h-[calc(100vh-4rem)] overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
