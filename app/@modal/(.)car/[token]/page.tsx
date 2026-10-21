import { notFound } from "next/navigation";
import { CarModal } from "../../../components/maincard";
import { getCarByToken, getCars } from "../../../lib/cars";

export async function generateStaticParams() {
  const cars = await getCars();
  return cars.map((car) => ({ token: car.token }));
}

export default async function InterceptedCarPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const car = await getCarByToken(token);
  if (!car) notFound();
  return <CarModal card={car} />;
}
