import { webpack } from "next/dist/compiled/webpack/webpack";

/** @type {import('next').NextConfig} */
const nextConfig = {
    // ...other code
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

    //@ts-expect-error meow
    webpack: config => {
        config.plugins.push(
            new webpack.IgnorePlugin({ resourceRegExp: /^zlib-sync$/ }),
            new webpack.IgnorePlugin({ resourceRegExp: /^bufferutil$/ }),
        );
        return config;
    },
};

export default nextConfig;
