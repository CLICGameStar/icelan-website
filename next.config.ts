import { webpack } from "next/dist/compiled/webpack/webpack";

/** @type {import('next').NextConfig} */
const nextConfig = {
    // ...other code

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
