import type { StaticImport } from "next/dist/shared/lib/get-img-props";
import localFont from "next/font/local";
import Image from "next/image";
import Link from "next/link";

const quicksand = localFont({
    src: "../public/fonts/Quicksand-Light.woff",
});

export function BigCard({
    icon,
    header,
    children,
}: {
    icon: string | StaticImport;
    header: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col">
            <Image width={128} height={128} src={icon} alt="Icon" className="aspect-square size-24 pr-4 self-center" />
            <h3 className="text-2xl mb-2">{header}</h3>
            <p className={`${quicksand.className} text-xl font-bold max-w-120 text-justify`}>{children}</p>
        </div>
    );
}

export function VerticalCard({
    icon,
    header,
    children,
}: {
    icon: string | StaticImport;
    header: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col mb-4 max-w-60">
            <div className="flex items-center">
                <Image width={128} height={128} src={icon} alt="Icon" className="aspect-square size-16 pr-4" />
                <h3 className="text-xl mb-2">{header}</h3>
            </div>
            <p className={`${quicksand.className} text-xl font-bold`}>{children}</p>
        </div>
    );
}

export function ContactCard({ icon, text, href }: { icon: string | StaticImport; text: string; href: string }) {
    return (
        <Link href={href} className="flex items-center">
            <Image width={128} height={128} src={icon} alt="Icon" className="aspect-square size-10 m-2" />
            <p className="text-lg">{text}</p>
        </Link>
    );
}

export function InfoCard({ icon, children }: { icon: string | StaticImport; children: React.ReactNode }) {
    return (
        <div className="flex items-center">
            <Image
                src={icon}
                alt="Icon"
                width={128}
                height={128}
                className="aspect-square size-16 pr-4 fill-(--tertiary)"
            />
            <p className="md:text-xl text-base">{children}</p>
        </div>
    );
}

export function FAQCard({ question, children }: { question: string; children: React.ReactNode }) {
    return (
        <div className="mb-4">
            <h3 className="text-2xl mb-2">{question}</h3>
            <p className={`${quicksand.className} text-xl font-bold max-w-120 text-justify`}>{children}</p>
        </div>
    );
}
