import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CarDetails } from "../../components/maincard";
import { getBoxesForCar } from "../../lib/boxes";
import { getCarByToken, getCars } from "../../lib/cars";

type CarPageProps = { params: Promise<{ token: string }> };

// Every car page is built at deploy, so visits are plain static files: no function, no ISR reads or writes.
// That is only affordable because this page holds one car (a few KB), not the whole car list. Don't add the
// grid back here: at 1.37 MB a page, 2,787 prebuilt pages filled the deployment storage quota.
// Inside the site, a tile on the car grid opens the modal from the grid's own data (components/home-client), and
// car links on other pages open it through app/@modal.
export async function generateStaticParams() {
  const cars = await getCars();
  return cars.map((car) => ({ token: car.token }));
}

// Unknown tokens get the static 404 instead of rendering on demand.
export const dynamicParams = false;

export async function generateMetadata({ params }: CarPageProps): Promise<Metadata> {
  const { token } = await params;
  const car = await getCarByToken(token);
  if (!car) return {};

  const title = `${car.CarName}`;
  const status = [car.Legacy && "No longer in-game", car.Inaccurate && "May be inaccurate"].filter(Boolean).join(" · ");
  // Discord keeps newlines in the description, so each detail gets its own line next to the thumbnail.
  const description = [
    `Rp. ${car.Price.toLocaleString("de-DE")}`,
    `Dealership: ${car.Dealership || "N/A"}`,
    `Limited: ${car.Limited ?? "No"}`,
    `Gamepass: ${car.Gamepass ?? "No"}`,
    `Engine: ${car.Engine || "N/A"}`,
    status,
  ]
    .filter(Boolean)
    .join("\n");
  // "summary" card + small square image = text on the left, thumbnail on the right.
  return {
    title,
    description,
    alternates: { canonical: `/car/${token}` },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "The CDID Database (Unofficial)",
      images: car.CarImageUrl ? [{ url: car.CarImageUrl, width: 250, height: 250, alt: car.CarName }] : undefined,
    },
    twitter: { card: "summary", title, description, images: car.CarImageUrl ? [car.CarImageUrl] : undefined },
  };
}

export default async function CarPage({ params }: CarPageProps) {
  const { token } = await params;
  const car = await getCarByToken(token);
  if (!car) notFound();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-6">
      <h1 className="sr-only">{car.CarName}</h1>
      <div>
        <Link
          href="/car"
          prefetch={false}
          className="inline-block rounded-md border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-800"
        >
          Browse all cars
        </Link>
      </div>
      <div className="flex flex-col gap-6 rounded-2xl border border-zinc-700 bg-zinc-950 p-6 md:flex-row md:items-center md:justify-between">
        <CarDetails card={car} boxes={await getBoxesForCar(car._id)} />
      </div>
    </main>
  );
}
