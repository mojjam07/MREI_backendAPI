// @desc    Generate placeholder image
// @route   GET /api/placeholder/:width/:height
// @access  Public
const getPlaceholder = (req, res) => {
  try {
    const { width, height } = req.params;

    // Validate dimensions
    const w = parseInt(width);
    const h = parseInt(height);

    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0 || w > 2000 || h > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Invalid dimensions. Width and height must be positive integers between 1 and 2000.'
      });
    }

    // Generate SVG placeholder
    const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="placeholderTitle" aria-describedby="placeholderDesc">
      <title id="placeholderTitle">Placeholder Image</title>
      <desc id="placeholderDesc">A placeholder image with dimensions ${w}x${h}</desc>
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <rect x="10%" y="10%" width="80%" height="80%" fill="#e5e7eb" stroke="#d1d5db" stroke-width="2"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${Math.min(w, h) * 0.1}" fill="#6b7280" text-anchor="middle" dominant-baseline="middle">
        ${w} × ${h}
      </text>
    </svg>`;

    // Set headers for SVG response
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.status(200).send(svg);
  } catch (error) {
    console.error('Placeholder generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating placeholder'
    });
  }
};

module.exports = {
  getPlaceholder
};
