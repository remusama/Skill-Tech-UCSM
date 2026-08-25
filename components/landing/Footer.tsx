"use client";

import { motion, Variants } from "framer-motion";

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

export function Footer() {
  return (
    <motion.footer
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.5 }}
      variants={itemVariants}
      className="py-8"
    >
      <div className="container mx-auto flex flex-col items-center justify-between px-4 sm:flex-row">
        <p className="text-sm text-gray-500">
          © {new Date().getFullYear()} Skilltech. All rights reserved.
        </p>
        <div className="mt-4 flex space-x-6 sm:mt-0">
          <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">
            Terms of Service
          </a>
        </div>
      </div>
    </motion.footer>
  );
}
