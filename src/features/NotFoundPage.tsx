import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '@/components/ui/States';

export default function NotFoundPage() {
  return (
    <EmptyState
      className="min-h-[60vh]"
      icon={<Compass className="size-4" aria-hidden />}
      title="This page does not exist"
      description="The link may be out of date."
      action={
        <Link to="/" className="text-ui text-accent hover:underline">
          Go to the dashboard
        </Link>
      }
    />
  );
}
