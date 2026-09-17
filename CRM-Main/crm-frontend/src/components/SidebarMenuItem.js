import Link from "next/link";

export default function SidebarMenuItem({
  href,
  icon,
  label,
  active,
  collapsed,
  onClick,
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        className={`flex items-center py-2.5 transition-all duration-300 group rounded-xl ${
          active
            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40"
            : "text-slate-400 hover:bg-white/5 hover:text-white"
        } ${
          collapsed 
            ? "justify-center px-0 w-11 h-11 mx-auto" 
            : "px-4 gap-3"
        }`}
      >
        <span
          className={`text-lg transition-all duration-300 flex-shrink-0 ${
            active ? "scale-110" : "group-hover:scale-110 group-hover:text-indigo-400"
          }`}
        >
          {icon}
        </span>
        {!collapsed && (
          <span className="whitespace-nowrap font-medium tracking-wide truncate">
            {label}
          </span>
        )}
      </Link>
    </li>
  );
}
