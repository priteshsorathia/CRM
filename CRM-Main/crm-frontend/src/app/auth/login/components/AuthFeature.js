// "use client";

// import { motion } from "framer-motion";

// export default function AuthFeature({ icon, title, description, delay = 0 }) {
//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ delay, duration: 0.5, ease: "easeOut" }}
//       className="flex items-start space-x-4"
//     >
//       <div className="bg-indigo-100 p-2 rounded-full flex-shrink-0">
//         {icon}
//       </div>
//       <div>
//         <h3 className="font-medium text-gray-900">{title}</h3>
//         <p className="text-gray-600 text-sm mt-1">{description}</p>
//       </div>
//     </motion.div>
//   );
// }

"use client";

import { motion } from "framer-motion";

export default function AuthFeature({ icon, title, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 shadow-sm"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
        {icon}
      </div>
      <span className="text-sm font-medium text-gray-800">
        {title}
      </span>
    </motion.div>
  );
}
