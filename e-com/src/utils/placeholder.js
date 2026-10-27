// Neutral inline placeholder shown when a product image fails to load.
export const productPlaceholder =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(`
<svg xmlns='http://www.w3.org/2000/svg' width='800' height='800' viewBox='0 0 800 800'>
  <rect width='800' height='800' fill='#eef0f4'/>
  <g transform='translate(310 250)'>
    <rect x='0' y='20' width='180' height='230' rx='14' fill='#d4d7de'/>
    <path d='M30 90 L-20 60 L-5 10 L185 10 L200 60 L150 90 Z' fill='#c4c8d0'/>
    <path d='M45 90 a45 45 0 0 1 90 0' fill='none' stroke='#c4c8d0' stroke-width='14'/>
  </g>
  <text x='400' y='640' font-family='sans-serif' font-size='28' fill='#a3a8b2' text-anchor='middle'>ShopNest</text>
</svg>`);

// Reusable onError handler for product images.
export const handleImgError = (e) => {
    e.currentTarget.src = productPlaceholder;
};
