import localFont from "next/font/local";

const quicksand = localFont({
    src: "../../public/fonts/Quicksand-Light.woff",
});

export default function Inscriptions() {
    return (
        <div className="flex flex-col items-center flex-1 font-sans bg-black items-center">
            <div className="flex flex-col items-center w-4/5 mt-10">
                <p className={`${quicksand.className} font-bold text-justify`}>Work In Progress : Revenez bientôt !</p>
            </div>
        </div>
    );
}
