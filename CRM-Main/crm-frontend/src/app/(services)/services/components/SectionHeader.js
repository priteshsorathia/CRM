"use client";
export default function SectionHeader({ title, subtitle, rightElement }) {
    return (
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100">
            <div>
                <h2 className="text-xl font-light text-gray-900 tracking-tight">{title}</h2>
                {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
            </div>
            {rightElement && <div>{rightElement}</div>}
        </div>
    );
}
