import { FAQCard, VerticalCard } from "@/components/Cards";
import { directus } from "@/directus";
import type { IcelanAnimation, IcelanFaq } from "@/directus-config/types/aliases";
import { readItems } from "@directus/sdk";
import localFont from "next/font/local";
import Image from "next/image";

const quicksand = localFont({
    src: "../../public/fonts/Quicksand-Light.woff",
});

export default async function Informations() {
    const faqs = (await directus().request(readItems("icelan_faqs"))) as IcelanFaq[];
    const animations = (await directus().request(readItems("icelan_animations"))) as IcelanAnimation[];

    return (
        <div className="flex flex-col flex-1 font-sans bg-black items-center">
            <h2 className="text-4xl mb-4">Tournois</h2>
            <p className={`${quicksand.className} text-xl font-bold max-w-160 mb-10 text-justify`}>
                Affrontez-vous sur nos nombreux tournois ! Des grands classiques comme League of Legends, Minecraft ou
                Smash, aux jeux que vous avez suggéré, choisissez vos compétitions peu importe votre niveau.
            </p>

            <h2 className="text-4xl mb-4">Animations</h2>
            <p className={`${quicksand.className} text-xl font-bold max-w-160 mb-10 text-justify`}>
                Vous attendez votre tournoi? Venez prendre une pause en profitant de nos diverses animations! Il y en a
                pour tous les goûts!
                <br />
                <br />
                La <span className="text-[var(--secondary)]">liste des animations</span> est disponible ci-dessous!
            </p>
            <ul className="list-disc mb-10">
                {animations.map(animation => (
                    <li key={animation.animation} className="text-xl">
                        {animation.animation}
                    </li>
                ))}
            </ul>
            <h2 className="text-4xl">Plan</h2>
            <Image src="/images/plan.svg" alt="Plan" width={128} height={128} className="w-3/5 mb-10" />
            <h2 className="text-4xl mb-4">Informations importantes</h2>
            <div className="flex w-full flex-wrap justify-center gap-16 px-16 mb-10">
                <VerticalCard icon="/icons/price.svg" header="Prix">
                    Le prix est de 15CHF pour les étudiant·e·s, et 20 CHF pour les autres participant·e·s! Ça te donne
                    droit à l&apos;accès à l&apos;événement, à toutes activités, tous les repas, boissons et snacks, et
                    plus encore... Viens payer en avance durant nos permanences!
                </VerticalCard>
                <VerticalCard icon="/icons/date.svg" header="Lieu & Date">
                    ICeLAN aura lieu au sein du Bâtiment BC de l&apos;EPFL, du 6 Décembre 2025 à 9h au 7 Décembre 2025 à
                    10h, en non-stop. Tu peux y accéder avec le Métro M1 (arrêt EPFL), ou encore avec les bus 1, 31, 701
                    ou 705. Il y a également des espaces de parking pour les voitures et vélos.
                </VerticalCard>
                <VerticalCard icon="/icons/food.svg" header="Nourritures & Boissons">
                    Nous fournissons à chacun·e de nos participant·e·s un repas du midi et du soir le samedi, et un
                    petit dej&apos; le dimanche. Nous te proposons également toutes sortes de boissons non-alcoolisées,
                    ainsi que des snacks. Le tout inclus dans le prix, sans supplément!
                </VerticalCard>
                <VerticalCard icon="/icons/group.svg" header="Respect & Règles">
                    Lors de ton inscription, il te sera demandé d&apos;accepter{" "}
                    <a href="/reglement" className="text-(--tertiary) underline hover:text-(--primary)">
                        le règlement de l&apos;événement
                    </a>
                    , ainsi que notre charte. En gros, il s&apos;agit de respecter les autres et soi-même, et de
                    respecter le matériel et les lieux. Nous nous réservons le droit de te virer de l&apos;événement en
                    cas de comportement inacceptable.
                </VerticalCard>
                <VerticalCard icon="/icons/question-mark.svg" header="Questions & Remarques">
                    Près d&apos;une quarantaine de staffs seront à ta disposition durant tout l&apos;événement. Si
                    néanmoins tu as des questions ou des remarques avant, n&apos;hésite pas à nous écrire à{" "}
                    <a
                        href="mailto:gamestar.clic@epfl.ch"
                        className="text-(--tertiary) underline hover:text-(--primary)"
                    >
                        gamestar.clic@epfl.ch!
                    </a>
                </VerticalCard>
            </div>
            <h2 className="text-4xl mb-10">Foire Aux Questions</h2>
            <ul className="max-w-160">
                {faqs.map(faq => (
                    <li className="mb-10" key={faq.question}>
                        <FAQCard question={faq.question}>{faq.answer}</FAQCard>
                    </li>
                ))}
            </ul>
        </div>
    );
}
