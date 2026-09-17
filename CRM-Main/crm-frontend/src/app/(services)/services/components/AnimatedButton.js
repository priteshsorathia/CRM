"use client";
import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa";

export default function AnimatedButton({ icon, title, description, delay = 0 }) {
    return (
        <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: delay, ease: [0.23, 1, 0.32, 1] }}
            whileHover={{ x: 4 }}
            className="group w-full flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-indigo-100 hover:shadow-sm transition-all text-left"
        >
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-gray-50 rounded-xl text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    {icon}
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-gray-800 group-hover:text-indigo-900 transition-colors">{title}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{description}</p>
                </div>
            </div>
            <FaArrowRight className="text-gray-300 opacity-0 group-hover:opacity-100 group-hover:text-indigo-400 transition-all -translate-x-4 group-hover:translate-x-0" />
        </motion.button>
    );
}
