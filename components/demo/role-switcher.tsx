"use client";

/**
 * Role Switcher - Demo persona selector
 * Allows users to view the app from different role perspectives
 */

import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  ShieldCheck,
  Briefcase,
  Network,
  Train,
  Code2,
  Building2,
  ChevronDown,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/stores/demo-store";
import { ROLE_DEFINITIONS, type UserRole } from "@/lib/onboarding/roles";
import { useState, useRef, useEffect } from "react";

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  scrum_master: <ShieldCheck className="w-4 h-4" />,
  product_manager: <Briefcase className="w-4 h-4" />,
  program_manager: <Network className="w-4 h-4" />,
  rte: <Train className="w-4 h-4" />,
  engineering_manager: <Users className="w-4 h-4" />,
  developer: <Code2 className="w-4 h-4" />,
  executive: <Building2 className="w-4 h-4" />,
};

const ROLE_COLORS: Record<UserRole, string> = {
  scrum_master: "text-iris bg-iris/10 border-iris/20",
  product_manager: "text-jade bg-jade/10 border-jade/20",
  program_manager: "text-amber bg-amber/10 border-amber/20",
  rte: "text-sky bg-sky/10 border-sky/20",
  engineering_manager: "text-coral bg-coral/10 border-coral/20",
  developer: "text-iris bg-iris/10 border-iris/20",
  executive: "text-gold bg-gold/10 border-gold/20",
};

interface RoleSwitcherProps {
  expanded?: boolean;
}

export function RoleSwitcher({ expanded = true }: RoleSwitcherProps) {
  const { selectedRole, setRole } = useDemoStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentRole = ROLE_DEFINITIONS[selectedRole];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const roles = Object.values(ROLE_DEFINITIONS);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
          "hover:bg-surface-02",
          ROLE_COLORS[selectedRole]
        )}
      >
        {ROLE_ICONS[selectedRole]}
        {expanded && (
          <>
            <span className="text-sm font-medium">{currentRole.name}</span>
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform",
              isOpen && "rotate-180"
            )} />
          </>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute top-full mt-2 z-50",
              "w-80 p-2 rounded-xl border border-border",
              "bg-surface-01 shadow-xl",
              expanded ? "left-0" : "left-0"
            )}
          >
            <div className="px-3 py-2 mb-2">
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                View as Persona
              </p>
            </div>

            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {roles.map((role) => {
                const isSelected = role.id === selectedRole;
                return (
                  <button
                    key={role.id}
                    onClick={() => {
                      setRole(role.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all",
                      isSelected
                        ? "bg-iris/10 border border-iris/20"
                        : "hover:bg-surface-02 border border-transparent"
                    )}
                  >
                    <div className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                      ROLE_COLORS[role.id]
                    )}>
                      {ROLE_ICONS[role.id]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">
                          {role.name}
                        </span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-iris" />
                        )}
                      </div>
                      <p className="text-xs text-text-tertiary mt-0.5 line-clamp-1">
                        {role.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {role.primaryModules.map((mod) => (
                          <span
                            key={mod}
                            className="px-1.5 py-0.5 rounded text-xs bg-surface-03 text-text-secondary capitalize"
                          >
                            {mod.replace('-', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-2 pt-2 border-t border-border px-3 pb-1">
              <p className="text-xs text-text-tertiary">
                Switch personas to see role-specific dashboards and features
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function RoleBadge() {
  const { selectedRole } = useDemoStore();
  const role = ROLE_DEFINITIONS[selectedRole];

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium",
      ROLE_COLORS[selectedRole]
    )}>
      {ROLE_ICONS[selectedRole]}
      <span>{role.name}</span>
    </div>
  );
}
