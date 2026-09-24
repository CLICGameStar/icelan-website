import type { StaticImport } from "next/dist/shared/lib/get-img-props";
import Link from "next/link";
import { Button } from "./Button";
import { ContactCard } from "./Cards";

export default function Footer({
    contacts,
}: {
    contacts: { icon: string | StaticImport; text: string; href: string }[];
}) {
    return (
        <div className="flex flex-col bg-black">
            <div className="flex flex-col md:flex-row md:justify-between p-8">
                <div className=" flex flex-col max-w-xl md:pl-8">
                    <h2 className="text-2xl">Les places sont limitées alors n&apos;hésite pas!</h2>
                    <Button text="S'INSCRIRE" href="/inscriptions" className="" />
                </div>
                <div className="">
                    <h2 className="text-4xl md:mb-4">Contact</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 md:gap-4">
                        {contacts.map(contact => (
                            <ContactCard
                                icon={contact.icon}
                                text={contact.text}
                                href={contact.href}
                                key={contact.href}
                            />
                        ))}
                    </div>
                </div>
            </div>
            <Link href="https://clicgamestar.ch" className="text-2xl">
                © Game* 2026
            </Link>
        </div>
    );
}
