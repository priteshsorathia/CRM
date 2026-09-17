"use client";
import { motion } from "framer-motion";

export default function GlassCard({ children, className = "", delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: delay, ease: [0.23, 1, 0.32, 1] }}
            className={`bg-white/70 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 p-6 ${className}`}
        >
            {children}
        </motion.div>
    );
}
