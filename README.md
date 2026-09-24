## Installation

clone the project and then

```bash
git switch v2026

#install submodules
git submodule update --init --recursive

#install npm packages
npm i
```

## Getting Started

```bash
docker compose up

# load and populate directus
directus-config/load.sh
directus-config/populate.sh
```

Open [http://localhost](http://localhost) with your browser to see the website and [https://localhost/directus](https://localhost/directus) to see the Directus.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
