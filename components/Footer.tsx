import type { StaticImport } from "next/dist/shared/lib/get-img-props";
import { Button } from "./Button";
import { ContactCard } from "./Cards";

export default function Footer({
    contacts,
}: {
    contacts: { icon: string | StaticImport; text: string; href: string }[];
}) {
    return (
        <div className="flex flex-col justify-between bg-black">
            <div className="flex-2 flex flex-col items-start m-10 mr-0 mb-0">
                <p className="text-2xl">
                    Les places sont limitées <br /> donc n&apos;hésite pas!
                </p>
                <Button text="S'INSCRIRE" href="/inscriptions" />
                <p className="text-2xl">© Game* 2026</p>
            </div>
            <div className="flex-3 my-10 ml-0 mr-0">
                <p className="text-4xl">Contact</p>
                <div className="grid grid-cols-1 gap-4 p-4">
                    {contacts.map(contact => (
                        <ContactCard icon={contact.icon} text={contact.text} href={contact.href} key={contact.href} />
                    ))}
                </div>
            </div>
        </div>
    );
}
