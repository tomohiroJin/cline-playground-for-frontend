export interface Popup {
  x: number;
  y: number;
  text: string;
  life: number;
}

export function updatePopups(popups: Popup[]): Popup[] {
  return popups
    .map(popup => ({ ...popup, y: popup.y - 0.4, life: popup.life - 1 }))
    .filter(popup => popup.life > 0);
}
