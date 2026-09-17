// "use client";

// import Image from "next/image";
// import { motion } from "framer-motion";

// export default function AuthCard({ children }) {
//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 30, scale: 0.97 }}
//       animate={{ opacity: 1, y: 0, scale: 1 }}
//       transition={{ duration: 0.6, ease: "easeOut" }}
//       whileHover={{ scale: 1.01 }}
//       className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden"
//     >
//       <div className="p-8 sm:p-10">
//         {/* Logo */}
//         <div className="flex justify-center mb-6">
//           <div className="w-20 h-20 relative">
//             <Image
//               src="/shop-logo.png"
//               alt="Company Logo"
//               fill
//               priority
//               className="object-contain"
//             />
//           </div>
//         </div>

//         {children}
//       </div>
//     </motion.div>
//   );
// }

"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AuthCard({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-md bg-white rounded-2xl shadow-2xl"
    >
      <div className="p-10">
        <div className="flex justify-center mb-8">
          <Link href="/auth/login" className="hover:opacity-80 transition-opacity">
            <Image
              src="/shop-logo.png"
              alt="CRM Logo"
              width={64}
              height={64}
              className="object-contain"
            />
          </Link>
        </div>
        {children}
      </div>
    </motion.div>
  );
}
