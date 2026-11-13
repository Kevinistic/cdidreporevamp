import { notFound } from "next/navigation";
import { CarModal } from "../../../components/maincard";
import { getBoxesForCar } from "../../../lib/boxes";
import { getCarByToken } from "../../../lib/cars";

// Opens cars linked from pages other than the car grid (home, boxes). The grid opens its own modal without a request.
// No generateStaticParams: prerendering ~2.8k modal pages per deploy bloated deployment storage.
// Pages render on first request, then are cached for a day (data only changes per build).
export const revalidate = 86400;

export default async function InterceptedCarPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const car = await getCarByToken(token);
  if (!car) notFound();
  return <CarModal card={car} boxes={await getBoxesForCar(car._id)} />;
}
