'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();
  
  return (
    <button
      onClick={() => router.back()}
      className="btn btn-outline mb-4 flex items-center gap-2"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to Attendance
    </button>
  );
}
