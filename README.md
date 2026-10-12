## Installation

clone the project and then

```bash
#install submodules
git submodule update --init --recursive

#install npm packages
npm i
```

### Boot everything up

docker compose up

### Load and populate directus

```bash
directus-config/load.sh
directus-config/populate.sh
```

Open [http://localhost](http://localhost) with your browser to see the website and [https://localhost/directus](https://localhost/directus) to see the Directus.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
