import { Button } from "@/components/Button";
import { BigCard, InfoCard } from "@/components/Cards";
import DirectusImage from "@/components/DirectusImage";
import { directus } from "@/directus";
import type { Icelan, IcelanCollab, IcelanSponsor } from "@/directus-config/types/aliases";
import { readItems } from "@directus/sdk";
import localFont from "next/font/local";
import Image from "next/image";
import Link from "next/link";

const quicksand = localFont({
    src: "../public/fonts/Quicksand-Light.woff",
});

export default async function Home() {
    const icelan = (await directus().request(readItems("icelan"))) as Icelan;

    const sponsors = (await directus().request(readItems("icelan_sponsors"))) as IcelanSponsor[];

    const collabs = (await directus().request(readItems("icelan_collabs"))) as IcelanCollab[];

    const start_date = new Date(icelan.start!).toLocaleDateString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
    });
    const end_date = new Date(icelan.end!).toLocaleDateString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div className="flex flex-col bg-black items-center">
            <div className="flex flex-col flex-1 font-sans bg-black items-center px-8">
                <div className="flex flex-col items-center">
                    <h1 className="text-center text-[var(--secondary)]">Bienvenue à ICeLAN !</h1>
                    <h2>7ème édition</h2>
                </div>
                <div className="flex flex-col items-center md:flex-row md:justify-center md:gap-10">
                    <Image
                        src="/images/jeux.svg"
                        width={128}
                        height={128}
                        alt="Jeux"
                        className="hidden w-1/3 md:block"
                    />
                    <div className="flex flex-col items-center mb-8">
                        <Button text="S'INSCRIRE" href="/inscriptions" />
                        <div className="">
                            <InfoCard icon="/icons/date.svg">
                                {start_date} -<br />
                                {end_date}
                            </InfoCard>
                            <InfoCard icon="/icons/place.svg">Bâtiment BC, EPFL</InfoCard>
                            <InfoCard icon="/icons/price.svg">
                                Etudiant·e·s: 15 CHF,
                                <br />
                                Autres: 20 CHF
                            </InfoCard>
                        </div>
                    </div>
                    <Image
                        src="/images/borne.svg"
                        width={128}
                        height={128}
                        alt="Arcade"
                        className="w-4/5 md:w-1/3 mb-8"
                    />
                </div>
                <div className="flex flex-col items-center">
                    <h2>Qu&apos;est-ce que c&apos;est ?</h2>
                    <p className={`${quicksand.className} text-justify font-bold max-w-160 mb-10`}>
                        ICeLAN est un week-end de tournois de jeux vidéo et de jeux de plateau à l&apos;EPFL.
                        L&apos;événement s&apos;axe principalement autour des tournois, se succédant tout au long du
                        week-end, mais offre également aux participant·e·s des animations autour du jeu vidéo et du jeu
                        tout court pour les divertir durant tout l&apos;événement ! L&apos;inscription à
                        l&apos;événement offre aux participant·e·s l&apos;accès à tous les
                        <span className="text-[var(--secondary)]"> tournois</span>, aux
                        <span className="text-[var(--secondary)]"> animations</span> sur tout le site, et des
                        <span className="text-[var(--secondary)]"> repas chauds, snacks et boissons</span> tout au long
                        de l&apos;événement.
                    </p>
                    <div>
                        <BigCard icon="/icons/trophy.svg" header="Tournois & Lots">
                            ICeLAN, c&apos;est de la compétition durant de très nombreux tournois sur de très nombreux
                            jeux vidéo et jeux de société. Gagne de superbes lots tout le long de l&apos;événement.
                        </BigCard>
                        <BigCard icon="/icons/game.svg" header="Diverses Animations">
                            Plutôt envie de chiller ? ICeLAN, c&apos;est aussi des animations incroyables, que ce soit
                            en ligne ou hors ligne - il y en a pour tous les goûts.
                        </BigCard>
                        <BigCard icon="/icons/food.svg" header="Repas, Snacks et Boissons">
                            Nous tenons à ce que ce weekend soit entièrement un weekend de détente. Ainsi, de vrais
                            repas te sont offerts tout le long de l&apos;événement, et il y a possibilité de prendre des
                            douches sur place.
                        </BigCard>
                    </div>
                    <Button text="Plus d'infos" href="/informations" />
                </div>
                <div className="grid grid-cols-2 w-full gap-8 mb-8 md:flex justify-evenly">
                    <div className="flex flex-col items-center">
                        <p className="text-[var(--secondary)] !text-6xl">100</p>
                        <p>Participant·e·s</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <p className="text-[var(--secondary)] !text-6xl">40</p>
                        <p>Staffs</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <p className="text-[var(--secondary)] !text-6xl">22</p>
                        <p>Tournois</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <p className="text-[var(--secondary)] !text-6xl">13</p>
                        <p>Animations</p>
                    </div>
                </div>
                <h2 className="!text-4xl mb-4">Sponsors</h2>
                <div className="flex flex-wrap justify-evenly mb-8">
                    {sponsors.map(sponsor => (
                        <DirectusImage
                            cover={true}
                            img={sponsor.logo}
                            name={sponsor.name}
                            key={sponsor.id}
                            className="w-32 object-contain my-1"
                            sizes="512px"
                        />
                    ))}
                </div>
            </div>
            <div className="bg-white w-full flex flex-col items-center p-4">
                <h2 className="text-black text-center !text-lg w-full">
                    Merci à tout·e·s ceux qui rendent ICeLAN possible!
                </h2>
                <div className="flex flex-wrap justify-evenly w-full">
                    {collabs.map(collab =>
                        collab.website ? (
                            <Link href={collab.website} key={collab.id}>
                                <DirectusImage
                                    cover={true}
                                    img={collab.logo}
                                    name={collab.name}
                                    className="w-32 my-1"
                                    sizes="512px"
                                />
                            </Link>
                        ) : (
                            <DirectusImage
                                cover={true}
                                img={collab.logo}
                                name={collab.name}
                                className="w-32 my-1"
                                sizes="512px"
                                key={collab.id}
                            />
                        ),
                    )}
                </div>
            </div>
        </div>
    );
}
