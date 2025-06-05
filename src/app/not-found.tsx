export default function NotFound() {
  return (
    <div className="container mx-auto p-4 md:p-8 font-code flex justify-center items-center min-h-[calc(100vh-10rem)]">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
        <p className="text-muted-foreground mb-6">The page you're looking for doesn't exist.</p>
        <a 
          href="/" 
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Return to Campaigns
        </a>
      </div>
    </div>
  );
} 