import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '../components/ui';

export default function NotFound() {
  return <EmptyState icon={Compass} title="Sahifa topilmadi" text="Bunday manzil mavjud emas." action={<Link to="/" className="btn-primary">Bosh sahifa</Link>} />;
}
