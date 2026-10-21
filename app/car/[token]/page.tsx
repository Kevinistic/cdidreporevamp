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
  const description = `${car.CarName} in Car Driving Indonesia: Rp. ${car.Price.toLocaleString("de-DE")}, ${car.Dealership || "no dealership"}, ${car.Engine || "engine unknown"}.`;
  return {
    title,
    description,
    alternates: { canonical: `/car/${token}` },
    openGraph: { title, description, type: "website", images: car.CarImageUrl ? [car.CarImageUrl] : undefined },
    twitter: { card: "summary", title, description },
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
