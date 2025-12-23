/**
 * Route validation middleware to validate that routes exist before processing
 * This helps catch 404 errors early and provides better error messages
 */

const validateRouteExists = (validRoutes) => {
  return (req, res, next) => {
    const { method, path } = req;
    const routeKey = `${method.toUpperCase()} ${path}`;
    
    // Check if the route is valid
    if (validRoutes.has(routeKey)) {
      return next();
    }
    
    // Log the invalid route for debugging
    console.warn(`Invalid route accessed: ${routeKey}`);
    
    // Check if it's a similar route (maybe typo)
    const similarRoutes = Array.from(validRoutes)
      .filter(([route]) => route.split(' ')[1] === path)
      .map(([route]) => route);
    
    let errorMessage = `Route not found: ${method.toUpperCase()} ${path}`;
    
    if (similarRoutes.length > 0) {
      errorMessage += `. Did you mean: ${similarRoutes.join(', ')}?`;
    }
    
    return res.status(404).json({
      success: false,
      message: errorMessage,
      available_methods: validRoutes.has(`GET ${path}`) ? ['GET'] : 
                       validRoutes.has(`POST ${path}`) ? ['POST'] :
                       validRoutes.has(`PUT ${path}`) ? ['PUT'] :
                       validRoutes.has(`DELETE ${path}`) ? ['DELETE'] : [],
      timestamp: new Date().toISOString()
    });
  };
};

// Function to collect all valid routes from all route files
const collectValidRoutes = (app) => {
  const routes = new Set();
  
  // Get all registered routes
  const stack = app._router.stack;
  stack.forEach((layer) => {
    if (layer.route) {
      const path = layer.route.path;
      Object.keys(layer.route.methods).forEach(method => {
        if (layer.route.methods[method]) {
          routes.add(`${method.toUpperCase()} ${path}`);
        }
      });
    }
  });
  
  return routes;
};

module.exports = {
  validateRouteExists,
  collectValidRoutes
};
