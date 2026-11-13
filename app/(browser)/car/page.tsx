import type { Metadata } from "next";
import HomeClient from "../../components/home-client";
import { getBoxLinksByCar } from "../../lib/boxes";
import { getCars } from "../../lib/cars";

const title = "The CDID Database (Unofficial)";
const description =
  "Browse every car in Car Driving Indonesia (CDID) on Roblox. Search and filter by price, dealership, gamepass, limited status, and event or removed cars.";

export const metadata: Metadata = {
  alternates: { canonical: "/car" },
  title: { absolute: title },
  description,
  keywords: ["CDID", "Car Driving Indonesia", "Roblox", "car list", "car prices", "dealership", "gamepass"],
  openGraph: {
    title,
    description,
    type: "website",
    siteName: title,
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default async function Page() {
  const [cars, boxesByCar] = await Promise.all([getCars(), getBoxLinksByCar()]);
  return <HomeClient cars={cars} boxesByCar={boxesByCar} />;
}
