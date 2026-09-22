import Link from "next/link";

export function Button({ text, href }: { text: string; href: string }) {
    return (
        <Link
            href={href}
            className="bg-[var(--primary)] text-black text-2xl px-10 py-3 my-8 rounded-xl transition-all duration-250 ease-in-out hover:bg-[var(--dark-primary)] hover:text-white"
        >
            {text}
        </Link>
    );
}
