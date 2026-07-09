export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      <p className="mt-4 text-sm text-slate-500">{message}</p>
    </div>
  );
}
