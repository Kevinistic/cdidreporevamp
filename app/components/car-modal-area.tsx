"use client";

import type { CardItem } from "./card";
import { CarModal } from "./maincard";
import type { BoxLink } from "../lib/boxes";
import { CAR_PATH_PREFIX, useCarModal } from "../lib/use-car-modal";

type CarModalAreaProps = {
  // The cars whose links open the modal. Keep this to the cars linked inside the area: it ships with the page.
  cars: CardItem[];
  boxesByCar: Record<string, BoxLink[]>;
  className?: string;
  children: React.ReactNode;
};

// Wraps server-rendered car links (plain <a href="/car/<token>">) so a plain click opens the car modal from `cars`
// instead of loading the car page, the same way the /car grid does. The links themselves stay plain <a> tags:
// modified and middle clicks, and links to cars not in `cars`, still load the full car page.
export function CarModalArea({ cars, boxesByCar, className, children }: CarModalAreaProps) {
  const { openCar, openCarModal, carsByToken } = useCarModal(cars);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const link = (event.target as Element).closest("a");
    if (!link || link.target || link.origin !== window.location.origin) return;
    if (!link.pathname.startsWith(CAR_PATH_PREFIX)) return;

    const car = carsByToken.get(link.pathname.slice(CAR_PATH_PREFIX.length));
    if (!car) return;

    event.preventDefault();
    openCarModal(car);
  };

  return (
    // Clicks are caught here as they bubble up from the links, so the links can stay in server components.
    // Keyboard users are covered too: Enter on a focused link fires the same click event.
    <div className={className} onClick={handleClick}>
      {children}
      {openCar ? <CarModal key={openCar.token} card={openCar} boxes={boxesByCar[openCar._id]} /> : null}
    </div>
  );
}
