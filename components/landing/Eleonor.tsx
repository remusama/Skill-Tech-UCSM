"use client";

import { motion, Variants } from "framer-motion";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
      staggerChildren: 0.3,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export function Eleonor() {
  return (
    <section className="py-20 sm:py-32">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={containerVariants}
          className="overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600/10 to-indigo-600/10 p-8 md:p-12"
        >
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-3">
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="mx-auto"
            >
              <div className="flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 shadow-2xl shadow-purple-500/30">
                <Bot className="h-24 w-24 text-white" />
              </div>
            </motion.div>
            <div className="md:col-span-2">
              <motion.h2 variants={itemVariants} className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Meet Eleonor, Your AI Mentor
              </motion.h2>
              <motion.p variants={itemVariants} className="mt-4 text-lg text-gray-300">
                Eleonor is the core of the Skilltech experience. More than just a chatbot, she's a sophisticated AI designed to guide, support, and challenge you. She provides personalized feedback, answers your questions in context, and helps you build a deep, lasting understanding of any subject.
              </motion.p>
              <motion.div variants={itemVariants} className="mt-6">
                 <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="outline" size="lg" className="border-2 border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-black">
                        Learn about the AI
                    </Button>
                 </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
