import type { StaticImport } from "next/dist/shared/lib/get-img-props";
import { Button } from "./Button";
import { ContactCard } from "./Cards";

export default function Footer({
    contacts,
}: {
    contacts: { icon: string | StaticImport; text: string; href: string }[];
}) {
    return (
        <div className="flex flex-col bg-black p-4">
            <div className="flex flex-col">
                <h2 className="text-2xl">Les places sont limitées alors n&apos;hésite pas!</h2>
                <Button text="S'INSCRIRE" href="/inscriptions" />
            </div>
            <div>
                <h2 className="text-4xl">Contact</h2>
                <div className="grid grid-cols-1 gap-4 p-4">
                    {contacts.map(contact => (
                        <ContactCard icon={contact.icon} text={contact.text} href={contact.href} key={contact.href} />
                    ))}
                </div>
                <p className="text-2xl">© Game* 2026</p>
            </div>
        </div>
    );
}
