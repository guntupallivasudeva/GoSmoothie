/**
 * Product validation middleware.
 * Detects create vs update from req.method: POST = create, PUT = update.
 * Returns { error: "{field} {reason}" } on first violation with HTTP 400.
 */

const VALID_TYPES = ['Vegetarian', 'Vegan', 'Non-Vegetarian'];
const META_NUMERIC_FIELDS = ['calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar'];

function validateProduct(req, res, next) {
  const isCreate = req.method === 'POST';
  const body = req.body || {};

  // --- name ---
  if (isCreate) {
    if (body.name === undefined || body.name === null) {
      return res.status(400).json({ error: 'name is required' });
    }
    const trimmed = String(body.name).trim();
    if (trimmed.length === 0) {
      return res.status(400).json({ error: 'name is required' });
    }
    if (trimmed.length > 120) {
      return res.status(400).json({ error: 'name must be 120 characters or fewer' });
    }
  } else if (body.name !== undefined) {
    const trimmed = String(body.name).trim();
    if (trimmed.length === 0) {
      return res.status(400).json({ error: 'name must not be empty' });
    }
    if (trimmed.length > 120) {
      return res.status(400).json({ error: 'name must be 120 characters or fewer' });
    }
  }

  // --- description ---
  if (body.description !== undefined && body.description !== null) {
    if (String(body.description).length > 2000) {
      return res.status(400).json({ error: 'description must be 2000 characters or fewer' });
    }
  }

  // --- price ---
  if (body.price !== undefined && body.price !== null) {
    const price = Number(body.price);
    if (isNaN(price) || !isFinite(price)) {
      return res.status(400).json({ error: 'price must be a valid number' });
    }
    if (price < 0.01 || price > 999999.99) {
      return res.status(400).json({ error: 'price must be between 0.01 and 999999.99' });
    }
    // Check max 2 decimal places
    const priceStr = String(body.price);
    const dotIndex = priceStr.indexOf('.');
    if (dotIndex !== -1 && priceStr.length - dotIndex - 1 > 2) {
      return res.status(400).json({ error: 'price must have at most 2 decimal places' });
    }
  } else if (isCreate) {
    // price is required on create (implied by requirement: price > 0 required)
    return res.status(400).json({ error: 'price is required' });
  }

  // --- category ---
  if (body.category !== undefined && body.category !== null) {
    if (typeof body.category !== 'string' || body.category.trim().length === 0) {
      return res.status(400).json({ error: 'category must be a non-empty string' });
    }
  }

  // --- type ---
  if (body.type !== undefined && body.type !== null) {
    if (!VALID_TYPES.includes(body.type)) {
      return res.status(400).json({ error: 'type must be one of: Vegetarian, Vegan, Non-Vegetarian' });
    }
  }

  // --- featuredOrder ---
  if (body.featuredOrder !== undefined && body.featuredOrder !== null) {
    const fo = Number(body.featuredOrder);
    if (!Number.isInteger(fo) || fo < 0 || fo > 9999) {
      return res.status(400).json({ error: 'featuredOrder must be an integer between 0 and 9999' });
    }
  }

  // --- meta numeric fields ---
  if (body.meta && typeof body.meta === 'object') {
    for (const field of META_NUMERIC_FIELDS) {
      if (body.meta[field] !== undefined && body.meta[field] !== null) {
        const val = Number(body.meta[field]);
        if (isNaN(val) || !isFinite(val)) {
          return res.status(400).json({ error: `meta.${field} must be a valid number` });
        }
        if (val < 0 || val > 5000) {
          return res.status(400).json({ error: `meta.${field} must be between 0 and 5000` });
        }
      }
    }

    // --- meta.ingredients ---
    if (body.meta.ingredients !== undefined && body.meta.ingredients !== null) {
      if (String(body.meta.ingredients).length > 1000) {
        return res.status(400).json({ error: 'meta.ingredients must be 1000 characters or fewer' });
      }
    }
  }

  // --- image (URL/path validation) ---
  if (body.image !== undefined && body.image !== null) {
    const image = String(body.image).trim();
    if (image.length > 0) {
      // Length check first (per requirement 3.3)
      if (image.length > 2048) {
        return res.status(400).json({ error: 'image must be 2048 characters or fewer' });
      }

      // Determine format
      const lowerImage = image.toLowerCase();

      if (lowerImage.startsWith('http://') || lowerImage.startsWith('https://')) {
        // Validate URL: must have non-empty host, no whitespace
        try {
          const parsed = new URL(image);
          if (!parsed.hostname) {
            return res.status(400).json({ error: 'image URL must have a non-empty host' });
          }
        } catch (e) {
          return res.status(400).json({ error: 'image must be a valid URL or server-relative path' });
        }
        // No whitespace
        if (/\s/.test(image)) {
          return res.status(400).json({ error: 'image URL must not contain whitespace' });
        }
      } else if (image.startsWith('/')) {
        // Server-relative path: no ".." segments, no backslashes
        if (image.includes('..')) {
          return res.status(400).json({ error: 'image path must not contain ".." segments' });
        }
        if (image.includes('\\')) {
          return res.status(400).json({ error: 'image path must not contain backslashes' });
        }
      } else {
        // Not a valid format — reject data:, javascript:, file:, and anything else
        return res.status(400).json({ error: 'image must be a valid http/https URL or a server-relative path starting with /' });
      }
    }
  }

  next();
}

module.exports = { validateProduct };
