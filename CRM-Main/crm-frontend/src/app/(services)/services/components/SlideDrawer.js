"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';

export default function SlideDrawer({ isOpen, onClose, title, children }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-gray-950/30 backdrop-blur-sm z-40"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-2xl z-50 flex flex-col border-l border-gray-100"
                    >
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white backdrop-blur-md sticky top-0 z-10">
                            <h2 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h2>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
                            >
                                <FaTimes size={16} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto w-full p-6">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
