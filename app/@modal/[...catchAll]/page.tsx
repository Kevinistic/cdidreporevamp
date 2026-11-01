// A slot keeps showing its last match across client navigations, so any route the modal doesn't
// intercept has to match this to close it.
export default function CatchAll() {
  return null;
}
