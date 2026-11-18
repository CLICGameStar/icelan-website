import { getParticipants } from "@/database/participants";

export default async function Nicelan() {
    const participants = await getParticipants();
    return (
        <>
            <div className="col-start-4 -col-end-1 self-end">
                <h2>Classement</h2>
            </div>
            <div className="col-start-1 -col-end-1 row-start-2 -row-end-1 grid grid-cols-subgrid grid-rows-subgrid">
                <div className="-col-start-8 -col-end-1 row-start-1 row-span-2 grid grid-cols-3 grid-rows-subgrid gap-(--gap)">
                    {participants
                        .sort((a, b) => a.points - b.points)
                        .slice(0, 3)
                        .map((p, i) => (
                            <div
                                key={i}
                                className="row-start-1 -row-end-1 outline outline-primary shadow-(--shadow-3d-primary) font-bold grid grid-rows-subgrid items-end text-nowrap overflow-hidden"
                            >
                                <p className="inline-block text-4xl pl-(--gap-s)">Place N°{i + 1}</p>
                                <p className="inline-block text-7xl animate-(--marquee) pb-(--gap-s) pl-[100%]">
                                    {p.username}
                                </p>
                            </div>
                        ))}
                </div>
                <div className="outline outline-primary shadow-(--shadow-3d-primary) col-start-4 -col-end-1 -row-start-6 -row-end-1 grid grid-rows-subgrid pl-(--gap-s)">
                    {participants
                        .sort((a, b) => a.points - b.points)
                        .slice(3)
                        .map((p, i) => (
                            <p key={i} className="inline-block text-3xl self-end">
                                {i + 4}. {p.username}
                            </p>
                        ))}
                </div>
            </div>
        </>
    );
}
