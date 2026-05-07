export function isStandaloneDisplayMode() {
  return window.matchMedia("(display-mode: standalone)").matches
}
