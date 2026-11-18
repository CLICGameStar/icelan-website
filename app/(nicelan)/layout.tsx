import { Inter } from "next/font/google";
import Link from "next/link";
import "./nicelan.css";

const inter = Inter({
    subsets: ["latin"],
});

export default async function NicelanLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="fr">
            <body className={`min-h-screen w-screen ${inter.className} antialiased`}>
                <div className="h-screen w-screen grid grid-cols-10 grid-rows-8 gap-(--gap) p-(--gap)">
                    <div className="col-start-1 col-span-3 self-end">
                        <h1>NICeLAN</h1>
                    </div>
                    <div className="bg-primary shadow-(--shadow-3d-primary-inverted) col-start-1 col-span-3 row-start-2 -row-end-1 grid grid-rows-subgrid items-end px-(--gap-s)">
                        <Link href="/nicelan">
                            <h3>Classement</h3>
                        </Link>
                        <Link href="/nicelan/tournois">
                            <h3>Tournois</h3>
                        </Link>
                        <Link href="/nicelan/speedrun">
                            <h3>Speedruns</h3>
                        </Link>
                    </div>
                    {children}
                </div>
            </body>
        </html>
    );
}
