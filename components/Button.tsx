import Link from "next/link";

export function Button({ text, href, className }: { text: string; href: string; className?: string }) {
    return (
        <Link
            href={href}
            className={`bg-primary text-background text-center text-2xl max-w-80 px-10 py-3 my-8 rounded-xl transition-all duration-250 ease-in-out hover:bg-primary-700 hover:text-text ${className}`}
        >
            {text}
        </Link>
    );
}
