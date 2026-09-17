import PayrollPreviewClient from "./components/PayrollPreviewClient";

export default function PayrollPreviewPage({ params, searchParams }) {
  const { id } = params;
  const printMode = searchParams?.print === "1";
  return <PayrollPreviewClient id={id} printMode={printMode} />;
}

