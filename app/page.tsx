import HomeClient from "./components/home-client";
import { getCars } from "./lib/cars";

export default async function Page() {
  const cars = await getCars();
  return <HomeClient cars={cars} />;
}
