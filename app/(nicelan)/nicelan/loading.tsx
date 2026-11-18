export default function Loading() {
    return (
        <>
            <div className="col-start-4 -col-end-1 self-end">
                <h2>Classement</h2>
            </div>
            <div className="col-start-1 -col-end-1 row-start-2 -row-end-1 grid grid-cols-subgrid grid-rows-subgrid">
                <div className="-col-start-8 -col-end-1 row-start-1 row-span-2 grid grid-cols-3 gap-(--gap)">
                    <div className="outline outline-primary shadow-(--shadow-3d-primary) p-[16px] font-bold grid grid-rows-[1fr_2fr_1fr] text-nowrap"></div>
                    <div className="outline outline-primary shadow-(--shadow-3d-primary) p-[16px] font-bold grid grid-rows-[1fr_2fr_1fr] text-nowrap"></div>
                    <div className="outline outline-primary shadow-(--shadow-3d-primary) p-[16px] font-bold grid grid-rows-[1fr_2fr_1fr] text-nowrap"></div>
                </div>
                <div className="outline outline-primary shadow-(--shadow-3d-primary) col-start-4 -col-end-1 -row-start-6 -row-end-1"></div>
            </div>
        </>
    );
}
