import { Navigate } from 'react-router-dom';

// Cart, order review, and checkout submission all now live on /cart.
// This route is kept so old links/bookmarks still land somewhere useful.
const Checkout = () => <Navigate to="/cart" replace />;

export default Checkout;
