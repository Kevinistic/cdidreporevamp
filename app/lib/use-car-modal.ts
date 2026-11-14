import { usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { CardItem } from "../components/card";

export const CAR_PATH_PREFIX = "/car/";

// The open car lives in the URL (/car/<token>) so Back closes the modal, Forward reopens it, and the link can be
// shared. Opening only pushes a history entry: Next keeps rendering the current page, which already holds the car,
// so no request is made. A refresh or a shared link loads the full page from app/car/[token] instead.
export function useCarModal(cars: CardItem[]) {
  const pathname = usePathname();
  const carsByToken = useMemo(() => new Map(cars.map((car) => [car.token, car])), [cars]);
  const openCar = pathname.startsWith(CAR_PATH_PREFIX)
    ? carsByToken.get(pathname.slice(CAR_PATH_PREFIX.length))
    : undefined;
  const openCarModal = useCallback(
    (card: CardItem) => window.history.pushState(null, "", `${CAR_PATH_PREFIX}${card.token}`),
    []
  );

  return { openCar, openCarModal, carsByToken };
}
