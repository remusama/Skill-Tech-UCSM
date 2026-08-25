"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Compass, UserCheck, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Compass,
    title: "Adaptive Learning Paths",
    description: "Your curriculum is not static. It evolves based on your performance, keeping you challenged but never overwhelmed.",
  },
  {
    icon: UserCheck,
    title: "AI-Powered Mentorship",
    description: "Get instant feedback, guidance, and support from Eleonor, your personal AI mentor, available 24/7.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Skill Analysis",
    description: "Visualize your progress with our detailed analytics. Understand your strengths and pinpoint areas for improvement.",
  },
  {
    icon: Zap,
    title: "Interactive Practice",
    description: "Solidify your knowledge with hands-on exercises, quizzes, and real-world projects tailored to your skill level.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5 },
  },
};

export function Features() {
  return (
    <section className="py-20 sm:py-32 bg-black/20">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={itemVariants}
          className="text-center"
        >
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Why Skilltech is Different</h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-400">
            We've built a smarter way to learn. Here's how we empower you to succeed.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
          className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -5 }}
              className="h-full"
            >
              <Card className="h-full transform-gpu bg-white/5 backdrop-blur-sm transition-all duration-300 hover:bg-white/10">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/20">
                    <feature.icon className="h-6 w-6 text-purple-400" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
