export function AdminLoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-admin-accent border-t-transparent" />
      <p className="mt-4 text-sm text-text-secondary">Loading&hellip;</p>
    </div>
  );
}
