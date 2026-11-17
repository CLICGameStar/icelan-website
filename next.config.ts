const nextConfig = {
    serverExternalPackages: ["discord.js", "@discordjs/ws", "zlib-sync", "bufferutil", "utf-8-validate"],
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
