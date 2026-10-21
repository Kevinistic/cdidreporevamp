import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HomeClient from "../../components/home-client";
import { CarModal } from "../../components/maincard";
import { getCarByToken, getCars } from "../../lib/cars";

type CarPageProps = { params: Promise<{ token: string }> };

// No generateStaticParams: each page embeds the full grid, so they render on demand instead of
// prerendering one copy of the dataset per car.

export async function generateMetadata({ params }: CarPageProps): Promise<Metadata> {
  const { token } = await params;
  const car = await getCarByToken(token);
  if (!car) return {};

  const title = `${car.CarName} | CDID Car Database (Unofficial)`;
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
      siteName: "CDID Car Database (Unofficial)",
      images: car.CarImageUrl ? [{ url: car.CarImageUrl, width: 250, height: 250, alt: car.CarName }] : undefined,
    },
    twitter: { card: "summary", title, description, images: car.CarImageUrl ? [car.CarImageUrl] : undefined },
  };
}

export default async function CarPage({ params }: CarPageProps) {
  const { token } = await params;
  const [cars, car] = await Promise.all([getCars(), getCarByToken(token)]);
  if (!car) notFound();

  return (
    <>
      <HomeClient cars={cars} />
      <CarModal card={car} closeTo="/" />
    </>
  );
}
