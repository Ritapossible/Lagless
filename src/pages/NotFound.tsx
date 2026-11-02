import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="flex min-h-[100svh] items-center justify-center bg-background px-6">
    <div className="text-center">
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="mt-2 text-[28px] font-medium">This lane doesn't go anywhere</h1>
      <Link to="/" className="btn-secondary mt-6">Back to home</Link>
    </div>
  </div>
);

export default NotFound;
