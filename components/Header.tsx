"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Header({ navLinks }: { navLinks: { name: string; href: string }[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const openMenu = () => setIsOpen(!isOpen);

    return (
        <div className="flex items-center justify-between bg-black font-sans text-2xl">
            <div
                className={`flex flex-col fixed z-10 top-0 left-0 w-full h-full bg-white ${isOpen === false ? "hidden" : ""}`}
            >
                <Image
                    src="/icons/cross.svg"
                    alt="Burger menu icon"
                    width={16}
                    height={16}
                    className={"size-32 m-4 self-end"}
                    onClick={openMenu}
                />
                <ul className="flex-1 flex flex-col items-center gap-10">
                    {navLinks.map(link => (
                        <li key={link.href}>
                            <Link href={link.href} className="text-3xl text-black" onClick={openMenu}>
                                {link.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
            <Link href="/">
                <Image
                    src="/images/logo-white.svg"
                    width={128}
                    height={128}
                    alt="ICeLAN Logo"
                    className="m-4 size-32"
                />
            </Link>
            <ul className="hidden md:flex flex-1 items-center justify-evenly gap-12 mx-10">
                {navLinks.map(link => (
                    <li key={link.href}>
                        <Link href={link.href} className="p-2 hover:text-[var(--secondary)]">
                            {link.name}
                        </Link>
                    </li>
                ))}
            </ul>
            <Image
                src="/icons/burger-menu.svg"
                alt="Burger menu icon"
                width={16}
                height={16}
                className={(isOpen === true ? "hidden " : "") + "size-32 m-4 md:hidden"}
                onClick={openMenu}
            />
        </div>
    );
}
