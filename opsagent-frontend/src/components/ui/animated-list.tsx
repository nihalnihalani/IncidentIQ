import { motion, AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'

interface AnimatedListProps {
  children: ReactNode[]
  className?: string
  delay?: number
}

export function AnimatedList({ children, className, delay = 0.08 }: AnimatedListProps) {
  return (
    <div className={className}>
      <AnimatePresence>
        {children.map((child, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{
              duration: 0.35,
              delay: i * delay,
              ease: [0.21, 0.47, 0.32, 0.98],
            }}
          >
            {child}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
