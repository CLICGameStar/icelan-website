import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async redirects() {
        return [
            {
                source: "/inscriptions",
                destination: "https://clic.epfl.ch/clicketing/icelan-2026",
                permanent: true,
            },
            {
                source: "/staffing",
                destination: "https://forms.gle/Zc6t94EfuaCHWDtk9",
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
