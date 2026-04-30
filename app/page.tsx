"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import {
  ShieldCheck,
  Radio,
  Compass,
  Zap,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Target,
  Users,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ui/score-ring";
import { useRef } from "react";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

function FeatureCard({
  icon,
  title,
  description,
  color,
  delay = 0,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="group relative p-6 rounded-2xl bg-surface-01 border border-border hover:border-border-strong transition-all duration-300"
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}
      >
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-iris/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.div>
  );
}

function StatCard({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="text-center"
    >
      <div className="flex items-center justify-center gap-2 mb-2">
        {icon}
        <span className="text-4xl font-bold font-mono text-text-primary">{value}</span>
      </div>
      <span className="text-sm text-text-secondary">{label}</span>
    </motion.div>
  );
}

function AnimatedScore() {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", duration: 1.5, delay: 0.5 }}
      className="relative"
    >
      <ScoreRing score={87} size="xl" />
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.2 }}
        className="absolute -right-24 top-4 px-3 py-1.5 bg-jade-dim border border-jade/30 rounded-lg"
      >
        <span className="text-xs text-jade font-medium">Excellent</span>
      </motion.div>
    </motion.div>
  );
}

function HeroVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="relative"
    >
      <div className="relative bg-surface-01 border border-border rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-coral" />
          <div className="w-3 h-3 rounded-full bg-amber" />
          <div className="w-3 h-3 rounded-full bg-jade" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-tertiary mb-1">Sprint Health</p>
              <p className="text-2xl font-bold font-mono text-text-primary">87</p>
            </div>
            <AnimatedScore />
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { label: "Stories", value: "24", trend: "+3" },
              { label: "Velocity", value: "42", trend: "+8%" },
              { label: "Quality", value: "91%", trend: "+5%" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + i * 0.1 }}
                className="bg-surface-02 rounded-lg p-3"
              >
                <p className="text-xs text-text-tertiary">{stat.label}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold font-mono text-text-primary">
                    {stat.value}
                  </span>
                  <span className="text-xs text-jade">{stat.trend}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="flex items-center gap-2 pt-2"
          >
            <Badge variant="excellent" size="sm">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Insights Available
            </Badge>
          </motion.div>
        </div>
      </div>

      <motion.div
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        className="absolute -bottom-4 -left-4 w-20 h-20 bg-iris/20 rounded-full blur-xl"
      />
      <motion.div
        animate={{
          y: [0, 10, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        className="absolute -top-4 -right-4 w-32 h-32 bg-jade/20 rounded-full blur-xl"
      />
    </motion.div>
  );
}

export default function LandingPage() {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  return (
    <div className="min-h-screen bg-canvas">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 bg-canvas/80 backdrop-blur-lg border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-iris to-iris-light flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-text-primary">FORGE</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
              Features
            </Link>
            <Link href="#modules" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
              Modules
            </Link>
            <Link href="/demo" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
              Demo
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">
                Get Started
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section ref={targetRef} className="relative pt-32 pb-20 px-6 overflow-hidden">
        <motion.div style={{ opacity, scale }} className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp}>
                <Badge variant="info" className="mb-6">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI-Powered Program Intelligence
                </Badge>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-text-primary leading-tight mb-6"
              >
                Transform Your
                <br />
                <span className="text-iris">Agile Delivery</span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-lg text-text-secondary mb-8 max-w-lg"
              >
                FORGE brings AI-powered insights to your sprints, stakeholder updates,
                and PI planning. Built for Scrum Masters, PMs, and RTEs who want
                clarity without the noise.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
                <Link href="/signup">
                  <Button size="lg">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button variant="secondary" size="lg">
                    View Live Demo
                  </Button>
                </Link>
              </motion.div>

              <motion.div
                variants={fadeInUp}
                className="flex items-center gap-6 mt-8 pt-8 border-t border-border"
              >
                {[
                  { icon: <CheckCircle2 className="w-4 h-4 text-jade" />, text: "No credit card required" },
                  { icon: <CheckCircle2 className="w-4 h-4 text-jade" />, text: "JIRA integration" },
                  { icon: <CheckCircle2 className="w-4 h-4 text-jade" />, text: "14-day free trial" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                    {item.icon}
                    {item.text}
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <div className="hidden lg:block">
              <HeroVisual />
            </div>
          </div>
        </motion.div>

        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-iris/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-jade/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 border-y border-border bg-surface-01">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCard
            value="40%"
            label="Time saved on reporting"
            icon={<Clock className="w-5 h-5 text-iris" />}
          />
          <StatCard
            value="3x"
            label="Faster stakeholder updates"
            icon={<TrendingUp className="w-5 h-5 text-jade" />}
          />
          <StatCard
            value="85%"
            label="Story quality improvement"
            icon={<Target className="w-5 h-5 text-amber" />}
          />
          <StatCard
            value="500+"
            label="Teams using FORGE"
            icon={<Users className="w-5 h-5 text-coral" />}
          />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="default" className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-4">
              Everything you need to deliver better
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Three powerful modules that work together to give you complete visibility
              into your program&apos;s health and progress.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<ShieldCheck className="w-6 h-6 text-jade" />}
              title="Quality Gate"
              description="AI-powered story scoring that analyzes your backlog against customizable rubrics. Catch quality issues before they impact your sprint."
              color="bg-jade-dim"
              delay={0}
            />
            <FeatureCard
              icon={<Radio className="w-6 h-6 text-iris" />}
              title="Signal"
              description="Generate stakeholder updates in seconds. AI drafts tailored messages for executives, teams, and customers based on your sprint data."
              color="bg-iris-dim"
              delay={0.1}
            />
            <FeatureCard
              icon={<Compass className="w-6 h-6 text-amber" />}
              title="Horizon"
              description="Visual PI planning with dependency mapping, capacity modeling, and AI-powered risk analysis. Plan your increments with confidence."
              color="bg-amber-dim"
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* Modules Deep Dive */}
      <section id="modules" className="py-24 px-6 bg-surface-01">
        <div className="max-w-7xl mx-auto space-y-24">
          {[
            {
              title: "Quality Gate",
              subtitle: "AI-Powered Story Scoring",
              description:
                "Every story in your backlog gets scored against your team's definition of ready. FORGE analyzes completeness, clarity, testability, and more to surface stories that need attention before they enter your sprint.",
              features: [
                "Customizable scoring rubrics",
                "Automated quality analysis",
                "Improvement suggestions",
                "Sprint health dashboard",
              ],
              icon: <ShieldCheck className="w-8 h-8" />,
              color: "jade",
              align: "left",
            },
            {
              title: "Signal",
              subtitle: "Stakeholder Communication",
              description:
                "Stop spending hours writing status updates. FORGE generates audience-appropriate drafts for executives, team members, and customers. Review, edit, and send via email or Slack in minutes.",
              features: [
                "Multi-audience drafts",
                "Tone customization",
                "Email & Slack integration",
                "Decision logging",
              ],
              icon: <Radio className="w-8 h-8" />,
              color: "iris",
              align: "right",
            },
            {
              title: "Horizon",
              subtitle: "Visual PI Planning",
              description:
                "Plan your Program Increments with an interactive canvas. Map features to iterations, visualize dependencies, model team capacity, and let AI surface risks before they become blockers.",
              features: [
                "Drag-and-drop canvas",
                "Dependency visualization",
                "Capacity modeling",
                "AI risk analysis",
              ],
              icon: <Compass className="w-8 h-8" />,
              color: "amber",
              align: "left",
            },
          ].map((module, i) => (
            <motion.div
              key={module.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className={`grid md:grid-cols-2 gap-12 items-center ${
                module.align === "right" ? "md:flex-row-reverse" : ""
              }`}
            >
              <div className={module.align === "right" ? "md:order-2" : ""}>
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-${module.color}-dim text-${module.color}`}
                >
                  {module.icon}
                </div>
                <h3 className="text-sm font-medium text-text-tertiary uppercase tracking-wider mb-2">
                  {module.subtitle}
                </h3>
                <h2 className="text-3xl font-display font-bold text-text-primary mb-4">
                  {module.title}
                </h2>
                <p className="text-text-secondary mb-6">{module.description}</p>
                <ul className="space-y-3">
                  {module.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-text-secondary">
                      <CheckCircle2 className={`w-5 h-5 text-${module.color}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div
                className={`bg-surface-02 rounded-2xl border border-border p-8 ${
                  module.align === "right" ? "md:order-1" : ""
                }`}
              >
                <div className="aspect-video bg-canvas rounded-lg flex items-center justify-center">
                  <div className={`text-${module.color}/30`}>
                    {module.icon}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-6">
            Ready to transform your agile delivery?
          </h2>
          <p className="text-lg text-text-secondary mb-8 max-w-2xl mx-auto">
            Join hundreds of teams using FORGE to deliver better software, faster.
            Start your free trial today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/signup">
              <Button size="lg">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="secondary" size="lg">
                Explore Demo
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-iris to-iris-light flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-lg font-bold text-text-primary">FORGE</span>
            </div>

            <div className="flex items-center gap-8 text-sm text-text-secondary">
              <Link href="/demo" className="hover:text-text-primary transition-colors">
                Demo
              </Link>
              <Link href="/login" className="hover:text-text-primary transition-colors">
                Sign In
              </Link>
              <Link href="/signup" className="hover:text-text-primary transition-colors">
                Sign Up
              </Link>
            </div>

            <p className="text-sm text-text-tertiary">
              2026 FORGE. Built for agile teams.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
