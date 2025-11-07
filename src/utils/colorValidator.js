// utils/colorValidator.js
// Utility to validate color values at runtime

const validHex = /^#([A-Fa-f0-9]{3,8})$/;
const validNames = [
  'white', 'black', 'red', 'blue', 'green', 'yellow', 'gray', 'grey', 'purple', 'orange', 'pink', 'brown', 'cyan', 'magenta',
  'transparent', 'inherit', 'initial', 'unset'
];

export function validateColor(color, label) {
  if (
    !color ||
    (typeof color === 'string' &&
      !validHex.test(color) &&
      !validNames.includes(color) &&
      !color.startsWith('rgb') &&
      !color.startsWith('hsl'))
  ) {
    // eslint-disable-next-line no-console
    console.error(`Invalid color value for ${label}:`, color);
  }
}
