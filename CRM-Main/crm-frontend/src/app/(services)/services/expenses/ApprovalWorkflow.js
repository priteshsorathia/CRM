"use client";
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const STEPS = [
  { role: 'Employee', desc: 'Expense submitted' },
  { role: 'Manager', desc: 'Manager review' },
  { role: 'Accountant', desc: 'Finance verification' },
];

const stepStatus = (step, currentStep, expStatus) => {
  if (expStatus === 'Rejected') {
    if (step < currentStep) return 'done';
    if (step === currentStep) return 'rejected';
    return 'upcoming';
  }
  if (expStatus === 'Reimbursed') return 'done';
  if (step < currentStep) return 'done';
  if (step === currentStep) return 'active';
  return 'upcoming';
};

function WorkflowRow({ expense }) {
  const { title, code, amount, status, approvalStep } = expense;

  const stepStyle = {
    done: { circle: 'bg-green-500 border-green-500 text-white', line: 'bg-green-400', label: 'text-green-700' },
    active: { circle: 'bg-indigo-600 border-indigo-600 text-white', line: 'bg-gray-200', label: 'text-indigo-700' },
    rejected: { circle: 'bg-red-500 border-red-500 text-white', line: 'bg-gray-200', label: 'text-red-700' },
    upcoming: { circle: 'bg-white border-gray-300 text-gray-400', line: 'bg-gray-200', label: 'text-gray-400' },
  };

  const statusBadge = {
    Pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    Approved: 'bg-green-50 text-green-700 border border-green-200',
    Rejected: 'bg-red-50 text-red-700 border border-red-200',
    Reimbursed: 'bg-blue-50 text-blue-700 border border-blue-200',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-gray-100">
        <div>
          <p className="font-bold text-gray-900">{title}</p>
          <p className="text-xs text-indigo-600 font-semibold mt-0.5">{code}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold text-gray-900 text-lg">₹{Number(amount || 0).toLocaleString()}</span>
          <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${statusBadge[status]}`}>{status}</span>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-start gap-0">
        {STEPS.map((step, idx) => {
          const st = stepStatus(idx, Number(approvalStep || 0), status);
          const style = stepStyle[st];
          const isLast = idx === STEPS.length - 1;

          return (
            <div key={step.role} className="flex items-start flex-1">
              <div className="flex flex-col items-center w-full">
                <div className="flex items-center w-full">
                  <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-bold flex-shrink-0 ${style.circle}`}>
                    {st === 'done' && <CheckCircle2 size={16} />}
                    {st === 'active' && <Clock size={15} />}
                    {st === 'rejected' && <AlertCircle size={15} />}
                    {st === 'upcoming' && <span className="text-xs">{idx + 1}</span>}
                  </div>
                  {!isLast && <div className={`flex-1 h-0.5 ${style.line} mx-1`} />}
                </div>

                <div className="mt-2.5 w-full pr-2">
                  <p className={`text-xs font-bold ${style.label}`}>{step.role}</p>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">{step.desc}</p>
                  {st === 'done' && <p className="text-[10px] text-green-600 font-bold mt-0.5">✓ Complete</p>}
                  {st === 'active' && <p className="text-[10px] text-indigo-600 font-bold mt-0.5">In Review</p>}
                  {st === 'rejected' && <p className="text-[10px] text-red-600 font-bold mt-0.5">× Rejected</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ApprovalWorkflow({ expenses }) {
  const relevant = (Array.isArray(expenses) ? expenses : []).filter((e) =>
    ['Pending', 'Approved', 'Rejected'].includes(e.status)
  );

  if (relevant.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm font-medium">
        No expenses pending approval.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {relevant.map((exp) => (
        <WorkflowRow key={exp.dbId || exp.code} expense={exp} />
      ))}
    </div>
  );
}
