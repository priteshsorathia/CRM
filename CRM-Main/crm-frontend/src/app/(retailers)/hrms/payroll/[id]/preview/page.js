import PayrollPreviewClient from './components/PayrollPreviewClient';

export default function PayrollPreviewPage({ params, searchParams }) {
  // 1. Get ID from the URL folder [id]
  const { id } = params;

  // 2. Check if ?print=1 is in the URL (for auto-printing)
  const printMode = searchParams?.print === '1';

  // 3. Render the Client Component
  return <PayrollPreviewClient id={id} printMode={printMode} />;
}