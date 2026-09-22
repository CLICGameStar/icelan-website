import Footer from "@/components/Footer";
import Header from "@/components/Header";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const red_hands = localFont({
    src: "../public/fonts/KGRedHands.woff",
});

export const metadata: Metadata = {
    title: "ICeLAN",
    description: "25h de tournois de jeux vidéo et jeux de plateau!",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="fr" className="h-full antialiased">
            <body className={`min-h-full flex flex-col ${red_hands.className}`}>
                <Header
                    navLinks={[
                        { name: "ACCUEIL", href: `/` },
                        { name: "INFOS", href: `/informations` },
                        { name: "RÈGLEMENT", href: `/reglement` },
                        { name: "INSCRIPTIONS", href: `/inscriptions` },
                        { name: "STAFFING", href: `/staffing` },
                    ]}
                />
                {children}
                <Footer
                    contacts={[
                        {
                            icon: "/icons/email-logo-round.svg",
                            text: "gamestar.clic@epfl.ch",
                            href: "mailto:gamestar.clic@epfl.ch",
                        },
                        {
                            icon: "/icons/telegram-logo-round.svg",
                            text: "@CLICGamestar",
                            href: "https://t.me/CLICGameStar",
                        },
                        {
                            icon: "/icons/instagram-logo-round.svg",
                            text: "@CLICGamestar",
                            href: "https://instagram.com/CLICGameStar",
                        },
                        {
                            icon: "/icons/discord-logo-round.svg",
                            text: "Discord ICeLAN",
                            href: "https://discord.gg/tMaKxY8V4M",
                        },
                    ]}
                />
            </body>
        </html>
    );
}
